import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { compare } from '../scripts/compare.mjs';
const fixture = () => JSON.parse(readFileSync(new URL('../examples/demo.json', import.meta.url), 'utf8'));
test('同餐单最低报价，精确计算省下金额，排除未领取券', () => {
  const result = compare(fixture());
  assert.equal(result.recommendation.total, 27.5);
  assert.equal(result.recommendation.saving, 7.5);
  assert.equal(result.recommendation.withinBudget, true);
  assert.equal(result.excluded.length, 1);
});
test('过期或其他门店报价不参加比较', () => {
  const input = fixture();
  input.quotes[1].storeId = 'other';
  input.quotes[0].expiresAt = input.now;
  assert.equal(compare(input).recommendation, null);
});
test('预算不足也如实报告，不隐藏最低价', () => {
  const input = fixture(); input.budget = 10;
  assert.equal(compare(input).recommendation.withinBudget, false);
});
test('拒绝负金额与未确认优惠条件', () => {
  const input = fixture(); input.budget = -1;
  assert.throws(() => compare(input), /非负金额/);
  const other = fixture(); other.quotes[1].conditionsConfirmed = false;
  assert.equal(compare(other).recommendation.total, 35);
});
test('七折券比促销价贵时推荐无券实际应付价', () => {
  const input = JSON.parse(readFileSync(new URL('../examples/verified-wuhan.json', import.meta.url), 'utf8'));
  const result = compare(input);
  assert.equal(result.recommendation.total, 11.9);
  assert.equal(result.recommendation.saving, 0);
  assert.equal(result.alternatives[0].total, 13.3);
});
