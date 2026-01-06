#!/usr/bin/env bash
# NestJS 本地开发环境管理脚本
# 使用方式: ./dev.sh {start|stop|restart|status}

set -e

COMPOSE_FILES="-f docker-compose.postgres.yaml -f docker-compose.redis.yaml"
DOCKER_DIR="docker"

show_usage() {
  echo "=========================================="
  echo "NestJS 本地开发环境管理"
  echo "=========================================="
  echo ""
  echo "使用方式:"
  echo "  ./dev.sh start    - 启动开发环境"
  echo "  ./dev.sh stop     - 停止开发环境"
  echo "  ./dev.sh restart  - 重启开发环境"
  echo "  ./dev.sh status   - 查看服务状态"
  echo ""
}

start_services() {
  echo "=========================================="
  echo "启动 NestJS 本地开发环境"
  echo "=========================================="

  # 1. 启动 Docker 依赖服务
  echo ""
  echo "[1/3] 启动依赖服务 (PostgreSQL, Redis, Adminer)..."
  cd "$DOCKER_DIR"
  docker compose $COMPOSE_FILES up -d postgres adminer redis
  cd ..

  # 2. 等待数据库就绪
  echo ""
  echo "[2/3] 等待数据库就绪..."
  sleep 5

  # 3. 检查是否需要安装依赖
  if [ ! -d "node_modules" ]; then
    echo ""
    echo "首次运行，正在安装依赖..."
    pnpm install
  fi

  # 4. 检查是否需要运行迁移
  echo ""
  echo "[3/3] 检查数据库状态..."
  npm run migration:run || echo "迁移已是最新状态"

  # 5. 启动开发服务器
  echo ""
  echo "=========================================="
  echo "✅ 准备完成！正在启动开发服务器..."
  echo "=========================================="
  echo ""
  echo "访问地址:"
  echo "  - API 文档: http://localhost:3000/docs"
  echo "  - API 健康: http://localhost:3000/api/health"
  echo "  - Adminer:  http://localhost:8080"
  echo ""
  echo "按 Ctrl+C 停止服务器"
  echo ""

  npm run start:dev
}

stop_services() {
  echo "=========================================="
  echo "停止 NestJS 本地开发环境"
  echo "=========================================="

  echo ""
  echo "停止 Docker 服务..."
  cd "$DOCKER_DIR"
  docker compose $COMPOSE_FILES down
  cd ..

  echo ""
  echo "✅ 所有服务已停止"
}

restart_services() {
  echo "=========================================="
  echo "重启 NestJS 本地开发环境"
  echo "=========================================="

  stop_services
  echo ""
  sleep 2
  start_services
}

show_status() {
  echo "=========================================="
  echo "NestJS 本地开发环境状态"
  echo "=========================================="
  echo ""

  cd "$DOCKER_DIR"
  docker compose $COMPOSE_FILES ps
  cd ..
}

# 主逻辑
case "${1:-}" in
  start)
    start_services
    ;;
  stop)
    stop_services
    ;;
  restart)
    restart_services
    ;;
  status)
    show_status
    ;;
  *)
    show_usage
    exit 1
    ;;
esac
