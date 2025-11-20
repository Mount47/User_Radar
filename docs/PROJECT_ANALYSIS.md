# 项目架构概览

## 技术栈
- 基于 **Vue 3 + TypeScript + Vite** 的单页应用，入口位于 `src/main.ts`，初始化了 Pinia 状态管理与 Vue Router，并加载基础样式。 

## 应用骨架
- `src/App.vue` 提供全局导航与搜索、告警入口、账号菜单等顶层布局，主区域通过 `<RouterView>` 挂载各个页面视图。

## 路由与访问控制
- `src/router/index.ts` 定义了登录、总览、人员、映射、实时、历史、告警等路由，并在 `beforeEach` 中注入 Pinia，基于 `user` store 的 `isAuthenticated` 对未登录用户进行登录页重定向，同时阻止已登录用户访问登录页。

## 状态管理与数据流
- `src/store/user.ts` 使用组合式 API 管理认证状态、个人档案、人员与设备列表、告警、实时与历史数据等核心业务状态。提供 `hydrateScope` 在登录后并行获取概览数据，`selectPerson`、`setAlertFilter`、`changeAlertStatus` 等方法驱动各页面交互。所有远程调用均有模拟数据回退，保证离线可用。

## 数据访问层
- `src/api/user.ts` 封装所有后端调用，针对登录、概览、人员、设备、告警、历史、实时、检测概览等接口，若请求失败则回退到 `src/mock/dataService` 中的模拟实现，确保界面可用性。

## 典型页面
- `src/views/DashboardView.vue` 在挂载时触发数据补水与概览加载，展示当前照护范围、设备状态、聚焦人员的生命体征概要、历史趋势火花线、检测看板以及告警时间线，依赖 `user` store 提供的聚合数据。

