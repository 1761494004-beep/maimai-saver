import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const cents = (value, label) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || Math.abs(value * 100 - Math.round(value * 100)) > 1e-7) {
    throw new Error(`${label} 必须为非负金额，最多两位小数`);
  }
  return Math.round(value * 100);
};

export function compare(input) {
  const now = Date.parse(input.now);
  if (!Number.isFinite(now)) throw new Error('now 必须为有效时间');
  if (!input.basketId || !input.storeId || !input.mode) throw new Error('需要餐单、门店和就餐方式');
  const budget = cents(input.budget, 'budget');
  const baseline = cents(input.baselineTotal, 'baselineTotal');
  if (!Array.isArray(input.quotes)) throw new Error('quotes 必须为数组');
  const eligible = [];
  const excluded = [];
  for (const q of input.quotes) {
    let reason;
    const quotedAt = Date.parse(q.quotedAt);
    const expiresAt = Date.parse(q.expiresAt);
    if (q.basketId !== input.basketId || q.storeId !== input.storeId || q.mode !== input.mode) reason = '不是相同餐单、门店或就餐方式';
    else if (q.status !== 'verified' || q.conditionsConfirmed !== true) reason = '未通过官方试算或条件未确认';
    else if (!Number.isFinite(quotedAt) || !Number.isFinite(expiresAt) || quotedAt > now || expiresAt <= now || expiresAt <= quotedAt) reason = '时间无效或报价已过期';
    else if (q.couponOwned !== true) reason = '优惠券尚未领取或不可用';
    if (reason) { excluded.push({ name: q.name, reason }); continue; }
    const total = cents(q.total, 'total');
    eligible.push({ name: q.name, total: total / 100, saving: Math.max(0, baseline - total) / 100, withinBudget: total <= budget, conditions: q.conditions, expiresAt: q.expiresAt, quotedAt: q.quotedAt });
  }
  eligible.sort((a, b) => a.total - b.total || a.name.localeCompare(b.name, 'zh-CN'));
  return { source: input.source === 'demo' ? '虚构数据离线演示' : '官方试算归一化数据（由调用方提供）', baselineTotal: baseline / 100, budget: budget / 100, recommendation: eligible[0] ?? null, alternatives: eligible.slice(1, 3), excluded, note: '仅比较已验证的相同餐单方案；total 须包含配送费等全部费用。' };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (!process.argv[2]) throw new Error('用法：node scripts/compare.mjs <input.json>');
    console.log(JSON.stringify(compare(JSON.parse(readFileSync(process.argv[2], 'utf8'))), null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
