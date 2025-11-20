# 用户端后台产品需求与接口文档

## 1. 产品背景与目标
- 构建毫米波雷达人体监测产品的用户端后台，服务家庭/机构终端用户，实现人员生命体征、位姿、告警全流程闭环。
- 后端基于 Spring Boot + JWT 鉴权，提供 REST API 供 Web/App 使用；管理员负责资源配置，普通用户仅能访问授权人员。
- 设备覆盖 R60ABD1、R77ABH1、TI6843（呼吸心跳、位姿等），需兼顾实时监测、历史数据回看以及告警联动。

## 2. 用户端产品需求拆解
### 2.1 用户登录
- 用户以账号+密码登录，成功后获取 JWT、角色、token 过期时间、可访问人员数量。
- 登录失败需返回 401 + 友好错误文案。

### 2.2 人员管理
- 列表、详情、搜索、按部门过滤。
- 管理员可 CRUD；普通用户仅能读取被授权人员（由 AuthScopeService 约束）。

### 2.3 设备管理
- 支持分页列表、按型号/状态/位置筛选、注册、更新、删除、批量操作。
- 删除前需校验是否存在活跃人员绑定。

### 2.4 人员与设备绑定
- 单个/批量/多设备绑定，支持查询绑定关系、按人/设备/型号过滤、停用/激活、清理失效映射。
- 绑定操作需记录映射名、状态、创建时间；解绑或停用后可在历史记录中追踪。

### 2.5 呼吸/心跳实时展示
- 实时数据来源：R60ABD1、TI6843 Vital 等，接口需按设备或人员维度获取最新 N 条数据。
- 数据需包含心率、呼吸率、体动、睡眠、置信度、时间戳，超量数据要裁剪。

### 2.6 人体位姿实时展示
- TI6843 Posture 提供点云/关键点数据；要求查询最新帧、区间数据、人员维度数据。
- 需支持数据上传接口供网关推送。

### 2.7 历史数据展示
- 按设备/人员+时间范围查询历史点；部分接口支持分页（如 TI6843 Vital）。
- 提供统计汇总（均值、极值、样本数）。

### 2.8 异常警告
- 呼吸心跳异常：/api/vitals-alerts 提供按设备/人员/时间范围过滤。
- 跌倒/位姿异常：/api/fall-alerts 提供活跃告警、处理流转（待处理/已处理/误报）、统计接口。
- 需要“我的”视图聚合近实时设备、人员、告警信息。

### 2.9 设备状态总览
- /api/device-status/overview 返回设备在线状态、心跳、绑定信息、统计数据；用于大屏或监控台。
- /api/detection 系列接口根据不同雷达模型返回是否有人体、最新指标。

## 3. 模块-接口对照
| 模块 | 关键接口群 | 说明 |
| --- | --- | --- |
| 认证与权限 | AuthController, MeController, JwtTokenProvider | JWT 登录、个人视图、角色范围控制 |
| 人员管理 | PersonController | CRUD、过滤、Scope 校验 |
| 设备管理 | RadarDeviceController, DeviceStatusController | 设备 CRUD/统计、状态心跳、冲突处理 |
| 绑定关系 | PersonDeviceMappingController | 单个/批量/多设备绑定、停用激活、查询 |
| 呼吸心跳 | R60ABD1DataController, TI6843VitalController, TI6843VitalDataController | 设备管理+实时/历史/统计数据、人员维度查询 |
| 位姿 | TI6843PostureController, TI6843PostureDataController | 设备 CRUD、数据上传、实时/历史查询 |
| 检测概览 | PersonDetectionController, DeviceStatusController | 多模型检测状态、绑定人信息、设备心跳 |
| 告警 | VitalsAlertController, FallAlertController | 呼吸心跳异常 & 跌倒告警管理 |

## 4. 接口文档（节选用户端所需）
> 通用要求：所有接口默认前缀 /api, 返回 JSON。除登录外需附带 Authorization: Bearer <token>。

### 4.1 认证与个人视图
- POST /api/auth/login
  - 请求
    ```json
    {"username":"demo","password":"***"}
    ```
  - 响应：token, role, expiresIn, accessiblePersons。
- GET /api/me/profile
  - 返回登录用户信息、角色、管理对象等。
- GET /api/me/persons
  - 返回用户可见的人员列表（含绑定摘要）。
- GET /api/me/devices
  - 返回可见设备及绑定状态。
- GET /api/me/alerts?limit=20
  - 返回最近告警列表。

### 4.2 人员管理 (PersonController)
| 方法 | 路径 | 功能 | 备注 |
| --- | --- | --- | --- |
| GET | /api/persons | 列表（管理员=全部，普通=授权内） | Scope 由 AuthScopeService 约束 |
| GET | /api/persons/{personId} | 详情 | 未授权返回 403 |
| POST | /api/persons | 新增（管理员） | 需 personId/personName |
| PUT | /api/persons/{personId} | 更新（管理员） | personId 不可变 |
| DELETE | /api/persons/{personId} | 删除（管理员） | 需无关联逻辑 |
| GET | /api/persons/department/{department} | 按部门过滤 | 非管理员自动过滤结果 |
| GET | /api/persons/search?name=张 | 模糊搜索 |  |

### 4.3 设备管理 (RadarDeviceController, DeviceStatusController)
- 设备 CRUD：
  - GET /api/radar/devices?page=0&size=10&modelType=TI6843_POSTURE（分页+筛选）。
  - POST /api/radar/devices 新建，必填 deviceId, modelType; 默认状态 offline。
  - POST /api/radar/devices/register 仅提供 ID+型号快速注册。
  - PUT /api/radar/devices/{deviceId} 更新（自动保留创建时间/关键字段）。
  - DELETE /api/radar/devices/{deviceId} 删除前会校验是否存在活跃绑定。
  - 批量与辅助：PUT /api/radar/devices/batch/status, DELETE /api/radar/devices/batch, POST /api/radar/devices/handle-conflict, GET /api/radar/devices/generate-unique-id。
- 状态/心跳：
  - GET /api/device-status/overview 返回所有设备信息、实时在线状态、绑定人员、统计。
  - GET /api/device-status/{deviceId} 查询单台设备的绑定与心跳详情。

### 4.4 人员-设备绑定 (PersonDeviceMappingController)
- 创建：POST /api/person-device-mappings，body 需要 personId, deviceId, mappingName。
- 多设备绑定：POST /api/person-device-mappings/multi-bind 不会停用现有映射。
- 查询：
  - /api/person-device-mappings（活跃列表）
  - /api/person-device-mappings/device/{deviceId}/person, /person/{personId}/device
  - /api/person-device-mappings/person/{personId}/devices、/person/{personId}/mappings 及 model-type 过滤版。
- 批量：PUT /api/person-device-mappings/batch-safe (DTO 校验版), PUT /api/person-device-mappings/batch, DELETE /api/person-device-mappings/batch。
- 状态管理：PUT /api/person-device-mappings/{mappingId}/deactivate, /reactivate, GET /api/person-device-mappings/inactive, DELETE /api/person-device-mappings/cleanup?daysOld=30。
- 更新：PUT /api/person-device-mappings/{mappingId} 单条更新；GET /api/person-device-mappings/{mappingId} 查询详情；DELETE /api/person-device-mappings/device/{deviceId}、/person/{personId} 批量解绑。

### 4.5 呼吸/心跳数据
#### TI6843 Vital
- 设备管理：/api/ti6843/vital/devices 系列（CRUD、状态/位置筛选、绑定信息 GET /device/{deviceId}/person，绑定/解绑 /bind /unbind）。
- 实时查询：
  - GET /api/ti6843/vital/data/realtime/{deviceId} 按设备最新数据。
  - GET /api/ti6843/vital/data/person/{personId}/realtime 按人员聚合。
- 历史查询：
  - GET /api/ti6843/vital/data/historical/device/{deviceId}/timerange?start=...&end=...
  - GET /api/ti6843/vital/data/historical?deviceId=...&start=...&end=...（分页）
  - GET /api/ti6843/vital/data/historical/summary?deviceId=... 返回统计（均值/峰值等）。
- 通用查询：/data/device/{deviceId}, /data/device/{deviceId}/timerange, /person/{personId}/data, /person/{personId}/data/timerange。

#### R60ABD1
- 实时：GET /api/r60abd1/data/realtime/{deviceId}。
- 历史：GET /api/r60abd1/data/historical/device/{deviceId}/timerange（含 DTO 分页接口 /historical）。
- 通用：/api/r60abd1/data/data/device/{deviceId}, /data/device/{deviceId}/timerange, /data/timerange。

### 4.6 人体位姿 (TI6843Posture)
- 设备 CRUD：/api/ti6843/posture/devices 系列。
- 实时查询：GET /api/ti6843/posture/data/realtime/{deviceId} 与 /person/{personId}/realtime。
- 历史查询：
  - /api/ti6843/posture/data/device/{deviceId}、/device/{deviceId}/timerange。
  - /api/ti6843/posture/data/historical/device/{deviceId}/timerange 获取 TI6843HistoricalData。
  - /api/ti6843/posture/data/person/{personId}/data、/person/{personId}/data/timerange。

### 4.7 检测状态/设备心跳
- GET /api/detection/status/{deviceId} 返回 DetectionStatus（设备信息、绑定人、是否有人、最新指标、lastUpdateTime）。
- GET /api/detection/status/all、/model-type/{modelType}、/with-person 用于大屏过滤不同模型。
- GET /api/device-status/overview（见 4.3）用于展示实时在线状态、心跳时间戳。

### 4.8 告警
#### 呼吸心跳异常 (VitalsAlertController)
| 方法 | 路径 | 描述 |
| --- | --- | --- |
| GET | /api/vitals-alerts | 全量列表（倒序）。 |
| GET | /api/vitals-alerts/{id} | 告警详情。 |
| GET | /api/vitals-alerts/device/{deviceId} | 按设备过滤。 |
| GET | /api/vitals-alerts/person/{personId} | 按人员过滤。 |
| GET | /api/vitals-alerts/timerange?start=&end= | 按时间范围过滤。 |

#### 跌倒/位姿异常 (FallAlertController)
- 查询：GET /api/fall-alerts/active, /api/fall-alerts, /api/fall-alerts/{id}。
- 过滤：GET /api/fall-alerts/device/{deviceId}/active, /person/{personId}/active, /timerange, /device/{deviceId}/timerange, /person/{personId}/timerange。
- 流程：
  - POST /api/fall-alerts/{id}/pending（body: { "handlerBy": "user", "notes": "..." }）。
  - POST /api/fall-alerts/{id}/resolved、/false-alarm 更新状态和备注。
- 统计：GET /api/fall-alerts/statistics 返回活跃数、今日告警等。

### 4.9 绑定视角衍生接口
- GET /api/ti6843/vital/device/{deviceId}/person、POST /bind、DELETE /unbind（TI6843 专属）。
- GET /api/person-device-mappings/device/{deviceId}/person 通用查询。
- GET /api/detection/status/with-person 快速查找“有人的设备”。

## 5. 实施建议
1. 鉴权：登录后缓存 token 与 expiresIn，所有请求附带 Bearer Token；到期前刷新。
2. 数据展示节流：实时图表建议调用 /realtime 接口，每 2~5 秒轮询，并缓存最近 20 条。
3. 历史查询：时间范围参数为 ISO8601 字符串（如 2024-04-11T10:00:00），注意服务端默认本地时区。
4. 错误处理：多数接口返回 {"success":false,"message":"..."} 或标准 HTTP 状态，前端需统一处理 400/403/500。
5. 后续扩展：若需 WebSocket，可在 WebSocketConfig 基础上推送实时告警或数据流，现阶段 REST 足够。
