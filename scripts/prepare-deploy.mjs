import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;
if (!databaseId || !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(databaseId) || /^0+-0+-0+-0+-0+$/.test(databaseId)) {
  console.error('尚未設定有效的 CLOUDFLARE_D1_DATABASE_ID。先在自己的 Cloudflare 帳戶建立 D1，勿使用本機佔位 ID 部署。');
  process.exit(1);
}
// The checked-in config uses full-line comments only; preserve one source of truth.
const config = JSON.parse(readFileSync(resolve(root, 'wrangler.jsonc'), 'utf8').replace(/^\s*\/\/.*$/gm, ''));
config.main = resolve(root, config.main);
config.assets.directory = resolve(root, config.assets.directory);
config.d1_databases[0].database_id = databaseId;
config.d1_databases[0].migrations_dir = resolve(root, config.d1_databases[0].migrations_dir);
config.vars.APP_ORIGIN = process.env.FRONTEND_ORIGIN ?? '';
config.vars.BRIDGE_ENABLED = process.env.BRIDGE_ENABLED === 'true' ? 'true' : 'false';
// A token remains a Cloudflare secret. Never place it in this generated config.
const output = resolve(root, '.local/deploy');
mkdirSync(output, { recursive: true });
writeFileSync(resolve(output, 'wrangler.json'), JSON.stringify(config, null, 2) + '\n');
console.log('已準備部署設定；未更動正式資源，也未寫入憑證。');
