# 麦麦省钱助手

面向学生、上班族和日常麦当劳消费者的 MCP Skill：根据总预算、人数和目标餐品，比较同一门店同一餐单的真实优惠试算结果，推荐已验证方案中应付总价最低的方案。

特色：同餐单比较、包含配送费、排除未领取或过期券、预算不足明确说明、不为凑满减诱导加购。默认只查询和推荐。

## 安装与使用

1. 安装 Node.js 18 或更新版本。下载本项目，无需安装 npm 依赖。
2. 在支持本地 Skill 的客户端导入本目录中的 `SKILL.md`。具体导入位置以客户端说明为准。
3. 按 [MCP_INTEGRATION.md](MCP_INTEGRATION.md) 接入麦当劳官方 MCP，凭证只保存在本地。
4. 提问：“我一个人，总预算 30 元，到店取餐，想吃汉堡和饮料，帮我比较优惠。门店选我指定的店。”助手查询和试算后说明总价、节省金额和券条件。

## 离线演示

在本目录运行：

```sh
node scripts/compare.mjs examples/demo.json
node --test tests/compare.test.mjs
```

## 直接连接真实 MCP

将 `.env.example` 复制为 `.env`，在本地填入自己的 `MCD_MCP_TOKEN`。无需在聊天或公开仓库提供凭证。运行：

```sh
node scripts/mcp.mjs list
node scripts/mcp.mjs now-time-info
node scripts/mcp.mjs query-my-coupons
node scripts/mcp.mjs available-coupons
node scripts/mcp.mjs campaign-calendar
```

客户端完成初始化、工具发现和只读调用。工具结果写入本地 `tool-responses/`，终端仅显示成功状态。需要参数的工具使用 `node scripts/mcp.mjs <工具名> <参数文件.json>`；先通过 list 查看实时 schema。私人参数文件请以 `.local.json` 结尾。客户端使用项目目录中的 `.env`，也支持环境变量覆盖。

配置示例中的 `${MCD_MCP_TOKEN}` 是环境变量占位符，宿主必须支持变量展开；不支持时请在宿主的本地凭证设置中配置，不能将真实凭证写进示例。

演示数据全部虚构：同餐单无券 35 元，优惠方案 27.50 元，节省 7.50 元，低于 30 元预算；未领取的 20 元方案被排除。演示不代表真实餐品或活动。

## 项目结构

- `SKILL.md`：宿主执行的 MCP 工作流程。
- `scripts/compare.mjs`：无依赖的固定餐单报价比较源码。
- `examples/demo.json`：可复现离线数据。
- `tests/compare.test.mjs`：预算、金额、过期及门店条件测试。
- `MCP_INTEGRATION.md`：工具调用与归一化输入说明。
- `CONTEST_DECLARATION.md`：官方原文参赛声明。

## 当前状态

Skill、离线比较器及无依赖的真实 MCP 客户端已完成，已真实验证初始化、工具发现、账户查券、门店菜单和官方价格试算，详见 [VERIFICATION.md](VERIFICATION.md)。2026-10-12 在武汉宝利金餐厅试算同一杯热美式：无券促销价 11.90 元，新人七折券价 13.30 元，推荐无券，少花 1.40 元。此为历史验证结果，当前购买需重新试算。

复现脱敏历史比较：`node scripts/compare.mjs examples/verified-wuhan.json`。价格试算响应的 `data.price` 为整数分，应除以 100 后输入比较器；原价 `originalPrice` 不等同于无券实际应付价，不能混用。

未使用 WorkBuddy 开发，不提供虚构的 workbuddy.md。报名之前请阅读官方活动规则及参赛声明。

本作品非麦当劳官方产品。餐品、价格和供应状态以官方实时渠道为准。不得提交账号凭证和个人信息。

原创代码采用 MIT 许可证。官方参赛声明原文及麦当劳服务条款不属于本项目的 MIT 授权范围；使用 MCP 服务仍须遵守官方规则。
