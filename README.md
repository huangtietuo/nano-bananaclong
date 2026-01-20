# nano-bananaclong
香蕉网站克隆

## 本地运行

```bash
npm install
npm run dev
```

打开：
- http://localhost:3000
- http://localhost:3000/pricing

## Creem 支付接入

### 1) 环境变量

复制 [.env.local.example](file:///c:/Users/86185/Desktop/fuke/.env.local.example) 为 `.env.local`，并填入：
- `CREEM_API_KEY`：Creem Dashboard -> Developers -> API Key（测试/生产环境不同）
- `CREEM_PRODUCT_BASIC_MONTHLY / YEARLY`、`CREEM_PRODUCT_PRO_MONTHLY / YEARLY`、`CREEM_PRODUCT_MAX_MONTHLY / YEARLY`：Creem 产品 ID
- `CREEM_WEBHOOK_SECRET`：Creem Dashboard -> Developers -> Webhook Secret
- `SUPABASE_SERVICE_ROLE_KEY`：用于 Webhook 写库（不要在客户端暴露）

### 2) Checkout 跳转

Pricing 页面点击套餐按钮会调用：
- `POST /api/creem/checkout`

接口会创建 checkout session，并返回 `checkout_url`，前端直接跳转到 Creem 托管收银台。

### 3) Webhook（订阅状态入库）

Webhook 接口：
- `POST /api/creem/webhook`

签名校验：
- Header：`creem-signature`
- 算法：HMAC-SHA256（payload 作为 message，`CREEM_WEBHOOK_SECRET` 作为 key）

数据库表：
- `public.creem_subscription`
- 迁移文件： [20260119_creem.sql](file:///c:/Users/86185/Desktop/fuke/supabase/migrations/20260119_creem.sql)

在 Supabase SQL Editor 执行上述迁移后，再把你的 webhook URL 配到 Creem Dashboard 中即可。
