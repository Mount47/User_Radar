# 管理端 & 用户端接口文档（全量能力）

> 目标：清晰区分管理员端与用户端的权限和接口范围，覆盖当前后端已实现的全部能力，前端可据此完成页面与交互开发。

## 0. 通用信息
- **Base URL**：`/api`
- **鉴权**：除登录外均需 `Authorization: Bearer <token>`；管理员接口使用 `hasRole('ADMIN')` 保护。
- **角色差异**：
  - **管理员端**：系统用户管理、审计日志、人员/设备/映射的全量 CRUD、批量操作、告警流转、数据清理等。
  - **用户端**：查看自身授权范围内的人员/设备/告警/数据，执行与自己相关的实时/历史查询；不允许修改资源。

## 1. 认证与个人视图
| 方法 | 路径 | 说明 | 角色 |
| --- | --- | --- | --- |
| POST | `/auth/login` | 账号密码登录，返回 `token`、`role`、`expiresIn`、`accessiblePersons` | 所有 |
| GET | `/me/profile` | 当前用户信息、角色、可管理范围 | 所有 |
| GET | `/me/persons` | 当前用户可见的人员列表（含绑定摘要） | 所有 |
| GET | `/me/devices` | 当前用户可见的设备及绑定状态 | 所有 |
| GET | `/me/alerts?limit=20` | 个人视角最近告警 | 所有 |

## 2. 管理端专属接口
### 2.1 系统用户管理（`UserController`）
| 方法 | 路径 | 功能 |
| --- | --- | --- |
| GET | `/users` | 列出系统用户 |
| GET | `/users/{id}` | 查看用户详情 |
| POST | `/users` | 创建用户（含角色、邮箱、姓名等） |
| PUT | `/users/{id}` | 更新用户信息 |
| DELETE | `/users/{id}` | 删除用户 |
| POST | `/users/{id}/reset-password` | 重置密码 |
| POST | `/users/{id}/lock` | 锁定账号 |
| POST | `/users/{id}/unlock` | 解锁账号 |

### 2.2 审计日志（`AuditLogController`）
| 方法 | 路径 | 功能 |
| --- | --- | --- |
| GET | `/admin/audit-logs?page=&size=&start=&end=&resourceType=&username=` | 分页查询审计记录，按时间/资源类型/用户名过滤 |

### 2.3 资源管理（可被用户只读访问）
> 以下接口管理员具备全量读写；普通用户仅能**只读**并被 `AuthScopeService` 过滤为授权对象。

**人员管理（`PersonController`）**
- GET `/persons`、`/persons/{personId}`、`/persons/department/{department}`、`/persons/search?name=`
- POST `/persons`、PUT `/persons/{personId}`、DELETE `/persons/{personId}`

**设备管理（`RadarDeviceController`）**
- 设备 CRUD 与注册：
  - GET `/radar/devices?page=&size=&modelType=&status=&location=`
  - POST `/radar/devices`、POST `/radar/devices/register`
  - PUT `/radar/devices/{deviceId}`、DELETE `/radar/devices/{deviceId}`
- 批量/辅助：PUT `/radar/devices/batch/status`、DELETE `/radar/devices/batch`、POST `/radar/devices/handle-conflict`、GET `/radar/devices/generate-unique-id`
- 状态查询：GET `/device-status/overview`、GET `/device-status/{deviceId}`

**绑定管理（`PersonDeviceMappingController`）**
- 创建/更新：POST `/person-device-mappings`、POST `/person-device-mappings/multi-bind`、PUT `/person-device-mappings/{mappingId}`
- 查询：`/person-device-mappings`、`/inactive`、`/{mappingId}`、`/device/{deviceId}/person`、`/person/{personId}/device`、`/person/{personId}/devices`、`/person/{personId}/mappings`、`/device/{deviceId}/all`、`/person/{personId}/all`、`/device/{deviceId}/has-active`
- 批量：PUT `/person-device-mappings/batch-safe`、PUT `/person-device-mappings/batch`、DELETE `/person-device-mappings/batch`
- 状态与清理：PUT `/person-device-mappings/{mappingId}/deactivate`、`/reactivate`；GET `/person-device-mappings/inactive`；DELETE `/person-device-mappings/cleanup?daysOld=`；DELETE `/person-device-mappings/device/{deviceId}`、`/person/{personId}`

### 2.4 告警管理
**呼吸/心跳异常（`VitalsAlertController`）**
- GET `/vitals-alerts`、`/{id}`、`/device/{deviceId}`、`/person/{personId}`、`/timerange?start=&end=`

**跌倒/位姿异常（`FallAlertController`）**
- 查询：GET `/fall-alerts/active`、`/fall-alerts`、`/fall-alerts/{id}`
- 过滤：GET `/fall-alerts/device/{deviceId}/active`、`/person/{personId}/active`、`/timerange`、`/device/{deviceId}/timerange`、`/person/{personId}/timerange`
- 处置：POST `/fall-alerts/{id}/pending`、`/resolved`、`/false-alarm`
- 统计：GET `/fall-alerts/statistics`

## 3. 用户端（及共享）数据接口
### 3.1 检测与概览
| 方法 | 路径 | 功能 | 角色 |
| --- | --- | --- | --- |
| GET | `/detection/status/{deviceId}` | 返回 DetectionStatus（设备信息、绑定人、是否有人、最新指标、lastUpdateTime） | 所有（按授权过滤） |
| GET | `/detection/status/all`、`/model-type/{modelType}`、`/with-person` | 大屏/监控筛选 | 所有 |
| GET | `/device-status/overview` | 全量设备心跳、在线状态、绑定、统计 | 管理员；用户视角可用 `/me/devices` |
| GET | `/radar/systems` | 枚举已接入雷达系统及对应 API/WebSocket 端点 | 所有 |

### 3.2 TI6843 Vital（生命体征）
- **设备管理**：`/ti6843/vital/devices` 系列（同 RadarDeviceController 的 CRUD/筛选逻辑，含绑定信息 GET `/device/{deviceId}/person`、绑定/解绑 `/bind` `/unbind`）。
- **实时数据**：GET `/ti6843/vital/data/realtime/{deviceId}`、GET `/ti6843/vital/data/person/{personId}/realtime`。
- **历史数据**：
  - GET `/ti6843/vital/data/historical/device/{deviceId}/timerange?start=&end=`
  - GET `/ti6843/vital/data/historical?deviceId=&start=&end=`（分页）
  - GET `/ti6843/vital/data/historical/summary?deviceId=`（均值/峰值/样本数）
- **通用便捷查询**：GET `/ti6843/vital/data/device/{deviceId}`、`/device/{deviceId}/timerange`、`/person/{personId}/data`、`/person/{personId}/data/timerange`。

### 3.3 TI6843 Posture（位姿）
- **设备 CRUD**：`/ti6843/posture/devices` 系列。
- **实时数据**：GET `/ti6843/posture/data/realtime/{deviceId}`、`/person/{personId}/realtime`。
- **历史数据**：GET `/ti6843/posture/data/device/{deviceId}`、`/device/{deviceId}/timerange`、`/historical/device/{deviceId}/timerange`（返回 TI6843HistoricalData）、`/person/{personId}/data`、`/person/{personId}/data/timerange`。

### 3.4 R60ABD1 生命体征
- **实时**：GET `/r60abd1/data/realtime/{deviceId}`。
- **历史**：GET `/r60abd1/data/historical/device/{deviceId}/timerange`、分页接口 `/r60abd1/data/historical`。
- **通用**：GET `/r60abd1/data/data/device/{deviceId}`、`/data/device/{deviceId}/timerange`、`/data/timerange`。

### 3.5 R77ABH1 生命体征
- 数据接入、模型检测、WebSocket 端点参见 `/radar/systems` 及 `/api/r77abh1/**`（支持实时推送与归档），前端可按 `apiBasePath` 调用对应 REST/WS 接口。

### 3.6 人员-设备绑定视角衍生接口
- GET `/ti6843/vital/device/{deviceId}/person`、POST `/bind`、DELETE `/unbind`（TI6843 专属）。
- GET `/person-device-mappings/device/{deviceId}/person`（通用查找设备对应人员）。
- GET `/detection/status/with-person`（快速找“有人”的设备）。

### 3.7 实时/历史呼吸心跳告警视图
- 用户端可只读访问 2.4 中的查询接口；管理员可进一步执行告警状态流转。

## 4. 前端集成提示
1. 登录后缓存 token 与 `expiresIn`，所有请求带 Bearer Token；过期前刷新或跳转登录。
2. 用户端页面仅展示授权范围的数据：人员/设备列表与告警查询均会被后端自动裁剪，无需额外过滤条件但可加搜索/筛选增强体验。
3. 实时图表调用 `/realtime` 接口建议 2~5 秒轮询；历史查询使用 ISO8601 时间参数（如 `2024-04-11T10:00:00`）。
4. 错误处理：接口常返回标准 HTTP 状态或 `{ "title": "...", "message": "..." }`，统一弹窗/Toast 提示。
5. 若需 WebSocket 展示（如 R77ABH1、R60ABD1），可用 `/ws/*` STOMP 或原生 `/ws-native/r60abd1` 与 `apiBasePath` 组合订阅实时数据。
