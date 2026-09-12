# 部署说明

## 方案一：GitHub Pages

适合只需要公开网页、浏览器救援和本地数据功能的演示。

1. 打开 GitHub 仓库的 `Settings`。
2. 进入 `Pages`。
3. 将 `Build and deployment` 的 `Source` 设置为 `GitHub Actions`。
4. 向 `main` 分支推送代码，或手动运行 `Deploy to GitHub Pages` 工作流。
5. 部署完成后打开：

`https://<你的GitHub用户名>.github.io/procrastination-decoder/`

工作流会自动执行：

```bash
npm ci || npm install
npm run build:pages
```

GitHub Pages 是静态托管，以下功能会使用前端降级模式：

- 账号和任务数据保存在浏览器本地。
- AI 拆解在没有 API 服务时使用内置模板。
- 邮箱验证、真人学伴匹配和持久化服务端数据不可用。
- 浏览器扩展的救援页地址需要改成 GitHub Pages 公网地址。

## 方案二：Vercel 全功能部署

适合需要 AI 拆解、账号接口、邮件验证和真人学伴匹配的版本。

1. 登录 Vercel，选择 `Add New Project`。
2. 导入 GitHub 仓库 `Balloon-balloon/procrastination-decoder`。
3. Framework Preset 选择 `Next.js`。
4. Root Directory 保持仓库根目录。
5. Build Command 使用 `npm run build`。
6. 在 Environment Variables 中配置以下变量：

```env
AI_API_KEY=
AI_API_BASE_URL=
AI_MODEL=

# 或者直接使用 DeepSeek
DEEPSEEK_API_KEY=

# 邮箱验证，二选一
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# 或 SMTP
SMTP_HOST=
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=
SMTP_PASS=
SMTP_FROM=

APP_URL=https://你的项目域名.vercel.app
```

7. 点击 Deploy。

Vercel 部署后，前端和 Next.js API 路由会同时上线。浏览器扩展中的 `WhyWait 救援页地址` 应改成：

`https://你的项目域名.vercel.app/rescue`

## 数据持久化

`WHYWAIT_DATA_FILE` 默认写入本机或容器中的 JSON 文件。Vercel 的文件系统不是持久数据库，正式多用户部署应将其替换为 Supabase、PostgreSQL、MongoDB 等持久化存储。

## 本地验证两种构建

全功能模式：

```bash
npm run build
npm start
```

GitHub Pages 静态模式：

```bash
npm run build:pages
```

静态文件会生成在 `out/` 目录。
