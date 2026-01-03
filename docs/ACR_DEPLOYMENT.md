# ACR + ECS 部署指南

本文档说明如何使用阿里云容器镜像服务 (ACR) 和 GitHub Actions 进行自动化部署。

## 架构说明

```
GitHub Actions 构建镜像 → 推送到 ACR → SSH 到 ECS 拉取镜像 → 重启容器
```

### 优势

- 构建在 GitHub Actions 进行，不占用 ECS 资源
- 镜像存储在国内，拉取速度快（几秒钟）
- 支持镜像版本管理和快速回滚
- 部署时间短，服务中断时间最小化
- 可复用镜像层，节省存储和带宽

---

## 步骤 1: 创建阿里云容器镜像服务 (ACR)

### 1.1 开通 ACR 服务

访问 [阿里云容器镜像服务](https://cr.console.aliyun.com/)

选择版本：

- **个人版**（推荐）：免费，适合个人和小团队
  - 3 个命名空间
  - 300 个镜像仓库
  - 每月 10GB 流量
- **企业版**：约 50-300 元/月，适合企业

### 1.2 创建命名空间

1. 进入容器镜像服务控制台
2. 选择区域（建议选择与 ECS 同区域，如 `cn-hangzhou`）
3. 点击【命名空间】→【创建命名空间】
4. 输入命名空间名称，例如：`my-app` 或 `production`
5. 选择【私有】（推荐）或【公开】

### 1.3 创建镜像仓库

1. 点击【镜像仓库】→【创建镜像仓库】
2. 填写信息：
   - 仓库名称：`nestjs-api`
   - 命名空间：选择上一步创建的命名空间
   - 摘要：NestJS API 服务
   - 类型：私有
   - 代码源：不绑定（我们使用 GitHub Actions 推送）

### 1.4 获取访问凭证

1. 点击右上角头像 → 【访问凭证】
2. 设置 Registry 登录密码（首次使用需要设置）
3. 记录以下信息：
   - 用户名：通常是你的阿里云账号
   - 密码：刚才设置的 Registry 密码
   - 仓库地址：`registry.cn-hangzhou.aliyuncs.com`（根据你的区域）

---

## 步骤 2: 配置 GitHub Secrets

在你的 GitHub 仓库中配置以下 Secrets：

访问：`https://github.com/YOUR_USERNAME/nestjs-template/settings/secrets/actions`

### 2.1 ACR 相关配置（新增）

| Secret 名称     | 说明             | 示例值                              |
| --------------- | ---------------- | ----------------------------------- |
| `ACR_REGISTRY`  | ACR 镜像仓库地址 | `registry.cn-hangzhou.aliyuncs.com` |
| `ACR_NAMESPACE` | ACR 命名空间     | `my-app` 或 `production`            |
| `ACR_USERNAME`  | ACR 用户名       | 你的阿里云账号                      |
| `ACR_PASSWORD`  | ACR 密码         | Registry 登录密码                   |

### 2.2 ECS 相关配置（原有配置保留）

| Secret 名称          | 说明          | 示例值                                   |
| -------------------- | ------------- | ---------------------------------------- |
| `ALIYUN_HOST`        | ECS 服务器 IP | `120.0.0.1`                              |
| `ALIYUN_PORT`        | SSH 端口      | `22`                                     |
| `ALIYUN_USER`        | SSH 用户名    | `root`                                   |
| `ALIYUN_SSH_KEY`     | SSH 私钥      | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `ALIYUN_DEPLOY_PATH` | 部署目录      | `/www/nestjs-app`                        |

---

## 步骤 3: 服务器端配置

### 3.1 准备部署目录

SSH 登录到你的 ECS 服务器：

```bash
# 创建部署目录
mkdir -p /www/nestjs-app/docker
cd /www/nestjs-app

# 创建 .env 文件（复制你的环境变量）
cat > .env << EOF
APP_PORT=3000
DATABASE_TYPE=postgres
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USERNAME=your_db_user
DATABASE_PASSWORD=your_db_password
DATABASE_NAME=nestjs_db

REDIS_HOST=redis
REDIS_PORT=6379

# 其他环境变量...
EOF
```

### 3.2 复制 docker-compose 文件到服务器

```bash
# 方式 1: 手动复制（首次部署）
# 将项目中的 docker/docker-compose.ecs.yaml 复制到服务器的 /www/nestjs-app/docker/ 目录

# 方式 2: 使用 scp
scp docker/docker-compose.ecs.yaml root@YOUR_ECS_IP:/www/nestjs-app/docker/

# 方式 3: 使用 git clone（只需要配置文件）
git clone --depth 1 --filter=blob:none --sparse https://github.com/YOUR_USERNAME/nestjs-template.git
cd nestjs-template
git sparse-checkout set docker
```

### 3.3 登录 ACR

在 ECS 服务器上登录 ACR（只需首次执行）：

```bash
docker login \
  --username=YOUR_ACR_USERNAME \
  --password=YOUR_ACR_PASSWORD \
  registry.cn-hangzhou.aliyuncs.com
```

---

## 步骤 4: 部署流程

### 4.1 自动部署（推荐）

#### 触发方式 1: 推送 Tag

```bash
# 本地打标签并推送
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions 会自动：

1. 构建 Docker 镜像
2. 推送到 ACR（标签为 `v1.0.0`）
3. SSH 到 ECS 服务器
4. 拉取镜像并重启服务

#### 触发方式 2: 手动触发

1. 访问 GitHub Actions 页面
2. 选择 `Deploy` workflow
3. 点击 `Run workflow`
4. 选择分支（默认 main）
5. 点击 `Run workflow` 按钮

### 4.2 手动部署（调试用）

在 ECS 服务器上手动操作：

```bash
cd /www/nestjs-app

# 登录 ACR
docker login registry.cn-hangzhou.aliyuncs.com

# 拉取镜像
export IMAGE_FULL_NAME="registry.cn-hangzhou.aliyuncs.com/my-app/nestjs-api:v1.0.0"
docker pull ${IMAGE_FULL_NAME}

# 启动服务
docker compose -f docker/docker-compose.ecs.yaml up -d

# 查看日志
docker compose -f docker/docker-compose.ecs.yaml logs -f api

# 检查健康状态
docker compose -f docker/docker-compose.ecs.yaml ps
curl http://localhost:3000/api
```

---

## 步骤 5: 回滚操作

如果新版本有问题，可以快速回滚到之前的版本：

```bash
cd /www/nestjs-app

# 查看可用的镜像版本
docker images registry.cn-hangzhou.aliyuncs.com/my-app/nestjs-api

# 回滚到指定版本
export IMAGE_FULL_NAME="registry.cn-hangzhou.aliyuncs.com/my-app/nestjs-api:v1.0.0"
docker compose -f docker/docker-compose.ecs.yaml up -d

# 或者回滚到上一个 latest
export IMAGE_FULL_NAME="registry.cn-hangzhou.aliyuncs.com/my-app/nestjs-api:latest"
docker pull ${IMAGE_FULL_NAME}
docker compose -f docker/docker-compose.ecs.yaml up -d
```

---

## 常见问题

### Q1: ACR 登录失败

```bash
Error response from daemon: Get https://registry.cn-hangzhou.aliyuncs.com/v2/: unauthorized
```

**解决方案：**

- 检查用户名和密码是否正确
- 确认已在阿里云控制台设置 Registry 登录密码
- 密码中如果有特殊字符，使用单引号包裹

### Q2: 镜像拉取慢

**解决方案：**

- 确保 ECS 和 ACR 在同一区域
- 使用阿里云内网地址：`registry-vpc.cn-hangzhou.aliyuncs.com`（需要 VPC 网络）

修改服务器上的镜像地址：

```bash
export IMAGE_FULL_NAME="registry-vpc.cn-hangzhou.aliyuncs.com/my-app/nestjs-api:v1.0.0"
```

同时修改 GitHub Secrets 中的 `ACR_REGISTRY`。

### Q3: 如何查看部署日志

```bash
# 在 GitHub Actions 页面查看构建日志

# 在 ECS 服务器查看应用日志
docker compose -f docker/docker-compose.ecs.yaml logs -f api

# 查看最近 100 行日志
docker compose -f docker/docker-compose.ecs.yaml logs --tail=100 api
```

### Q4: 首次部署失败

确认清单：

- [ ] ACR 仓库已创建
- [ ] GitHub Secrets 已配置正确
- [ ] ECS 服务器已登录 ACR
- [ ] 部署目录已创建并包含 .env 文件
- [ ] docker-compose.ecs.yaml 文件已上传到服务器
- [ ] ECS 服务器可以访问 ACR（网络连通）

### Q5: 如何切换镜像版本

方式 1: 在服务器上设置环境变量

```bash
export IMAGE_FULL_NAME="registry.cn-hangzhou.aliyuncs.com/my-app/nestjs-api:v2.0.0"
docker compose -f docker/docker-compose.ecs.yaml up -d
```

方式 2: 创建 .env 文件（推荐）

```bash
# 在 /www/nestjs-app 目录下
cat > .env.image << EOF
IMAGE_FULL_NAME=registry.cn-hangzhou.aliyuncs.com/my-app/nestjs-api:v2.0.0
EOF

docker compose -f docker/docker-compose.ecs.yaml --env-file .env.image up -d
```

---

## 成本分析

### ACR 个人版（免费）

- 存储：前 10GB 免费
- 流量：每月 10GB 免费
- 适用场景：个人项目、小团队项目

### 估算示例

假设：

- 镜像大小：500MB
- 部署频率：每天 2 次
- 保留版本：10 个

**存储成本：** 500MB × 10 = 5GB（免费额度内）
**流量成本：** 500MB × 2 × 30 = 30GB/月（超出 20GB）

超出部分按量计费：约 0.5 元/GB × 20GB = 10 元/月

### 成本优化建议

1. 定期清理旧镜像（脚本已自动保留最新 3 个版本）
2. 使用内网地址拉取镜像（不计流量费用）
3. 优化 Dockerfile，减小镜像体积

---

## 监控与维护

### 查看镜像列表

```bash
# 在 ACR 控制台查看
# 或使用 docker 命令
docker images registry.cn-hangzhou.aliyuncs.com/my-app/nestjs-api
```

### 清理旧镜像

```bash
# 保留最新 5 个版本，删除其他
docker images "registry.cn-hangzhou.aliyuncs.com/my-app/nestjs-api" \
  --format "{{.ID}} {{.CreatedAt}}" | \
  sort -rk 2 | \
  tail -n +6 | \
  awk '{print $1}' | \
  xargs -r docker rmi -f
```

### 设置告警

在阿里云云监控中配置告警：

- 容器 CPU 使用率 > 80%
- 容器内存使用率 > 80%
- 容器重启次数异常

---

## 对比：旧方案 vs 新方案

| 对比项         | 旧方案（Git Pull + 本地构建） | 新方案（ACR + 镜像拉取） |
| -------------- | ----------------------------- | ------------------------ |
| 部署时间       | 5-10 分钟                     | 1-2 分钟                 |
| 网络依赖       | GitHub（不稳定）              | ACR（国内稳定）          |
| 服务器资源占用 | 高（需要构建）                | 低（只需拉取）           |
| 回滚速度       | 慢（需要重新构建）            | 快（切换镜像）           |
| 版本管理       | 依赖 Git                      | 镜像标签管理             |
| 多机部署       | 困难                          | 简单                     |
| 失败恢复       | 困难                          | 容易                     |

---

## 下一步优化方向

1. **蓝绿部署**：使用 Nginx 实现零停机部署
2. **健康检查增强**：集成应用级健康检查
3. **自动化测试**：在 GitHub Actions 中添加集成测试
4. **多环境管理**：配置 dev、staging、production 环境
5. **监控告警**：集成 Prometheus + Grafana
6. **日志收集**：集成阿里云 SLS 或 ELK

---

如有问题，请查看：

- [阿里云 ACR 文档](https://help.aliyun.com/product/60716.html)
- [GitHub Actions 文档](https://docs.github.com/actions)
