# 云寺院

单寺院事务办理：信众端（Web / H5）与管理端。当前界面为简体中文。

本站只登记祈福、点灯、吉祥牌位、往生牌位等寺院事务，并记录审核、支付与办理进度。**不宣传、不承诺任何宗教效验、感应或超度结果。**

本轮按 MVP 规格完成第 1–5 步的可运行切片。技术上采用一个 Next.js 全栈应用（App Router + TypeScript + Tailwind + Prisma + PostgreSQL），信众端在 `/`，管理端在 `/admin`。规格里的 `apps/web`、`apps/admin`、`apps/api` 拆分留到多端独立部署时再做；单体更适合先把办理闭环跑通。

## 环境

- Node.js 20 或更新
- npm
- Docker（用于 Postgres），或本机已有 PostgreSQL 16

## 启动

```bash
cp .env.example .env
docker compose up -d
npm install
npm run db:setup
npm run dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)。

`npm run db:setup` 会执行已提交的迁移并写入种子数据。重复执行会更新示例寺院、两座殿堂和演示账号密码，已占用的灯位 / 牌位状态不会被重置。

没有 Docker 时，自行准备数据库，并把 `.env` 里的 `DATABASE_URL` 指过去，然后同样执行 `npm install`、`npm run db:setup`、`npm run dev`。

健康检查：`GET /api/health`。

## 演示账号

种子每次都会重置这两个账号的密码。仅用于本地演示。

| 角色 | 邮箱 | 密码 |
| --- | --- | --- |
| 管理员 | admin@example.com | admin123456 |
| 信众 | devotee@example.com | devotee123456 |

种子寺院是「示例云岚寺」，殿堂为大雄宝殿、地藏殿。

## 走一遍祈福

1. 用信众账号登录。
2. 打开「殿堂」→ 大雄宝殿 → 祈福，填写并提交。
3. 退出，改用管理员登录。
4. 管理端「申请单」中打开该单，点「审核通过」。
5. 点「模拟支付成功」，再点「开始办理」「办理完成」。

点灯、吉祥牌位、往生牌位使用同一套申请单 / 订单 / 履约。可选空闲位置：提交时预留，支付后占用，驳回或撤回后释放。不选位置则由寺院安排。

信众也可以在自己的申请详情里支付。未配置 `STRIPE_SECRET_KEY` 时只有模拟支付。

## 登录

- 邮箱 + 密码：已接通。
- 邮箱验证码：按钮在，提交后明确提示尚未开通，不会假装已发信。
- Google / Apple：
  - 密钥留空且 `OIDC_MOCK` 不是 `false` 时，按钮进入模拟登录页，用邮箱创建或登录信众账号。
  - 填好密钥后走真实 OIDC。Google 使用授权码 + userinfo。Apple 使用 `response_mode=form_post`，并用 `jose` 校验 `id_token`。`state` 由 `AUTH_SECRET` 做 HMAC，避免依赖跨站 Cookie。
  - 生产环境设置 `OIDC_MOCK=false`。没有密钥时按钮会提示未配置，而不是静默模拟。

### Google

在 Google Cloud 配置 OAuth 客户端，回调为：

```text
${APP_URL}/auth/callback/google
```

`.env`：

```text
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
AUTH_SECRET=至少 16 位的随机字符串
OIDC_MOCK=false
```

### Apple

Services ID 的回调为：

```text
${APP_URL}/auth/callback/apple
```

二选一：

- 直接提供已经签好的 `APPLE_CLIENT_SECRET`（JWT）
- 或同时提供 `APPLE_CLIENT_ID`、`APPLE_TEAM_ID`、`APPLE_KEY_ID`、`APPLE_PRIVATE_KEY`（PKCS8 PEM，换行写成 `\n`），由服务在运行时签名

真实登录同样需要 `AUTH_SECRET`。

## 支付

支付走适配层，订单上记录渠道与价目快照（项目、殿堂、金额、币种、期限、采集时间）。办理项目可选币种：CNY、USD、HKD、SGD、TWD、EUR。种子数据使用 CNY。

- `PAYMENT_ALLOW_MOCK=true`：详情页显示「模拟支付成功」。
- `STRIPE_SECRET_KEY`：信众端额外显示 Stripe Checkout。
- Webhook：`POST ${APP_URL}/api/payments/stripe/webhook`，校验 `Stripe-Signature`，处理 `checkout.session.completed` 后把订单标为已支付。
- 未配置 `STRIPE_WEBHOOK_SECRET` 时 webhook 返回 501。

这是境外通道的接口骨架，不是完整的多币种结算、对账或退款。

## 脚本

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 开发服务器，端口 3000 |
| `npm run build` / `npm start` | 生产构建与启动 |
| `npm test` | 状态机、金额、OIDC state、Stripe 签名 |
| `npm run lint` | Next.js lint |
| `npm run db:up` | `docker compose up -d` |
| `npm run db:setup` | 迁移 + 种子 |
| `npm run db:reset` | 清空数据库并重新迁移、种子 |

## 本轮已做

1. 仓库骨架：本说明、`.env.example`、Postgres `docker-compose.yml`、Prisma schema、迁移与种子。
2. 殿堂：管理端增删改；信众端列表与详情，项目入口连到祈福 / 点灯 / 牌位。
3. 账号：邮箱密码注册登录、会话、信众 / 管理员；Google 与 Apple 的开始与回调；无密钥时模拟登录；验证码入口为明确的占位。
4. 订单域：申请单、订单、履约状态、价目快照、位置 + 期限库存。
5. 祈福、点灯、吉祥牌位、往生牌位：信众提交 → 管理端审核 → 模拟支付（或 Stripe Checkout）→ 办理中 → 完成。

## 还没做

6. 随喜与法会报名。
7. 电子功德证书与验真页。
8. 牌位 / 文疏模板、预览与 PDF 打印。
9. 完整境外收款（对账、退款、结算币种策略）。目前只有币种字段和 Stripe Checkout / webhook 骨架。
10. `next-intl` 的简体 / 繁体 / 英文文案。界面目前只有简体中文。

明确不做：3D / 全景、多寺院 SaaS、批量打印、直播、法物流通、RTL。
