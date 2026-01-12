# Favorites Module Specification

## Purpose

收藏功能模块，提供用户收藏管理的完整功能。支持收藏多种类型的目标对象（文章、商品、视频等），提供添加收藏、查询收藏列表、检查收藏状态、取消收藏、切换收藏状态等功能。采用六边形架构，使用 PostgreSQL 数据库。

## Requirements

### Requirement: Favorite Domain Entity

系统 SHALL 定义 Favorite 领域实体，包含以下属性：

| 属性       | 类型                        | 说明                                   |
| ---------- | --------------------------- | -------------------------------------- |
| id         | number \| string            | 主键                                   |
| userId     | number \| string            | 用户 ID                                |
| targetType | FavoriteTargetType          | 目标类型（如 article、product、video） |
| targetId   | string                      | 目标对象 ID                            |
| title      | string \| null              | 收藏标题（可选）                       |
| image      | string \| null              | 收藏图片（可选）                       |
| extra      | Record<string, any> \| null | 额外信息（可选）                       |
| createdAt  | Date                        | 创建时间                               |
| updatedAt  | Date                        | 更新时间                               |

#### Scenario: Favorite entity structure

- **WHEN** 收藏被创建
- **THEN** 系统生成唯一的 ID
- **AND** 关联到当前用户和目标对象
- **AND** 记录收藏的元信息

---

### Requirement: Add Favorite

系统 SHALL 允许用户添加收藏。

#### Scenario: Add favorite success

- **WHEN** 用户收藏某个对象
- **AND** 该对象未被收藏
- **THEN** 创建收藏记录
- **AND** 返回收藏信息

#### Scenario: Add duplicate favorite

- **WHEN** 用户收藏已收藏的对象
- **THEN** 返回 HTTP 409
- **AND** 错误信息为 `alreadyFavorited`

---

### Requirement: List Favorites

系统 SHALL 允许用户查询自己的收藏列表。

#### Scenario: List favorites with pagination

- **WHEN** 用户请求收藏列表
- **THEN** 返回该用户的所有收藏
- **AND** 支持分页（page、limit）
- **AND** 支持按目标类型筛选

---

### Requirement: Check Favorite Status

系统 SHALL 允许用户检查某个对象是否已收藏。

#### Scenario: Check favorite status

- **WHEN** 用户通过 `POST /favorites/check` 查询某个对象的收藏状态
- **AND** 提供 targetType 和 targetId
- **THEN** 返回是否已收藏（isFavorited）
- **AND** 如果已收藏，返回收藏 ID（favoriteId）

---

### Requirement: Remove Favorite

系统 SHALL 允许用户取消收藏。

#### Scenario: Remove favorite success

- **WHEN** 用户取消收藏
- **AND** 收藏属于该用户
- **THEN** 删除收藏记录
- **AND** 返回 HTTP 204

#### Scenario: Remove favorite not owned

- **WHEN** 用户尝试删除不属于自己的收藏
- **THEN** 返回 HTTP 404
- **AND** 错误信息为 `favoriteNotFound`

---

### Requirement: Toggle Favorite

系统 SHALL 提供切换收藏状态的便捷方法。

#### Scenario: Toggle favorite on

- **WHEN** 用户切换未收藏的对象
- **THEN** 创建收藏记录
- **AND** 返回 isFavorited=true 和收藏信息

#### Scenario: Toggle favorite off

- **WHEN** 用户切换已收藏的对象
- **THEN** 删除收藏记录
- **AND** 返回 isFavorited=false
