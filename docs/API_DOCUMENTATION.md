# 后端接口文档

本文档基于 `src/main/java/com/example/radar/controller` 下的控制器整理，概述主要接口的路径、方法、请求参数、认证需求以及典型响应格式。

## 认证接口（/api/auth）

### POST /api/auth/login
- **说明**：用户名密码登录，返回 JWT 令牌与可访问人员数量。
- **请求体**（JSON）：`{ "username": string, "password": string }`。
- **响应**：
  - 成功 `200 OK`：`{ "token": string, "username": string, "role": string, "expiresIn": number, "accessiblePersons": number }`
  - 账户锁定 `423 Locked`：`"账户已锁定，请在{lockMinutes}分钟后重试或联系管理员解锁"`
  - 认证失败 `401 Unauthorized`：`"用户名或密码错误"`
- **认证**：否。

### POST /api/auth/refresh
- **说明**：使用 `Authorization: Bearer <token>` 刷新令牌，旧令牌会失效。
- **响应**：`200 OK` 时返回 `{ "token": string, "expiresIn": number }`；无效或失效令牌返回 `401 Unauthorized` 与消息 `"无效的令牌"` 或 `"用户不存在"`。
- **认证**：是（请求头 Bearer Token）。

### POST /api/auth/logout
- **说明**：注销并吊销当前令牌。
- **响应**：`200 OK`：`{ "message": "已注销" }`；未提供令牌返回 `400 Bad Request`。
- **认证**：是（请求头 Bearer Token）。

## “我的”视图接口（/api/me）

### GET /api/me/profile
- **说明**：获取当前用户资料（含角色、可管理人数/设备等）。
- **响应**：`MeProfileResponse` 对象，包含 `username`、`role`、`managedPersons`、`managedDevices` 等字段。
- **认证**：是。

### GET /api/me/persons
- **说明**：列出当前用户可访问的人员列表。
- **响应**：`[{ personId, personName, department, lastAlertTime, ... }]`。
- **认证**：是。

### GET /api/me/devices
- **说明**：列出当前用户可访问的设备列表。
- **响应**：`[{ deviceId, deviceName, modelType, status, ... }]`。
- **认证**：是。

### GET /api/me/alerts?limit=20
- **说明**：按时间倒序获取近期告警，默认 20 条，可用 `limit` 指定数量。
- **响应**：`[{ alertId, personName, deviceId, type, severity, occurredAt, ... }]`。
- **认证**：是。

## 用户管理接口（/api/users）

### GET /api/users
- **说明**：获取用户列表。
- **响应**：`200 OK`：`UserResponse[]`。
- **认证**：是。

### GET /api/users/{id}
- **说明**：按 ID 获取用户。
- **响应**：`200 OK`：`UserResponse`；业务异常返回 `{ "title": string, "message": string }` 对应异常状态码。

### POST /api/users
- **说明**：创建用户。
- **请求体**：`CreateUserRequest`（包含 `username`、`password`、`role`、`enabled` 等）。
- **响应**：`201 Created`：`UserResponse`；异常时返回 `{ "title", "message" }`。

### PUT /api/users/{id}
- **说明**：更新用户。
- **请求体**：`UpdateUserRequest`（可更新用户名、角色、状态等）。
- **响应**：`200 OK`：`UserResponse`；异常时返回 `{ "title", "message" }`。

### DELETE /api/users/{id}
- **说明**：删除用户。
- **响应**：`204 No Content`；异常时返回 `{ "title", "message" }`。

### POST /api/users/{id}/reset-password
- **说明**：重置用户密码。
- **请求体**：`{ "password": string }`。
- **响应**：`200 OK`：重置后的 `UserResponse` 或异常信息。

### POST /api/users/{id}/lock` & `POST /api/users/{id}/unlock`
- **说明**：锁定 / 解锁指定用户。
- **响应**：`200 OK`：`UserResponse` 或异常信息。
- **认证**：是。

## 人员管理接口（/api/persons）

### GET /api/persons
- **说明**：获取人员列表；非管理员只返回授权人员。
- **响应**：`Person[]`。

### GET /api/persons/{personId}
- **说明**：获取单个人员，需具备访问权限。
- **响应**：`200 OK`：`Person`；`403 Forbidden` 无权限；`404 Not Found` 未找到。

### POST /api/persons
- **说明**：创建人员，非管理员会将创建的人员自动与当前用户关联。
- **请求体**：`Person`（需提供 `personId`、`personName`，可含 `department` 等）。
- **响应**：`200 OK`：保存后的 `Person`；字段缺失返回 `400 Bad Request`。

### PUT /api/persons/{personId}
- **说明**：更新人员信息，需访问权限。
- **请求体**：`Person`。
- **响应**：`200 OK`：更新后的 `Person`；无权限或未找到分别返回 `403/404`。

### DELETE /api/persons/{personId}
- **说明**：删除人员，需访问权限。
- **响应**：`204 No Content` 或 `403/404`。

### GET /api/persons/department/{department}
- **说明**：按部门过滤人员。
- **响应**：`Person[]`（已自动过滤非授权人员）。

### GET /api/persons/search?name=关键字
- **说明**：按姓名模糊搜索人员。
- **响应**：`Person[]`（已自动过滤非授权人员）。
- **认证**：是。

## 雷达设备管理接口（/api/radar/devices）

### GET /api/radar/devices
- **说明**：分页/筛选设备列表，支持 `page`、`size`、`sortBy`、`sortDir`、`search`、`modelType`、`status` 查询参数。
- **响应**：`{ devices: RadarDevice[], currentPage, totalItems, totalPages, pageSize, hasNext, hasPrevious }`。

### GET /api/radar/devices/list
- **说明**：不分页设备列表。
- **响应**：`RadarDevice[]`。

### GET /api/radar/devices/{deviceId}
- **说明**：按 ID 获取设备，未找到返回 `404`。

### POST /api/radar/devices
- **说明**：添加设备，自动将空状态置为 `offline`。
- **请求体**：`RadarDevice`（需 `deviceId`、`modelType` 等）。
- **响应**：成功 `200 OK`：`{ success: true, message: "设备添加成功", device: RadarDevice }`；设备已存在或验证失败返回 `400` 与错误信息。

### POST /api/radar/devices/register
- **说明**：通过请求参数注册新设备（默认离线）。
- **Query 参数**：`deviceId`、`modelType` 必填，`deviceName`、`location` 可选。
- **响应**：成功返回 `{ success: true, message, device }`；重复时返回 `400` 并附带已存在设备。

### PUT /api/radar/devices/{deviceId}
- **说明**：更新设备，保留原有 `createdAt` 和缺失字段的旧值。
- **请求体**：`RadarDevice`。
- **响应**：`{ success: true, message: "设备更新成功", device: RadarDevice }` 或 `400` 错误信息。

### DELETE /api/radar/devices/{deviceId}
- **说明**：删除设备，如存在活跃绑定则拒绝并返回建议。
- **响应**：成功 `{ success: true, message: "设备删除成功" }`；若有绑定或不存在返回 `400`。

### GET /api/radar/devices/type/{type} | /status/{status} | /location/{location} | /model-type/{modelType}
- **说明**：按类型/状态/位置/型号过滤设备。
- **响应**：`RadarDevice[]`。

### GET /api/radar/devices/model-type/{modelType}/status/{status}
- **说明**：按型号与状态过滤设备。

### POST /api/radar/devices/handle-conflict
- **Query 参数**：`deviceId`、`modelType`、`strategy`（`UPDATE_EXISTING`/`CREATE_WITH_SUFFIX`/`REJECT_DUPLICATE`/`MERGE_DEVICES`）。
- **响应**：成功 `{ message, strategy, device }`；非法策略或异常返回 `400`。

### GET /api/radar/devices/generate-unique-id
- **Query 参数**：`baseDeviceId`、`modelType`。
- **响应**：`{ baseDeviceId, uniqueDeviceId, modelType }` 或 `400`。

### PUT /api/radar/devices/batch/status
- **请求体**：`{ "deviceIds": string[], "status": string }`。
- **响应**：`{ success, message, updatedCount }`。

### DELETE /api/radar/devices/batch
- **请求体**：`{ "deviceIds": string[] }`。
- **响应**：`{ success, message, ... }`。

### GET /api/radar/devices/statistics
- **说明**：设备数量统计（在线/离线/维护/绑定数等）。
- **响应**：`{ ... }` 统计字段。

### PUT /api/radar/devices/{deviceId}/status?status=online
- **说明**：更新单个设备状态。
- **响应**：成功 `{ success: true, message }`；失败 `{ success: false, message }`。

### GET /api/radar/devices/model-types
- **说明**：列出已知设备型号列表。

### GET /api/radar/devices/statuses
- **说明**：返回核心状态枚举 `["online","offline","maintenance"]`。
- **认证**：是。

## 设备状态概览接口（/api/device-status）

### GET /api/device-status/overview
- **说明**：汇总所有设备状态与绑定信息，包含实时心跳、绑定人员和统计。
- **响应**：`{ devices: [{ deviceId, deviceName, modelType, location, type, status, realTimeOnline, lastHeartbeat, hasBinding, personId, personName, ... }], statistics: { totalDevices, onlineDevices, offlineDevices, maintenanceDevices, boundDevices, unboundDevices }, timestamp }`。

### GET /api/device-status/{deviceId}
- **说明**：查看单个设备状态、心跳时间以及绑定的人员详情。
- **响应**：`{ success: true, device: { deviceId, deviceName, modelType, model, location, type, status, createdAt, updatedAt, realTimeOnline, lastHeartbeat, binding: { mappingId, personId, personName, ... } } }`；设备不存在时 `400`。
- **认证**：是。

## 人员设备映射接口（/api/person-device-mappings）

### GET /api/person-device-mappings
- **说明**：获取所有活跃映射，非管理员仅返回授权人员的映射。
- **响应**：`PersonDeviceMapping[]`。

### POST /api/person-device-mappings
- **说明**：创建映射，默认会停用已有映射（由服务控制）。
- **请求体**：`{ "personId": string, "deviceId": string, "mappingName": string }`。
- **响应**：`200 OK`：`PersonDeviceMapping`；权限不足 `403`。

### GET /api/person-device-mappings/device/{deviceId}/person
- **说明**：根据设备查绑定人员。
- **响应**：`Person` 或 `404`。

### GET /api/person-device-mappings/person/{personId}/device
- **说明**：根据人员查绑定设备。
- **响应**：`RadarDevice` 或 `404`。

### POST /api/person-device-mappings/swap
- **说明**：交换两个设备的绑定。
- **请求体**：`{ "deviceId1": string, "deviceId2": string }`。
- **响应**：`200 OK`；失败 `400`。

### PUT /api/person-device-mappings/batch-safe
- **说明**：批量更新映射（DTO 校验版），非管理员只能更新有权限人员。
- **请求体**：`{ "mappings": [{ id, personId, deviceId, mappingName, isActive }] }`。
- **响应**：成功 `{ message: "批量更新成功", updatedCount, timestamp }`；校验失败返回详细错误。

### PUT /api/person-device-mappings/batch
- **说明**：兼容旧版批量更新，验证每项 `personId`/`deviceId` 必填。
- **响应**：`{ message: "批量更新成功", updatedCount }` 或携带错误原因的 `400`。

### POST /api/person-device-mappings/multi-bind
- **说明**：创建映射但不禁用其他设备（允许多绑定）。
- **请求体**：同创建接口。

### GET /api/person-device-mappings/person/{personId}/devices
- **说明**：查询人员绑定的所有设备。

### GET /api/person-device-mappings/person/{personId}/devices/model-type/{modelType}
- **说明**：按型号过滤人员绑定设备。

### GET /api/person-device-mappings/person/{personId}/mappings
- **说明**：查询人员的全部映射记录。

### GET /api/person-device-mappings/person/{personId}/mappings/model-type/{modelType}
- **说明**：按型号过滤人员映射记录。

### DELETE /api/person-device-mappings/{mappingId}
- **说明**：删除单个映射，需访问权限。

### DELETE /api/person-device-mappings/device/{deviceId}
- **说明**：删除设备的所有映射（非管理员需对相关人员有权限）。

### DELETE /api/person-device-mappings/person/{personId}
- **说明**：删除某人员的所有映射，需访问权限。
- **认证**：是。

## 其他控制器

项目还包含跌倒告警、生命体征、姿态、雷达系统配置等多型号设备的数据接口（例如 `/api/r60abd1`, `/api/r77abh1`, `/api/ti6843/posture`, `/api/ti6843/vital` 等）。这些控制器遵循类似风格：
- `GET` 端点用于查询实时/历史数据或监测结果，常接受 `deviceId`、`personId`、时间范围等查询参数。
- `POST`/`PUT` 端点用于写入或上传设备数据。
- 响应通常以 `200 OK` 返回实体或列表，校验错误或找不到资源时使用 `400/404`，权限问题返回 `403`。

请在调用前根据具体设备型号查看对应控制器中的字段定义和校验规则。

## 统一注意事项
- 除登录接口外，其余接口均需在 `Authorization` 请求头中携带 `Bearer <token>`。
- 请求体均使用 `application/json`。
- 业务异常通常返回带 `title` 与 `message` 的对象或 `success=false` 的 Map；未找到资源使用 `404 Not Found`。
