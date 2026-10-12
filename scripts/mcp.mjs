import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

let token = process.env.MCD_MCP_TOKEN;
if (!token) {
  try { token = readFileSync(new URL('../.env', import.meta.url), 'utf8').match(/^MCD_MCP_TOKEN=(.+)$/m)?.[1]?.trim(); } catch {}
}
if (!token) { console.error('请在本地 .env 中设置 MCD_MCP_TOKEN'); process.exit(1); }
let session;
let id = 0;
let protocol = '2024-11-05';
async function request(method, params, notification = false) {
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' };
  if (session) headers['Mcp-Session-Id'] = session;
  if (method !== 'initialize') headers['MCP-Protocol-Version'] = protocol;
  const body = { jsonrpc: '2.0', method, params, ...(notification ? {} : { id: ++id }) };
  const response = await fetch('https://mcp.mcd.cn', { method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(30000), redirect: 'error' });
  session = response.headers.get('mcp-session-id') || session;
  if (!response.ok) throw new Error(`MCP HTTP ${response.status}`);
  if (notification && response.status === 202) return;
  const raw = await response.text();
  if (!raw.trim()) { if (notification) return; throw new Error('MCP 返回空响应'); }
  let result;
  if (response.headers.get('content-type')?.includes('text/event-stream')) {
    const messages = raw.split(/\r?\n\r?\n/).map(event => event.split(/\r?\n/).filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n')).filter(Boolean);
    result = messages.map(value => JSON.parse(value)).find(value => value.id === body.id);
  } else result = JSON.parse(raw);
  if (!result) throw new Error('未找到对应 MCP 响应');
  if (!notification && result.id !== body.id) throw new Error('MCP 响应编号不匹配');
  if (result.error) throw new Error(`MCP RPC ${result.error.code}`);
  return result.result;
}
try {
  const init = await request('initialize', { protocolVersion: protocol, capabilities: {}, clientInfo: { name: 'maimai-saver', version: '0.1.0' } });
  protocol = init.protocolVersion;
  await request('notifications/initialized', {}, true);
  const tools = [];
  let cursor;
  do {
    const page = await request('tools/list', cursor ? { cursor } : {});
    tools.push(...page.tools); cursor = page.nextCursor;
  } while (cursor);
  if (!process.argv[2] || process.argv[2] === 'list') {
    const names = ['now-time-info', 'query-my-coupons', 'available-coupons', 'campaign-calendar', 'query-nearby-stores', 'query-store-coupons', 'query-meals', 'query-meal-detail', 'calculate-price'];
    console.log(JSON.stringify({ connected: true, protocol, totalTools: tools.length, tools: tools.filter(tool => names.includes(tool.name)).map(tool => ({ name: tool.name, inputSchema: tool.inputSchema })) }, null, 2));
  } else {
    const name = process.argv[2];
    const allowed = ['now-time-info', 'query-my-coupons', 'available-coupons', 'campaign-calendar', 'query-nearby-stores', 'delivery-query-addresses', 'delivery-query-stores', 'query-store-coupons', 'query-meals', 'query-meal-detail', 'calculate-price'];
    if (!allowed.includes(name)) throw new Error('此客户端仅允许省钱比较所需的只读工具');
    if (!tools.some(tool => tool.name === name)) throw new Error('服务未提供该工具');
    const args = process.argv[3] ? JSON.parse(readFileSync(process.argv[3], 'utf8')) : {};
    const result = await request('tools/call', { name, arguments: args });
    const folder = fileURLToPath(new URL('../tool-responses', import.meta.url));
    mkdirSync(folder, { recursive: true });
    writeFileSync(resolve(folder, `${name}.local.json`), JSON.stringify(result, null, 2));
    const business = result.structuredContent;
    const succeeded = result.isError !== true && business?.success !== false;
    console.log(JSON.stringify({ tool: name, succeeded, businessCode: business?.code, contentBlocks: result.content?.length ?? 0, savedLocally: true }));
    if (!succeeded) process.exitCode = 1;
  }
} catch (error) { console.error(error.message.replaceAll(token, '[redacted]')); process.exitCode = 1; }
