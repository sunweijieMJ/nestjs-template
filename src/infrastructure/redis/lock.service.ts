import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import Redis from 'ioredis';
import { AllConfigType } from '../../config/config.type';

/** 单条 Redis 命令的超时，超时后退回本实例内的锁 */
const COMMAND_TIMEOUT_MS = 1000;

/** 值等于持有者 token 时才删除 */
const RELEASE_SCRIPT = `if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end`;

interface LocalLock {
  token: string;
  timer: NodeJS.Timeout;
}

/**
 * 带过期时间的互斥占位：启用 Redis 时跨实例生效，Redis 未启用或不可用时仅在本实例内生效
 */
@Injectable()
export class LockService implements OnModuleDestroy {
  private readonly logger = new Logger(LockService.name);
  private readonly client: Redis | null;
  private readonly localLocks = new Map<string, LocalLock>();

  constructor(configService: ConfigService<AllConfigType>) {
    if (!configService.get('redis.enabled', { infer: true })) {
      this.client = null;
      return;
    }

    this.client = new Redis({
      host: configService.get('redis.host', { infer: true }),
      port: configService.get('redis.port', { infer: true }),
      password: configService.get('redis.password', { infer: true }),
      db: configService.get('redis.db', { infer: true }),
      keyPrefix: 'lock:',
      connectTimeout: 5000,
      commandTimeout: COMMAND_TIMEOUT_MS,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });
    this.client.on('error', (error: Error) => {
      this.logger.warn(`Redis lock error: ${error.message}`);
    });
  }

  /** 在 ttlMs 内独占 key，成功时返回释放用的 token，已被占用时返回 null */
  async tryAcquire(key: string, ttlMs: number): Promise<string | null> {
    const token = randomUUID();
    if (this.client) {
      try {
        return (await this.client.set(key, token, 'PX', ttlMs, 'NX')) === 'OK' ? token : null;
      } catch (error) {
        this.logger.warn(`Redis lock unavailable, using local lock for ${key}: ${this.messageOf(error)}`);
      }
    }
    return this.tryAcquireLocally(key, token, ttlMs) ? token : null;
  }

  /** 仍由 token 持有时释放 key */
  async release(key: string, token: string): Promise<void> {
    const local = this.localLocks.get(key);
    if (local?.token === token) {
      clearTimeout(local.timer);
      this.localLocks.delete(key);
    }
    if (this.client) {
      await this.client.eval(RELEASE_SCRIPT, 1, key, token).catch((error: unknown) => {
        this.logger.warn(`Failed to release lock ${key}: ${this.messageOf(error)}`);
      });
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.localLocks.forEach((lock) => clearTimeout(lock.timer));
    this.localLocks.clear();
    await this.client?.quit().catch(() => undefined);
  }

  private tryAcquireLocally(key: string, token: string, ttlMs: number): boolean {
    if (this.localLocks.has(key)) {
      return false;
    }
    const timer = setTimeout(() => {
      if (this.localLocks.get(key)?.token === token) {
        this.localLocks.delete(key);
      }
    }, ttlMs);
    timer.unref();
    this.localLocks.set(key, { token, timer });
    return true;
  }

  private messageOf(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
