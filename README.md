# whywait

## 本地运行

```bash
npm ci
npm run dev
```

账号和真人匹配数据默认保存在 `data/whywait-db.json`。密码使用 `scrypt` 加盐哈希后保存，不再把明文密码当作账号数据库放在浏览器中。

## 部署要求

本项目包含账号与真人匹配 API，必须作为 Node.js 服务运行（`npm run build && npm start`），不能部署为纯静态站点。

生产环境应把 `WHYWAIT_DATA_FILE` 指向持久化磁盘中的文件，例如：

```env
WHYWAIT_DATA_FILE=/data/whywait/whywait-db.json
TZ=Asia/Shanghai
```

如配置 `RESEND_API_KEY`（可选 `RESEND_FROM_EMAIL`）或 `SMTP_HOST`、`SMTP_PORT`、`SMTP_USER`、`SMTP_PASS`，注册时会要求邮箱验证；未配置邮件服务时会自动验证账号，方便本地使用。

真人学伴匹配要求两位已登录用户连接同一部署实例。每次真人匹配最多等待 1 分钟，超时后退出真人队列并进入虚拟陪伴，不会继续后台匹配；用户可以点击“重新匹配真人”再次等待。为了在同一浏览器测试两个账号，每个标签页使用独立会话，页面顶部会显示当前标签页实际参与匹配的账号。
