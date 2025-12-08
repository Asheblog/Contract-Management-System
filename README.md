# 📋 合同管理系统

<p align="center">
  <strong>Contract Management System</strong><br>
  轻量级、可私有化部署的企业合同管理解决方案
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-10.0-red?logo=nestjs" alt="NestJS">
  <img src="https://img.shields.io/badge/React-18.2-blue?logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.2-blue?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Ant%20Design-5.12-blue?logo=antdesign" alt="Ant Design">
  <img src="https://img.shields.io/badge/SQLite-3-blue?logo=sqlite" alt="SQLite">
  <img src="https://img.shields.io/badge/Docker-Ready-blue?logo=docker" alt="Docker">
</p>

---

## ✨ 功能特性

### 📝 合同管理
- **合同 CRUD**：完整的新建、编辑、删除、归档功能
- **附件管理**：支持多附件上传、预览和下载
- **自定义字段**：管理员可灵活定义额外字段（文本/数字/日期类型）
- **合同标签**：支持自定义标签分类和筛选
- **拖拽排序**：使用 DnD Kit 实现合同列表拖拽排序
- **高级搜索**：支持多条件组合搜索和标签过滤
- **批量操作**：支持批量归档、删除等操作
- **数据导入/导出**：支持 Excel 格式导入导出

### 🔔 提醒系统
- **到期提前提醒**：可配置提前 N 天提醒
- **过期后持续提醒**：过期后 T+N 天继续提醒
- **重复提醒机制**：未处理合同自动重复提醒
- **邮件推送**：通过 SMTP 发送提醒邮件
- **系统内通知**：登录后铃铛图标显示待处理事项

### 👥 用户与权限
- **JWT 身份验证**：安全的登录认证机制
- **角色管理**：管理员和普通用户两种角色
- **个人设置**：用户可自定义姓名、头像
- **密码管理**：支持自助修改密码和管理员重置密码
- **列显示偏好**：每个用户可独立设置列表显示的列

### 📊 数据可视化
- **仪表盘**：合同状态统计、即将到期统计
- **图表展示**：使用 Ant Design Charts 展示数据趋势
- **状态概览**：快速了解合同整体情况

### 🎨 界面特性
- **深色模式**：支持明/暗主题切换
- **响应式布局**：适配不同屏幕尺寸
- **虚拟滚动**：大数据量下流畅的表格滚动
- **中文界面**：完整的中文本地化支持

### 📋 审计日志
- **操作记录**：记录所有合同操作（创建/修改/删除）
- **日志详情**：详细记录变更内容
- **用户追踪**：记录操作者信息

---

## 🛠 技术栈

### 后端
| 技术 | 版本 | 说明 |
|------|------|------|
| **NestJS** | 10.x | Node.js 企业级框架 |
| **TypeScript** | 5.x | 类型安全 |
| **Prisma** | 5.7 | 现代化 ORM |
| **SQLite** | 3 | 轻量级数据库 |
| **Passport** | 0.7 | JWT 身份验证 |
| **Nodemailer** | 6.9 | 邮件发送 |
| **ExcelJS** | 4.4 | Excel 处理 |

### 前端
| 技术 | 版本 | 说明 |
|------|------|------|
| **React** | 18.2 | UI 框架 |
| **TypeScript** | 5.x | 类型安全 |
| **Vite** | 5.x | 构建工具 |
| **Ant Design** | 5.12 | UI 组件库 |
| **React Query** | 5.90 | 数据请求管理 |
| **Zustand** | 4.4 | 状态管理 |
| **React Router** | 6.21 | 路由管理 |
| **DnD Kit** | 6.3 | 拖拽功能 |
| **Ant Design Charts** | 2.6 | 图表组件 |

### 部署
| 技术 | 说明 |
|------|------|
| **Docker** | 容器化部署 |
| **Docker Compose** | 服务编排 |
| **Nginx** | 前端服务与反向代理 |
| **GitHub Actions** | CI/CD 自动化 |

---

## 📁 项目结构

```
contract-manager/
├── 📂 backend/                 # 后端代码
│   ├── 📂 src/
│   │   ├── 📂 auth/           # 身份验证模块
│   │   ├── 📂 users/          # 用户管理模块
│   │   ├── 📂 contracts/      # 合同管理模块
│   │   ├── 📂 attachments/    # 附件管理模块
│   │   ├── 📂 reminders/      # 提醒服务模块
│   │   ├── 📂 settings/       # 系统设置模块
│   │   ├── 📂 audit-logs/     # 审计日志模块
│   │   ├── 📂 tags/           # 标签管理模块
│   │   ├── 📂 prisma/         # Prisma 服务
│   │   ├── app.module.ts      # 应用主模块
│   │   └── main.ts            # 入口文件
│   ├── 📂 prisma/
│   │   └── schema.prisma      # 数据库模型定义
│   ├── Dockerfile             # 后端容器配置
│   └── package.json
│
├── 📂 frontend/                # 前端代码
│   ├── 📂 src/
│   │   ├── 📂 components/     # 可复用组件
│   │   │   ├── MainLayout.tsx        # 主布局
│   │   │   ├── ContractDrawer.tsx    # 合同抽屉
│   │   │   ├── DashboardCharts.tsx   # 图表组件
│   │   │   ├── DraggableTable.tsx    # 拖拽表格
│   │   │   ├── VirtualTable.tsx      # 虚拟滚动表格
│   │   │   ├── NotificationBell.tsx  # 通知铃铛
│   │   │   ├── TagSelector.tsx       # 标签选择器
│   │   │   └── ColumnSettings.tsx    # 列设置
│   │   ├── 📂 pages/          # 页面组件
│   │   │   ├── LoginPage.tsx         # 登录页
│   │   │   ├── DashboardPage.tsx     # 合同列表页
│   │   │   ├── StatsDashboardPage.tsx # 统计仪表盘
│   │   │   ├── SettingsPage.tsx      # 系统设置页
│   │   │   ├── AuditLogPage.tsx      # 审计日志页
│   │   │   ├── ProfilePage.tsx       # 个人资料页
│   │   │   └── UserManagementPage.tsx # 用户管理页
│   │   ├── 📂 services/       # API 服务
│   │   ├── 📂 stores/         # 状态管理
│   │   ├── 📂 types/          # 类型定义
│   │   ├── App.tsx            # 应用入口
│   │   └── main.tsx           # 渲染入口
│   ├── Dockerfile             # 前端容器配置
│   ├── nginx.conf             # Nginx 配置
│   └── package.json
│
├── 📂 docs/                    # 文档
│   ├── kaifa.md               # 开发文档
│   └── 构建命令.md             # 构建指南
│
├── 📂 .github/workflows/       # GitHub Actions
│   └── deploy.yml             # CI/CD 配置
│
├── docker-compose.yml          # Docker Compose 配置
├── startup.js                  # 一键启动脚本
└── README.md                   # 项目说明
```

---

## 🚀 快速开始

### 环境要求
- **Node.js** >= 20.x
- **npm** >= 9.x
- **Docker** (可选，用于容器化部署)

### 方式一：一键启动（开发环境）

```bash
# 克隆项目
git clone <repository-url>
cd contract-manager

# 一键启动
node startup.js
```

启动脚本会自动：
1. 安装前后端依赖
2. 生成 Prisma 客户端并同步数据库
3. 并行启动前后端开发服务器

启动完成后：
- 🌐 **前端地址**: http://localhost:3000
- 🔧 **后端地址**: http://localhost:3001

### 方式二：手动启动

```bash
# 后端
cd backend
npm install
npx prisma generate
npx prisma db push
npm run start:dev

# 前端（新终端）
cd frontend
npm install
npm run dev
```

### 方式三：Docker 部署（本地构建）

```bash
# 构建并启动
docker compose up -d --build

# 查看日志
docker compose logs -f

# 停止服务
docker compose down
```

### 方式四：使用 GHCR 镜像部署（推荐）

项目通过 GitHub Actions 自动构建并推送镜像到 GitHub Container Registry (GHCR)，可直接拉取使用：

```bash
# 使用生产环境配置
docker compose -f docker-compose.prod.yml up -d

# 查看日志
docker compose -f docker-compose.prod.yml logs -f
```

---

## 📦 Docker 部署说明

### 本地构建 (docker-compose.yml)

用于开发或本地构建镜像：

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: contract-backend
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3001
      - JWT_SECRET=${JWT_SECRET:-your-super-secret-key}
      - JWT_EXPIRES_IN=7d
      - DATABASE_URL=file:/app/db/contract.db
      - UPLOAD_DIR=/app/uploads
    volumes:
      - ./data/db:/app/db
      - ./data/uploads:/app/uploads
    networks:
      - contract-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: contract-frontend
    restart: unless-stopped
    ports:
      - "3000:80"
    depends_on:
      - backend
    networks:
      - contract-network

networks:
  contract-network:
    driver: bridge
```

### 生产环境 (docker-compose.prod.yml)

使用 GitHub Actions 自动构建的 GHCR 镜像，无需本地构建：

```yaml
version: '3.8'

services:
  backend:
    image: ghcr.io/Asheblog/contract-backend:latest
    container_name: contract-backend
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3001
      - JWT_SECRET=${JWT_SECRET:-请修改为安全的随机字符串}
      - JWT_EXPIRES_IN=7d
      - DATABASE_URL=file:/app/db/contract.db
      - UPLOAD_DIR=/app/uploads
    volumes:
      - ./data/db:/app/db
      - ./data/uploads:/app/uploads
    networks:
      - contract-network

  frontend:
    image: ghcr.io/Asheblog/contract-frontend:latest
    container_name: contract-frontend
    restart: unless-stopped
    ports:
      - "3888:80"
    depends_on:
      - backend
    networks:
      - contract-network

networks:
  contract-network:
    driver: bridge
```

> 📝 **注意**：请将 `你的github用户名` 替换为实际的 GitHub 用户名（小写）

### 数据持久化

数据存储在 `./data` 目录下：
- `./data/db/contract.db` - SQLite 数据库文件
- `./data/uploads/` - 上传的合同附件

> 💡 **备份提示**：只需备份 `./data` 目录即可完整备份所有数据。

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `JWT_SECRET` | JWT 密钥 | 必须设置 |
| `JWT_EXPIRES_IN` | Token 过期时间 | `7d` |
| `PORT` | 后端端口 | `3001` |
| `DATABASE_URL` | 数据库路径 | `file:../db/contract.db` |
| `UPLOAD_DIR` | 上传目录 | `/app/uploads` |
| `CORS_ORIGINS` | CORS 允许源 | 全部允许 |
| `DEFAULT_ADMIN_EMAIL` | 默认管理员邮箱 | `admin@example.com` |
| `DEFAULT_ADMIN_PASSWORD` | 默认管理员密码 | `admin123` |
| `DEFAULT_ADMIN_NAME` | 默认管理员姓名 | `系统管理员` |

> ⚠️ **安全提示**：生产环境请务必修改 `JWT_SECRET` 为强随机字符串！

生成安全密钥：
```bash
openssl rand -base64 32
```

---

## 🔧 1Panel 部署（详细步骤）

1Panel 是一款现代化的 Linux 服务器运维管理面板，以下是详细的部署步骤：

### 前置条件

- 已安装 1Panel 面板
- 服务器已安装 Docker

### 步骤 1：创建 Compose 应用

1. 登录 1Panel 面板
2. 进入 **容器** → **Compose** → **创建 Compose**
3. 填写应用名称，如 `contract-manager`
4. 在编排内容中粘贴上面生产环境docker编排配置

> ⚠️ **重要**：
> - 将 `你的github用户名` 替换为实际的 GitHub 用户名（小写）
> - 将 `JWT_SECRET` 替换为安全的随机字符串

5. 点击 **确认** 创建并启动容器

### 步骤 2：创建网站（反向代理）

1. 进入 **网站** → **网站** → **创建网站**
2. 选择 **反向代理**
3. 填写配置：

| 配置项 | 填写内容 |
|--------|----------|
| **主域名** | 你的域名，如 `contract.example.com` |
| **代理地址** | `127.0.0.1` |
| **代理端口** | `3000` |

4. 点击 **确认** 创建网站

### 步骤 3：配置 HTTPS（可选但推荐）

1. 在网站列表中点击刚创建的网站
2. 进入 **HTTPS** 选项卡
3. 申请或上传 SSL 证书
4. 开启 **强制 HTTPS**

### 步骤 4：验证部署

访问你配置的域名，应该能看到合同管理系统的登录页面。

**默认管理员账号**：
- 邮箱：`admin@example.com`
- 密码：`admin123`

> ⚠️ 首次登录后请立即修改默认密码！

### 网络架构说明

```
用户浏览器
    ↓ HTTPS (443)
1Panel Nginx (反向代理)
    ↓ HTTP (3000)
Frontend 容器 (Nginx :80)
    ↓ /api/* 转发
Backend 容器 (:3001)
    ↓
SQLite 数据库
```

### 更新镜像

当 GitHub 有新的提交时，镜像会自动构建。更新部署：

```bash
# 在 Compose 应用目录下执行
docker compose pull
docker compose up -d
```

或在 1Panel 中：
1. 进入 **容器** → **Compose**
2. 找到 `contract-manager` 应用
3. 点击 **重建** 按钮

详细说明请参考 [构建命令文档](./docs/构建命令.md)

---

## 🔄 CI/CD

项目配置了 GitHub Actions 自动化流程，使用 GitHub Container Registry (GHCR) 存储镜像：

### 工作流程

1. **触发条件**：推送到 `main` 分支或创建 `v*` 标签
2. **构建流程**：
   - 构建后端 Docker 镜像
   - 构建前端 Docker 镜像
   - 自动推送至 GHCR (`ghcr.io`)
3. **镜像地址**：
   - 后端：`ghcr.io/你的用户名/contract-backend:latest`
   - 前端：`ghcr.io/你的用户名/contract-frontend:latest`

### 无需配置 Secrets

使用 GHCR 时，GitHub Actions 会自动使用 `GITHUB_TOKEN` 进行认证，**无需手动配置任何 Secrets**。

### 手动触发构建

除了推送代码自动触发外，也可以在 GitHub 仓库页面手动触发：

1. 进入仓库的 **Actions** 页面
2. 选择 **Build and Push Images** 工作流
3. 点击 **Run workflow**

---

## 📊 数据库模型

```prisma
model User {
  id              Int       @id @default(autoincrement())
  email           String    @unique
  password        String
  name            String
  avatar          String?
  role            String    @default("user")
  viewPreferences String?
  contracts       Contract[]
  logs            AuditLog[]
}

model Contract {
  id          Int          @id @default(autoincrement())
  name        String
  partner     String
  signDate    DateTime
  expireDate  DateTime
  status      String       @default("active")
  isProcessed Boolean      @default(false)
  customData  String       @default("{}")
  tags        String       @default("[]")
  sortOrder   Int          @default(0)
  attachments Attachment[]
  logs        AuditLog[]
}

model Tag {
  id    Int    @id @default(autoincrement())
  name  String @unique
  color String @default("#1890ff")
}

model Attachment {
  id         Int      @id @default(autoincrement())
  fileName   String
  filePath   String
  mimeType   String
  size       Int
  contractId Int
}

model AuditLog {
  id         Int      @id @default(autoincrement())
  action     String
  details    String
  contractId Int?
  userId     Int
}

model ContractField {
  id        Int     @id @default(autoincrement())
  key       String  @unique
  label     String
  type      String
  isVisible Boolean @default(true)
  order     Int     @default(0)
}

model SystemSetting {
  id    Int    @id @default(autoincrement())
  key   String @unique
  value String
}
```

---

## 🔑 默认账号

首次部署后，系统会自动创建管理员账号。您可以通过环境变量自定义默认账号信息：

```bash
# 在 .env 文件中配置
DEFAULT_ADMIN_EMAIL=admin@example.com
DEFAULT_ADMIN_PASSWORD=admin123
DEFAULT_ADMIN_NAME=系统管理员
```

| 环境变量 | 说明 | 默认值 |
|----------|------|--------|
| `DEFAULT_ADMIN_EMAIL` | 管理员登录邮箱 | `admin@example.com` |
| `DEFAULT_ADMIN_PASSWORD` | 管理员登录密码 | `admin123` |
| `DEFAULT_ADMIN_NAME` | 管理员显示名称 | `系统管理员` |

> ⚠️ **安全提示**：
> - 首次部署前请修改 `.env` 中的默认账号信息！
> - 首次登录后请立即修改默认密码！

---

## 📖 API 接口

所有 API 接口以 `/api` 为前缀：

| 模块 | 接口 | 说明 |
|------|------|------|
| 认证 | `POST /api/auth/login` | 用户登录 |
| 认证 | `POST /api/auth/register` | 用户注册 |
| 用户 | `GET /api/users/me` | 获取当前用户 |
| 用户 | `PATCH /api/users/me` | 更新当前用户 |
| 合同 | `GET /api/contracts` | 合同列表 |
| 合同 | `POST /api/contracts` | 创建合同 |
| 合同 | `PATCH /api/contracts/:id` | 更新合同 |
| 合同 | `DELETE /api/contracts/:id` | 删除合同 |
| 附件 | `POST /api/attachments` | 上传附件 |
| 附件 | `GET /api/attachments/:id` | 下载附件 |
| 标签 | `GET /api/tags` | 标签列表 |
| 设置 | `GET /api/settings` | 获取系统设置 |
| 日志 | `GET /api/audit-logs` | 审计日志列表 |

---

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

---

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

---

## 📞 联系方式

如有问题或建议，欢迎提交 Issue 或 Pull Request。

---

<p align="center">
  Made with ❤️ for Contract Management
</p>
