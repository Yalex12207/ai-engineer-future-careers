import { createServer } from 'node:http';
import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, relative, extname, sep } from 'node:path';
import { spawn } from 'node:child_process';

const root = resolve(process.env.POSTER_STATIC_DIR || 'dist');
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css', '.svg':'image/svg+xml', '.woff2':'font/woff2', '.txt':'text/plain; charset=utf-8' };
const files = [];
async function inventory(directory) {
  for (const entry of await readdir(directory, {withFileTypes:true})) {
    if (entry.isSymbolicLink()) throw new Error('Symlinks are not allowed in the public build.');
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) await inventory(path);
    else files.push(relative(root, path).split(sep).join('/'));
  }
}
await inventory(root);
const allowed = /^(?:index\.html|favicon\.svg|fonts\/(?:Geist-(?:Regular|Medium)\.woff2|OFL\.txt)|assets\/[^/]+\.(?:js|css))$/;
if (files.some(file => !allowed.test(file))) throw new Error('Unexpected public files: ' + files.filter(file => !allowed.test(file)).join(', '));
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url || '/', 'http://localhost').pathname);
    const file = resolve(root, pathname === '/' ? 'index.html' : '.' + pathname);
    const within = relative(root, file);
    if (within.startsWith('..') || !files.includes(within.split(sep).join('/'))) {
      response.writeHead(404); response.end('Not found'); return;
    }
    const info = await stat(file);
    response.writeHead(200, {'Content-Type':mime[extname(file)], 'Content-Length':info.size, 'X-Content-Type-Options':'nosniff'});
    response.end(request.method === 'HEAD' ? undefined : await readFile(file));
  } catch { response.writeHead(404); response.end('Not found'); }
});
await new Promise((resolveReady, reject) => {server.once('error', reject);server.listen(0, '127.0.0.1', resolveReady);});
const address = server.address();
console.log(`Production-only static preview: http://127.0.0.1:${address.port} (${files.length} public files)`);
try {
  const child = spawn(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', ...process.argv.slice(2)], {
    stdio:'inherit', windowsHide:true,
    env:{...process.env, POSTER_TEST_URL:`http://127.0.0.1:${address.port}`, POSTER_PRODUCTION:'1'},
  });
  const code = await new Promise((resolveExit, reject) => {child.once('error', reject); child.once('exit', code => resolveExit(code ?? 1));});
  process.exitCode = code;
} finally { await new Promise(resolveClose => server.close(resolveClose)); }
