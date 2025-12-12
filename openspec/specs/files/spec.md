# Files Module Specification

## Purpose

文件管理模块，提供文件上传和持久化存储功能。采用适配器模式支持多种存储后端：本地文件系统存储 (Local)、AWS S3 直接上传 (S3)、AWS S3 预签名 URL 上传 (S3-Presigned)。通过配置切换存储方式，业务代码无需修改。文件上传需要用户认证。

## Requirements

### Requirement: File Domain Entity

系统 SHALL 定义 File 领域实体，包含以下属性：

| 属性 | 类型 | 说明 |
|------|------|------|
| id | string | 主键 (UUID) |
| path | string | 文件存储路径 |

#### Scenario: File entity structure
- **WHEN** 文件被创建
- **THEN** 系统生成唯一的 ID
- **AND** 记录文件的存储路径

---

### Requirement: Storage Adapters

系统 SHALL 支持多种存储后端，通过配置切换：

- `local` - 本地文件系统存储
- `s3` - AWS S3 直接上传
- `s3-presigned` - AWS S3 预签名 URL 上传

#### Scenario: Local storage
- **WHEN** 配置为 `local` 模式
- **THEN** 文件存储在服务器本地 `./files` 目录

#### Scenario: S3 storage
- **WHEN** 配置为 `s3` 模式
- **THEN** 文件直接上传到配置的 S3 bucket

#### Scenario: S3 presigned storage
- **WHEN** 配置为 `s3-presigned` 模式
- **THEN** 服务端生成预签名 URL
- **AND** 客户端使用该 URL 直接上传到 S3

---

### Requirement: File Upload (Local)

系统 SHALL 允许已认证用户上传文件到本地存储。

#### Scenario: Upload file success
- **WHEN** 用户携带有效的 JWT token
- **AND** 以 `multipart/form-data` 格式上传文件
- **THEN** 文件保存到本地 `./files` 目录
- **AND** 创建 File 记录
- **AND** 返回 FileResponseDto（包含 file 信息）

#### Scenario: Download file
- **WHEN** 请求 `GET /files/:path`
- **THEN** 返回对应的文件内容

---

### Requirement: File Upload (S3 Presigned)

系统 SHALL 允许已认证用户通过预签名 URL 上传文件到 S3。

#### Scenario: Request upload URL
- **WHEN** 用户提供文件名和类型
- **THEN** 服务端创建 File 记录
- **AND** 生成 S3 预签名上传 URL
- **AND** 返回 File 信息和 uploadSignedUrl

#### Scenario: Client upload to S3
- **WHEN** 客户端使用 uploadSignedUrl 上传文件
- **THEN** 文件直接上传到 S3（绕过服务端）

---

### Requirement: File Query

系统 SHALL 提供文件查询功能供其他模块使用。

#### Scenario: Find file by ID
- **WHEN** 其他服务通过 ID 查询文件
- **THEN** 返回对应的 File 实体或 null

#### Scenario: Find files by IDs
- **WHEN** 其他服务通过多个 ID 批量查询文件
- **THEN** 返回对应的 File 实体数组

---

### Requirement: Authentication

文件上传端点 SHALL 要求用户认证。

#### Scenario: Authenticated upload
- **WHEN** 用户携带有效的 JWT token 请求上传
- **THEN** 请求被允许

#### Scenario: Unauthenticated upload denied
- **WHEN** 用户未携带 JWT token 请求上传
- **THEN** 返回 HTTP 401 Unauthorized
