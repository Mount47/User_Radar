# 监护端前端接入文档（Caregiver Console）

本文件用于指导监护端前端如何对接当前后端，实现登录、我的范围数据（人员/设备/告警）、以及与既有实时/历史接口的结合。本文档与仓库现有文档配套使用。

关联实现（后端代码位置）：
- 登录与鉴权：`src/main/java/com/example/radar/controller/AuthController.java`
- 我的范围接口：`src/main/java/com/example/radar/controller/MeController.java`
- 聚合服务：`src/main/java/com/example/radar/service/MeViewService.java`
- 安全与JWT：`src/main/java/com/example/radar/security/*`

参考原有设备/历史接口文档：
- TI6843 Vital 前端参考：`docs/TI6843_Vital_Frontend_API_Reference.md`
- TI6843 Posture API：`docs/TI6843_Posture_API_Documentation.md`
- R60ABD1 API：`docs/R60ABD1_API_Complete_Documentation.md`
- 统一人员-设备绑定：`docs/Unified_Person_Device_Mapping_API_Guide.md`

---

## 1. 鉴权与会话

- 登录接口：`POST /api/auth/login`
- 请求体：
  ```json
  { "username": "care01", "password": "******" }
  ```
- 响应体：
  ```json
  {
    "token": "<JWT>",
    "username": "care01",
    "role": "ROLE_USER",
    "expiresIn": 86400000,
    "accessiblePersons": 3
  }
  ```
- 使用方式：前端保存 `token`（建议内存/受控存储），后续为所有请求加入 Header：`Authorization: Bearer <token>`。
- 401 表示未登录/Token 失效；403 表示已登录但越权访问。

环境与域名建议：
- Caregiver 前端建议使用独立域名（如 `https://care.example.com`）。
- 后端 CORS 将仅允许受信域名（部署时配置）。

---

## 2. 我的范围接口（Caregiver 专用）

所有 `/api/me/*` 接口会根据当前登录用户的绑定关系（User ↔ Persons ↔ Devices）返回数据。管理员登录时返回全量汇总，普通用户仅返回自己可见范围。

### 2.1 当前用户概览
- `GET /api/me/profile`
- 响应：
  ```json
  {
    "username": "care01",
    "role": "ROLE_USER",
    "personCount": 3,
    "deviceCount": 4,
    "serverTime": "2024-11-11T08:25:31.120Z"
  }
  ```
- 用途：登录后初始化首页，展示负责对象/设备数量。

### 2.2 我负责的人员列表
- `GET /api/me/persons`
- 响应：
  ```json
  [
    {
      "personId": "P1001",
      "personName": "王阿姨",
      "age": 82,
      "gender": "F",
      "department": "3F-养老区",
      "devices": [
        { "deviceId": "R60-A1", "deviceName": "卧室雷达" },
        { "deviceId": "TI-V1",  "deviceName": "生命体征" }
      ]
    }
  ]
  ```
- 用途：左侧人员列表、人员卡片区域、跳转详情页。

### 2.3 我负责的设备列表
- `GET /api/me/devices`
- 响应：
  ```json
  [
    {
      "deviceId": "R60-A1",
      "deviceName": "卧室雷达",
      "modelType": "R60ABD1",
      "status": "ONLINE",
      "location": "301房",
      "persons": [ { "personId": "P1001", "personName": "王阿姨" } ]
    }
  ]
  ```
- 用途：设备状态页、设备-人员映射查看。

### 2.4 最近告警（范围内）
- `GET /api/me/alerts?limit=20`
- 参数：`limit`（1~100，默认20）
- 响应：
  ```json
  [
    {
      "alertId": 987,
      "personId": "P1001",
      "personName": "王阿姨",
      "deviceId": "TI-V1",
      "alertType": "HEART_TACHY",
      "severity": "HIGH",
      "detectedAt": "2024-11-11T16:05:00"
    }
  ]
  ```
- 用途：告警中心列表、顶部提醒。

返回字段说明：
- `alertType`：与后端内置类型一致（如 HEART_TACHY/BRADY/FLATLINE、BREATH_TACHY/BRADY、APNEA 等）。
- `severity`：LOW/MEDIUM/HIGH/CRITICAL。

---

## 3. 结合既有 REST 实时/历史接口

Caregiver 详情页建议在 `/api/me/*` 获取范围后，调用既有模块接口加载详细数据：

- 人员详情：`GET /api/persons/{personId}`（已加越权校验）
- TI6843 Vital：参考 `docs/TI6843_Vital_Frontend_API_Reference.md`
- TI6843 Posture：参考 `docs/TI6843_Posture_API_Documentation.md`
- R60ABD1：参考 `docs/R60ABD1_API_Complete_Documentation.md`

注意：
- 所有请求都需要 `Authorization: Bearer <token>`。
- 若请求包含 `personId/deviceId`，前端需保证该 ID 在 `/api/me/persons` 或 `/api/me/devices` 返回范围内；否则后端返回 403。

---

## 4. 实时数据（WebSocket）

当前后端已提供多条 WS 通道（见 `src/main/java/com/example/radar/config/WebSocketConfig.java`）：
- `/ws/r60abd1`（R60 实时）、`/ws/ti6843-vital`（生命体征）、`/ws/ti6843-posture`（位姿）
- `/ws/vitals-alert`（体征异常告警）、`/ws/fall-alert`（跌倒告警）、`/ws/device-status`（设备状态）

消息示例：
- R60ABD1 实时（`type: "r60abd1_realtime"`）：
  ```json
  {
    "type": "r60abd1_realtime",
    "deviceId": "R60-A1",
    "personId": "P1001",
    "data": { "heartRate": 72, "respiration": 16, "presence": true, "timestamp": "2024-11-11T12:01:00" },
    "timestamp": "2024-11-11T12:01:01"
  }
  ```
- 体征告警（`type: "vitals_alert"`）：
  ```json
  { "type": "vitals_alert", "data": { /* VitalsAlertDTO */ }, "timestamp": "..." }
  ```

后续优化（规划）：
- 将在 WS 握手与订阅阶段增加 JWT 鉴权和按人员/设备粒度的订阅隔离，前端仅需在握手时附带 `Authorization: Bearer <token>` 并按受控 ID 订阅。

---

## 5. 错误处理与返回规范

- 401 未认证：跳转登录页。
- 403 越权：提示“无权访问该人员/设备”，可引导联系管理员。
- 4xx 业务错误：按 `message` 给出用户友好提示。
- 5xx 系统错误：提示“系统繁忙，请稍后重试”。

建议前端为每次请求记录 `Trace-Id`（由后端在响应头返回）以便排障。

---

## 6. 典型页面与数据流建议

### 6.1 登录页
1. 调用 `POST /api/auth/login` → 保存 `token`
2. 跳转首页

### 6.2 首页（Dashboard）
1. `GET /api/me/profile` → 显示负责对象/设备数量、服务器时间
2. `GET /api/me/persons` → 左栏列表；点击人员 → 加载详情与图表
3. `GET /api/me/alerts?limit=20` → 右侧告警区域

### 6.3 人员详情
1. `GET /api/persons/{personId}` → 基本资料
2. 调既有模块接口加载实时/历史图表（TI6843/R60ABD1 等）
3. WebSocket 订阅（可选），弹出实时告警条目

### 6.4 设备列表
1. `GET /api/me/devices` → 表格/卡片
2. 点击设备 → 设备详情与实时/历史曲线（依赖既有接口）

### 6.5 告警中心
1. `GET /api/me/alerts?limit=50` → 列表分页/滚动加载
2. 点击告警 → 跳到人员/设备详情

---

## 7. 请求示例（cURL）

```bash
# 登录
curl -X POST https://api.example.com/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"care01","password":"******"}'

# 我的概览
curl -H 'Authorization: Bearer <JWT>' https://api.example.com/api/me/profile

# 我负责的人员
curl -H 'Authorization: Bearer <JWT>' https://api.example.com/api/me/persons

# 我负责的设备
curl -H 'Authorization: Bearer <JWT>' https://api.example.com/api/me/devices

# 最近告警
curl -H 'Authorization: Bearer <JWT>' 'https://api.example.com/api/me/alerts?limit=20'
```

---

## 8. 版本与兼容性

- 当前为 v1 草案，后续将：
  - 为 `/api/me/alerts` 增加分页参数（`page/size`）与按 `status/type` 筛选；
  - 为 `/api/me/persons`、`/api/me/devices` 增加分页与搜索参数；
  - WebSocket 增加 JWT 握手与按资源订阅；
  - 与各设备模块接口对齐统一错误码/时间格式。

---

## 9. 常见问题（FAQ）

1) 为什么我无法看到某位人员/设备？
- 检查是否在 `/api/me/persons` 或 `/api/me/devices` 返回范围内；若不在，请联系管理员分配绑定。

2) 告警列表为空？
- 确认是否确有告警产生；也可能是 `limit` 太小或时间较久未发生告警。

3) WebSocket 无消息？
- 目前 WS 未上 JWT 鉴权，建议内网使用；后续会上线鉴权与订阅隔离，届时按文档附带 Token 即可。

