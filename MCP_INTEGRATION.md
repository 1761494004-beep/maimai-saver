# MCP 接入说明

官方资料：https://github.com/M-China/mcd-mcp-server

服务地址 `https://mcp.mcd.cn`，协议 Streamable HTTP，请求头 `Authorization: Bearer <本地 Token>`。在 https://open.mcd.cn/mcp 使用手机号登录并申请 Token，将凭证填入宿主客户端本地的连接器设置，禁止提交到 GitHub。本项目无需 npm 依赖；支持宿主工具调用，也提供 `scripts/mcp.mjs` 直接调用只读工具。比较器只处理归一化报价。

## 实际实现与验证状态

已实现 Skill 的查询、固定餐单试算比较流程、离线比较器和真实 Streamable HTTP 客户端。已使用本地 Token 完成初始化、工具发现、账户查券、门店菜单、餐品详情和两次固定餐单官方试算。详见 VERIFICATION.md。demo.json 为虚构数据，verified-wuhan.json 为脱敏历史验证数据。

## 工具与调用流程

通过宿主发现实时工具 schema，按其定义填写参数：

1. `now-time-info` 确认时间；`query-my-coupons`、`available-coupons`、`campaign-calendar` 查拥有的券、可领券和活动。
2. 到店使用 `query-nearby-stores`；配送使用 `delivery-query-addresses`、`delivery-query-stores`，由用户选择门店。
3. `query-store-coupons`、`query-meals`、`query-meal-detail` 核对门店可用券及餐单。
4. `calculate-price` 分别计算同餐单无券和不同合法优惠组合的含费用总价。
5. 用下方内部格式保存已核实的报价，运行比较器；输出预算内最低方案及限制。

业务价值：同时考虑券适用门店、餐品、时段、配送费和使用门槛，避免只看券面优惠金额造成误判。默认不领券或下单。

## 内部报价格式

`examples/demo.json` 是完整样例。这是本项目归一化格式，不是官方 API 的参数或响应格式。

- `now`：本次比较时间；`budget`、`baselineTotal`：总预算与同餐单无券应付价，人民币、最多两位小数。
- `basketId`、`storeId`、`mode`：固定餐单标识、同一门店、同一就餐方式。
- `quotes`：试算方案数组；每项包含相同三个标识、`name`、`total`（所有费用合计）、`conditions`、`quotedAt`、`expiresAt`、`status`、`conditionsConfirmed`、`couponOwned`。
- 只有官方成功试算及条件已核对才设置 `status: verified`、`conditionsConfirmed: true`。无券基线的 `couponOwned` 设为 true；可领但未领取券设为 false。
- 报价有效期取官方限制与本次比价窗口（建议查询后五分钟）的较早值，不能把券到期时间当作价格保留承诺。日期使用带时区的 ISO 时间。
- 餐单标识必须包含餐品编码、数量、替换选项；客户端负责归一化及判断条件，比较器不验证官方来源真实性。
- 本次真实 `calculate-price` 响应中 `data.price`、`originalPrice` 是整数分，换成人民币元需除以 100；无券基线必须是无券官方试算的 price，不能以 originalPrice 替代。优惠套餐与单品编码不同但内容相同时，先通过 query-meal-detail 核实 round、选项和数量，再生成相同的实际餐品标识。

## 真实验证清单

连接成功并发现工具 → 用户确定门店及餐单 → 获得无券及优惠官方试算 → 对照官方应付总价 → 运行比较器 → 确认推荐与预算、券条件一致。只记录脱敏的验证结论，不提交原始账号响应。
