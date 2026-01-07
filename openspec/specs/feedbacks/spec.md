# Feedbacks Module Specification

## Purpose

反馈功能模块，提供用户反馈提交和查询功能。支持多种反馈类型（Bug 报告、功能建议、投诉等），用户可以提交反馈内容、上传图片、留下联系方式。管理员可以查看和处理反馈。采用六边形架构，支持 PostgreSQL 和 MongoDB 双数据库。

## Requirements

### Requirement: Feedback Domain Entity

系统 SHALL 定义 Feedback 领域实体，包含以下属性：

| 属性      | 类型             | 说明                                                |
| --------- | ---------------- | --------------------------------------------------- |
| id        | number \| string | 主键                                                |
| userId    | number \| string | 用户 ID                                             |
| type      | FeedbackType     | 反馈类型（bug、suggestion、complaint 等）           |
| content   | string           | 反馈内容                                            |
| images    | string[] \| null | 反馈图片（可选）                                    |
| contact   | string \| null   | 联系方式（可选）                                    |
| status    | FeedbackStatus   | 处理状态（pending、processing、resolved、rejected） |
| createdAt | Date             | 创建时间                                            |
| updatedAt | Date             | 更新时间                                            |

#### Scenario: Feedback entity structure

- **WHEN** 反馈被创建
- **THEN** 系统生成唯一的 ID
- **AND** 关联到当前用户
- **AND** 默认状态为 pending

---

### Requirement: Submit Feedback

系统 SHALL 允许用户提交反馈。

#### Scenario: Submit feedback success

- **WHEN** 用户提交反馈
- **AND** 提供 type、content
- **THEN** 创建反馈记录
- **AND** 状态设置为 pending
- **AND** 返回反馈信息

#### Scenario: Submit feedback with images

- **WHEN** 用户提交反馈并上传图片
- **THEN** 保存图片 URL 列表
- **AND** 创建反馈记录

---

### Requirement: List Feedbacks

系统 SHALL 允许用户查询自己的反馈列表。

#### Scenario: List feedbacks with pagination

- **WHEN** 用户请求反馈列表
- **THEN** 返回该用户的所有反馈
- **AND** 支持分页（page、limit）
- **AND** 支持按类型和状态筛选

#### Scenario: Get feedback by ID

- **WHEN** 用户请求特定反馈详情
- **THEN** 返回反馈详细信息
