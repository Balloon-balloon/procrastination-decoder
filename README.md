# whywait

## 行动救援网络

项目现在包含三个可以独立演示的新层次：

- `browser-extension/`：检测持续逃避行为并弹出 5 分钟微行动，本地保存设置和统计。
- 网页小精灵：关闭 WhyWait 页面后，扩展会在其他网页保留一个可拖动的小精灵，展示停留时间并在达到阈值时提示行动。
- `/rescue`：行动救援台，支持自动缩小目标、5 分钟计时、完成后回写任务与专注数据。
- `skills/whywait-action-coach/`：可被 Agent 调用的行动教练 Skill，生成阻力分析、救援阶梯和深链接。
- `hardware/`：Action Companion BLE 协议与 ESP32 固件骨架，支持单击、长按和振动反馈。

浏览器扩展按 `browser-extension/README.md` 的步骤以“加载已解压的扩展程序”方式安装。硬件接线和 GATT UUID 见 `hardware/README.md`。

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

## 注册邮箱验证

注册账号现在强制进行真实邮箱验证：系统会立即发送包含 6 位验证码和验证链接的邮件，二者均在 15 分钟后失效。只有验证成功后账号才能登录。邮件未被服务商接受时，本次注册会回滚，不会留下无法重试的占位账号；未配置邮件服务时也不会再自动验证或返回演示验证码。

先复制 `.env.local.example` 为 `.env.local`，然后选择以下一种方式填写真实凭据：

- Resend：配置 `RESEND_API_KEY` 和 `RESEND_FROM_EMAIL`。向任意用户邮箱发送前，需要先验证自己的发件域名。
- SMTP：完整配置 `SMTP_HOST`、`SMTP_PORT`、`SMTP_USER`、`SMTP_PASS`；QQ 邮箱的 `SMTP_PASS` 是授权码，不是登录密码。

同时把 `APP_URL` 设置成用户能够访问的应用地址，保证邮件中的验证链接正确。修改环境变量后需要重启开发或生产服务。

真人学伴匹配要求两位已登录用户连接同一部署实例。每次真人匹配最多等待 1 分钟，超时后退出真人队列并进入虚拟陪伴，不会继续后台匹配；用户可以点击“重新匹配真人”再次等待。为了在同一浏览器测试两个账号，每个标签页使用独立会话，页面顶部会显示当前标签页实际参与匹配的账号。
