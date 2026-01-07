# Addresses Module Specification

## Purpose

地址管理模块，提供用户收货地址的完整 CRUD 功能。支持创建、查询、更新、删除地址，以及设置默认地址。每个用户最多可保存 20 个地址，系统自动管理默认地址逻辑（首个地址自动设为默认，删除默认地址时自动指定新的默认地址）。采用六边形架构，支持 PostgreSQL 和 MongoDB 双数据库。

## Requirements

### Requirement: Address Domain Entity

系统 SHALL 定义 Address 领域实体，包含以下属性：

| 属性      | 类型             | 说明           |
| --------- | ---------------- | -------------- |
| id        | number \| string | 主键           |
| userId    | number \| string | 用户 ID        |
| name      | string           | 收货人姓名     |
| phone     | string           | 收货人手机号   |
| province  | string           | 省份           |
| city      | string           | 城市           |
| district  | string           | 区/县          |
| address   | string           | 详细地址       |
| isDefault | boolean          | 是否为默认地址 |
| createdAt | Date             | 创建时间       |
| updatedAt | Date             | 更新时间       |

#### Scenario: Address entity structure

- **WHEN** 地址被创建
- **THEN** 系统生成唯一的 ID
- **AND** 关联到当前用户
- **AND** 记录完整的地址信息

---

### Requirement: Create Address

系统 SHALL 允许用户创建收货地址。

#### Scenario: Create address success

- **WHEN** 用户提供有效的地址信息
- **AND** 用户地址数量未达到上限（20个）
- **THEN** 创建新地址
- **AND** 如果是首个地址，自动设为默认地址
- **AND** 如果标记为默认，清除其他地址的默认标记
- **AND** 返回创建的地址信息

#### Scenario: Create address with max limit

- **WHEN** 用户已有 20 个地址
- **THEN** 返回 HTTP 403
- **AND** 错误信息为 `maxAddressesReached`

---

### Requirement: List Addresses

系统 SHALL 允许用户查询自己的地址列表。

#### Scenario: List addresses with pagination

- **WHEN** 用户请求地址列表
- **THEN** 返回该用户的所有地址
- **AND** 支持分页（page、limit）
- **AND** 支持筛选和排序

#### Scenario: Get address by ID

- **WHEN** 用户请求特定地址
- **AND** 地址属于该用户
- **THEN** 返回地址详情

#### Scenario: Get address not owned

- **WHEN** 用户请求不属于自己的地址
- **THEN** 返回 HTTP 404
- **AND** 错误信息为 `addressNotFound`

---

### Requirement: Get Default Address

系统 SHALL 允许用户快速获取默认地址。

#### Scenario: Get default address success

- **WHEN** 用户请求默认地址 `GET /addresses/default`
- **AND** 用户有默认地址
- **THEN** 返回默认地址信息

#### Scenario: No default address

- **WHEN** 用户请求默认地址
- **AND** 用户没有默认地址
- **THEN** 返回 null

---

### Requirement: Update Address

系统 SHALL 允许用户更新自己的地址。

#### Scenario: Update address success

- **WHEN** 用户更新地址信息
- **AND** 地址属于该用户
- **THEN** 更新地址信息
- **AND** 如果设为默认，清除其他地址的默认标记
- **AND** 返回更新后的地址

#### Scenario: Update address not owned

- **WHEN** 用户尝试更新不属于自己的地址
- **THEN** 返回 HTTP 404
- **AND** 错误信息为 `addressNotFound`

---

### Requirement: Set Default Address

系统 SHALL 允许用户设置默认地址。

#### Scenario: Set default address success

- **WHEN** 用户设置某个地址为默认
- **AND** 地址属于该用户
- **THEN** 清除其他地址的默认标记
- **AND** 将该地址设为默认
- **AND** 返回更新后的地址

---

### Requirement: Delete Address

系统 SHALL 允许用户删除自己的地址。

#### Scenario: Delete address success

- **WHEN** 用户删除地址
- **AND** 地址属于该用户
- **THEN** 删除该地址
- **AND** 返回 HTTP 204

#### Scenario: Delete default address

- **WHEN** 用户删除默认地址
- **THEN** 删除该地址
- **AND** 如果还有其他地址，自动将第一个地址设为默认
