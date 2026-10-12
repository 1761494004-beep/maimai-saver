# 真实 MCP 验证记录

验证日期：2026 年 10 月 12 日（北京时间）。仅保留脱敏结论。

- initialize / notifications/initialized：成功协商 MCP 2024-11-05。
- tools/list：成功发现 35 个工具，读取实时 inputSchema。
- now-time-info：业务 success=true、code=200，时间为北京时间。
- query-my-coupons：业务 success=true、code=200，成功获取账户优惠券。
- available-coupons：业务 success=true、code=200，成功获取可领券。
- campaign-calendar：业务 success=true、code=200，成功查询活动日历。
- query-nearby-stores（收藏门店）：返回收藏列表为空。客户端将业务失败与协议成功区分。
- query-nearby-stores（武汉城市搜索）：success=true、code=200，选择正在营业的武汉宝利金餐厅（storeCode 1960073）作只读验证。
- query-store-coupons / query-meals / query-meal-detail：success=true、code=200，成功查询门店优惠、实时早餐菜单及中杯美式可选项。
- calculate-price：两次均 success=true、code=200。固定内容为热美式中杯一杯、不加奶，到店取餐。无券单品 507368 试算 price=1190；新人七折券餐品 9900000119、round=1 内选择同一 507368，试算 price=1330。官方本次价格整数单位为分，折算 11.90 元与 13.30 元。
- 结论：当时无券门店促销比新人七折券便宜 1.40 元；不应只根据“七折”推荐用券。标价 19 元不是当前无券实际应付价。本记录保留脱敏结果，不公开任何券标识或账号信息。

已完成真实工具查询、官方固定餐单价格试算及归一化比较。只验证到店单品，不声称验证配送、所有券或所有套餐组合。账户原始响应位于被 Git 忽略的 tool-responses/，Token 位于被忽略的 .env，均不上传。历史验证价不代表之后仍可购买。

比较器五项行为测试已通过，覆盖最低价格、过期/门店差异排除、预算不足、金额/条件验证，以及券价高于促销价时推荐无券。
