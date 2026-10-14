import { readFile, readdir, lstat, mkdir, copyFile, writeFile } from 'node:fs/promises';
import { resolve, relative, sep, dirname } from 'node:path';
import { createHash } from 'node:crypto';

// An explicit allowlist: never traverse the parent workspace or copy local history.
const project = resolve('.');
const sourceFiles = ['.gitignore','.gitattributes','.vercelignore','vercel.json','.github/workflows/deploy.yml','index.html','package.json','package-lock.json','tsconfig.json','vite.config.ts','playwright.config.ts','README.md','DEPLOYMENT.md','VERIFICATION.md','HERO-VERIFICATION.md','public/favicon.svg','public/fonts/Geist-Regular.woff2','public/fonts/Geist-Medium.woff2','public/fonts/OFL.txt'];
async function collect(directory, extensions, output) {
  for (const entry of await readdir(resolve(project,directory), {withFileTypes:true})) {
    if (entry.isSymbolicLink()) throw new Error(`Refusing symlink in ${directory}.`);
    const name = `${directory}/${entry.name}`;
    if (entry.isDirectory()) await collect(name, extensions, output);
    else if (extensions.test(entry.name)) output.push(name);
    else throw new Error(`Unexpected file in upload directory: ${name}`);
  }
}
await collect('src', /\.(?:ts|tsx|css)$/, sourceFiles);
await collect('scripts', /\.mjs$/, sourceFiles);
await collect('e2e', /\.ts$/, sourceFiles);
const publicFiles=[];
await collect('dist', /\.(?:html|js|css|svg|woff2|txt)$/, publicFiles);
if (!publicFiles.includes('dist/index.html')) throw new Error('Run npm run build first.');
if (publicFiles.some(f => !/^dist\/(?:index\.html|favicon\.svg|fonts\/(?:Geist-(?:Regular|Medium)\.woff2|OFL\.txt)|assets\/[^/]+\.(?:js|css))$/.test(f))) throw new Error('Build contains unexpected files.');
const stamp = new Date().toISOString().replace(/[:.]/g,'-');
const release = resolve(project,'release',`submission-${stamp}`);
await mkdir(release,{recursive:true});
const manifest = {preparedAt:new Date().toISOString(), uploaded:false, deployed:false, sourceRepositoryVisibility:'private', source:[], website:[]};
async function copy(files, destination, list, stripPrefix='') {
  for (const name of files.sort()) {
    const original = resolve(project,name);
    if (!(await lstat(original)).isFile()) throw new Error(`Not a regular file: ${name}`);
    const file = stripPrefix ? name.slice(stripPrefix.length) : name;
    const target = resolve(release,destination,file);
    await mkdir(dirname(target),{recursive:true});
    if (name.endsWith('.md')) {
      // Keep local usernames and absolute workspace paths out of the upload copy.
      const text = (await readFile(original,'utf8')).replace(/C:\\Users\\[^\r\n"`]*ai-engineer-motion-poster/g,'ai-engineer-motion-poster');
      await writeFile(target,text);
    } else await copyFile(original,target);
    const content = await readFile(target);
    list.push({file,bytes:content.length,sha256:createHash('sha256').update(content).digest('hex')});
  }
}
await copy(sourceFiles,'github-upload',manifest.source);
await copy(publicFiles,'website',manifest.website,'dist/');
await writeFile(resolve(release,'MANIFEST.json'),JSON.stringify(manifest,null,2)+'\n');
await writeFile(resolve(project,'release','LATEST.json'),JSON.stringify({directory:relative(project,release).split(sep).join('/'),sourceFiles:manifest.source.length,publicFiles:manifest.website.length},null,2)+'\n');
console.log(JSON.stringify({directory:relative(project,release).split(sep).join('/'),sourceFiles:manifest.source.length,publicFiles:manifest.website.length,sourceBytes:manifest.source.reduce((sum,file)=>sum+file.bytes,0),websiteBytes:manifest.website.reduce((sum,file)=>sum+file.bytes,0),uploaded:false,deployed:false},null,2));
