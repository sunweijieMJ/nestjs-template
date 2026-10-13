#!/usr/bin/env bash
# NestJS 本地开发环境管理脚本
# 使用方式: ./dev.sh {start|stop|restart|status}

set -e

COMPOSE_FILES="-f docker-compose.postgres.yaml -f docker-compose.redis.yaml"
DOCKER_DIR="docker"
PID_FILE=".dev.pid"
APP_PORT="${APP_PORT:-3000}"

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

# 检查端口是否被占用
check_port() {
  local port=$1
  if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    return 0  # 端口被占用
  else
    return 1  # 端口空闲
  fi
}

# 检查应用是否正在运行
is_app_running() {
  if [ -f "$PID_FILE" ]; then
    local pid=$(cat "$PID_FILE")
    if ps -p $pid > /dev/null 2>&1; then
      return 0  # 进程存在
    fi
  fi
  return 1  # 进程不存在
}

# 停止应用进程
stop_app_process() {
  if [ -f "$PID_FILE" ]; then
    local pid=$(cat "$PID_FILE")
    if ps -p $pid > /dev/null 2>&1; then
      echo "正在停止 NestJS 应用 (PID: $pid)..."
      kill $pid 2>/dev/null || true

      # 等待进程结束
      local count=0
      while ps -p $pid > /dev/null 2>&1 && [ $count -lt 10 ]; do
        sleep 1
        count=$((count + 1))
      done

      # 如果进程仍在运行，强制终止
      if ps -p $pid > /dev/null 2>&1; then
        echo "强制终止进程..."
        kill -9 $pid 2>/dev/null || true
      fi

      echo "✅ NestJS 应用已停止"
    fi
    rm -f "$PID_FILE"
  fi
}

start_services() {
  echo "=========================================="
  echo "启动 NestJS 本地开发环境"
  echo "=========================================="

  # 检查应用是否已经在运行
  if is_app_running; then
    echo ""
    echo "⚠️  应用已经在运行中！"
    echo "如需重启，请先运行: ./dev.sh stop"
    exit 1
  fi

  # 检查端口是否被占用
  if check_port $APP_PORT; then
    echo ""
    echo "❌ 端口 $APP_PORT 已被占用！"
    echo ""
    echo "占用端口的进程："
    lsof -i :$APP_PORT | grep LISTEN
    echo ""
    echo "请先停止占用端口的进程，或使用其他端口："
    echo "  APP_PORT=3001 ./dev.sh start"
    exit 1
  fi

  # 1. 启动 Docker 依赖服务
  echo ""
  echo "[1/4] 启动依赖服务 (PostgreSQL, Redis, Adminer)..."
  cd "$DOCKER_DIR"
  docker compose $COMPOSE_FILES up -d postgres adminer redis
  cd ..

  # 2. 等待数据库就绪
  echo ""
  echo "[2/4] 等待数据库就绪..."
  sleep 5

  # 3. 检查是否需要安装依赖
  if [ ! -d "node_modules" ]; then
    echo ""
    echo "首次运行，正在安装依赖..."
    pnpm install
  fi

  # 4. 检查是否需要运行迁移
  echo ""
  echo "[3/4] 检查数据库状态..."
  pnpm migration:run || echo "迁移已是最新状态"

  # 5. 启动开发服务器
  echo ""
  echo "=========================================="
  echo "✅ 准备完成！正在启动开发服务器..."
  echo "=========================================="
  echo ""
  echo "[4/4] 启动 NestJS 应用..."
  echo ""
  echo "访问地址:"
  echo "  - API 文档: http://localhost:$APP_PORT/docs"
  echo "  - API 健康: http://localhost:$APP_PORT/api/health"
  echo "  - Adminer:  http://localhost:8080"
  echo ""
  echo "按 Ctrl+C 停止服务器"
  echo ""

  # 设置信号处理，确保 Ctrl+C 时清理 PID 文件
  trap 'echo ""; echo "正在停止..."; rm -f "$PID_FILE"; exit 0' INT TERM

  # 启动应用并保存 PID
  pnpm start:dev &
  echo $! > "$PID_FILE"

  # 等待进程启动
  wait

  # 清理 PID 文件
  rm -f "$PID_FILE"
}

stop_services() {
  echo "=========================================="
  echo "停止 NestJS 本地开发环境"
  echo "=========================================="

  # 1. 停止 NestJS 应用
  echo ""
  echo "[1/2] 停止 NestJS 应用..."
  stop_app_process

  # 2. 停止 Docker 服务
  echo ""
  echo "[2/2] 停止 Docker 服务..."
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

  # 显示应用状态
  echo "📱 NestJS 应用状态:"
  if is_app_running; then
    local pid=$(cat "$PID_FILE")
    echo "  ✅ 运行中 (PID: $pid)"
    echo "  🌐 端口: $APP_PORT"
  else
    echo "  ❌ 未运行"
  fi

  echo ""
  echo "🐳 Docker 服务状态:"
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
