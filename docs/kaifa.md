好的，这是一个非常具体且功能完善的需求。为了确保开发流程顺畅，我将为你生成三份核心文档：**PRD（产品需求文档）**、**技术架构设计文档**、**UX/UI 设计文档**。

这套方案的技术选型定为：
*   **前端**：React + TypeScript + Ant Design (企业级 UI 库)
*   **后端**：NestJS (TypeScript) + Prisma (ORM)
*   **数据库**：SQLite3
*   **部署**：Docker + 1panel + GitHub Actions

以下是你可以直接复制使用的 Markdown 文档。

---

# 1. 产品需求文档 (PRD)

## 1.1 项目背景
开发一套轻量级、可私有化部署的合同管理系统。解决小微团队合同到期遗忘、附件查找困难的问题。系统需支持高度自定义（列字段、提醒规则、个人视图偏好），并采用容器化部署方案。

## 1.2 用户角色
1.  **管理员 (Admin)**：
    *   管理系统全局设置（如定义合同有哪些字段）。
    *   用户管理（添加/删除用户）。
    *   系统维护（备份、日志）。
2.  **普通用户 (User)**：
    *   合同的录入、编辑、删除、归档。
    *   上传和下载附件。
    *   处理到期提醒。
    *   设置自己的列表显示偏好（自定义列显示）。

## 1.3 核心功能需求

### 1.3.1 合同管理 (核心)
*   **自定义字段引擎**：
    *   系统默认字段：合同名称、签订日期、到期日期、合作方、附件、状态（进行中/已归档/已作废）、处理状态（未处理/已处理）。
    *   自定义字段支持：管理员可添加额外字段（如：金额、负责人、合同编号等），类型支持文本、数字、日期。
*   **CRUD 操作**：
    *   新建/编辑合同：表单根据字段定义动态生成。
    *   附件上传：支持本地存储，并在前端可预览或下载。
    *   **处理标记**：增加“已处理/确认”按钮，用于关闭“重复提醒”。

### 1.3.2 提醒系统 (核心逻辑)
*   **提醒规则配置**：
    *   **到期前提醒**：支持自定义天数（如：提前 30 天、7 天、1 天）。
    *   **过期后提醒**：过期后 T+N 天继续提醒。
    *   **重复提醒**：若合同状态未被标记为“已处理”，则按固定频率（如每天/每周）发送提醒，直到用户在系统中点击“处理”。
*   **推送渠道**：
    *   **系统内提醒**：登录网页后，右上角铃铛图标显示红点及列表，首页 Dashboard 弹窗提示。
    *   **邮件推送**：通过 SMTP 服务发送提醒邮件（需支持配置 SMTP）。

### 1.3.3 个性化视图
*   **列显示偏好**：每个用户可独立设置合同列表页显示的列。
    *   例如：用户 A 只看“名称+金额”，用户 B 只看“名称+到期日”。
    *   数据需持久化存储在数据库中，换浏览器登录依然生效。

### 1.3.4 用户与权限
*   **登录/注册**：基于 JWT 的身份验证。
*   **多用户协作**：
    *   所有用户可见所有合同（或基于简单的部门隔离，本版本暂定全员可见，但记录创建者）。
    *   记录操作日志（谁在什么时候修改了合同）。

## 1.4 非功能性需求
*   **数据安全**：附件本地存储需防止越权访问（通过后端流式传输，而非直接暴露静态目录）。
*   **部署便捷性**：必须提供 Dockerfile 和 docker-compose.yml，适配 1panel 面板。

---

# 2. 技术架构设计文档

## 2.1 技术栈选型
*   **Frontend**: React (Vite) + TypeScript + Ant Design + Axios + Zustand (状态管理).
*   **Backend**: NestJS (Node.js 框架) + TypeScript.
*   **Database**: SQLite3 (单文件数据库，易于备份).
*   **ORM**: Prisma (类型安全的 ORM，完美支持 TS).
*   **Queue/Cron**: `@nestjs/schedule` (处理定时任务).
*   **Email**: `nodemailer`.

## 2.2 系统架构图 (逻辑视图)

```mermaid
graph TD
    Client[浏览器 (React)] -->|REST API / JWT| Nginx[Nginx / 1panel Proxy]
    Nginx --> Server[NestJS Server]
    
    subgraph Backend Services
        Server --> AuthGuard[Auth Guard]
        Server --> Controller[Contract Controller]
        Server --> CronService[Cron Task (Check Expiry)]
        Server --> MailService[Email Service]
    end
    
    subgraph Data Layer
        Controller --> Prisma[Prisma ORM]
        Prisma --> SQLite[(SQLite DB)]
        Controller --> FS[Local File System (Attachments)]
    end
```

## 2.3 数据库设计 (Prisma Schema 草稿)

```prisma
// schema.prisma

model User {
  id             Int      @id @default(autoincrement())
  email          String   @unique
  password       String   // Hash
  name           String
  viewPreferences String? // JSON string: 存储用户偏好的列配置，例如 ["id", "name", "amount"]
  createdAt      DateTime @default(now())
}

model ContractField {
  id        Int    @id @default(autoincrement())
  key       String @unique // 数据库字段名，如 "custom_amount"
  label     String // 显示名，如 "合同金额"
  type      String // text, date, number
  isVisible Boolean @default(true) // 全局启用状态
}

model Contract {
  id          Int      @id @default(autoincrement())
  name        String
  signDate    DateTime
  expireDate  DateTime
  status      String   // "active", "archived"
  isProcessed Boolean  @default(false) // 是否已处理到期事项
  
  // 动态字段存储
  customData  String   // JSON string: {"custom_amount": 1000, "custom_pic": "Bob"}
  
  attachments Attachment[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Attachment {
  id         Int      @id @default(autoincrement())
  fileName   String
  filePath   String
  mimeType   String
  contractId Int
  contract   Contract @relation(fields: [contractId], references: [id])
}
```

## 2.4 CI/CD 构建流程 (GitHub Actions)

1.  **Trigger**: 代码推送到 `main` 分支。
2.  **Build**:
    *   构建前端静态资源 (Vite build)。
    *   构建后端代码 (Nest build)。
    *   将前端 `dist` 复制到后端静态目录，或使用 Nginx 镜像合并。
3.  **Dockerize**:
    *   构建 Docker 镜像：`your-docker-hub/contract-manager:latest`。
    *   推送至 Docker Hub 或私有仓库。
4.  **Deploy**:
    *   通过 Webhook 触发 1panel 更新容器，或使用 SSH 远程执行 `docker compose pull && docker compose up -d`。

## 2.5 附件存储策略
*   **Docker 卷映射**: 必须在 docker-compose 中将 `/app/uploads` 映射到宿主机，防止容器重启丢失文件。
    *   `volumes: - ./data/uploads:/app/uploads`
    *   `volumes: - ./data/db:/app/db` (SQLite 文件)

---

# 3. UX/UI 设计文档

## 3.1 设计原则
*   **风格**: B 端简洁风格，使用 Ant Design 默认蓝色主题。
*   **交互**: 减少跳转，尽量使用“侧边抽屉 (Drawer)”或“模态框 (Modal)”进行编辑和查看详情。

## 3.2 关键页面交互

### 3.2.1 登录页
*   简洁的居中卡片，输入邮箱和密码。

### 3.2.2 首页 (仪表盘 & 列表)
*   **顶部栏**:
    *   Logo。
    *   **通知铃铛**: 有未处理的过期合同时，显示红点数字。点击下拉显示具体合同，点击跳转。
    *   用户头像: 下拉菜单包含“列显示设置”、“退出登录”。
*   **主体区域**:
    *   **筛选栏**: 搜索框、状态筛选（即将到期、已过期、已处理）。
    *   **数据表格**:
        *   支持列宽拖拽。
        *   **自定义列按钮**: 点击后弹出一个穿梭框或复选框列表，用户勾选自己想看的字段，点击保存后即时刷新表格布局。
    *   **操作列**: 查看详情、编辑、上传附件、**标记已处理**。

### 3.2.3 合同详情/编辑 (抽屉式 Drawer)
*   **左侧**: 基础信息表单（包含动态字段）。
*   **右侧**:
    *   附件列表（点击预览或下载）。
    *   操作日志（显示谁修改了什么）。
*   **底部**: 保存按钮。

### 3.2.4 提醒设置 (管理员可见)
*   **全局设置页面**:
    *   开关：开启邮件提醒。
    *   SMTP 配置表单。
    *   规则配置：
        *   [输入框] 天前提醒。
        *   [输入框] 天后重复提醒。
        *   [复选框] 必须“标记处理”才停止提醒。

## 3.3 反馈设计
*   **过期提醒**:
    *   表格中，“到期日期”一列根据时间变色。
        *   > 30天: 黑色 (正常)
        *   < 30天: 橙色 (警告)
        *   < 0天 (过期): 红色 (危险)
    *   过期且 `isProcessed = false` 的行，背景色微微泛红，高亮显示。