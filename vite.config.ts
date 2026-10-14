import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { spawn } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { exportName, type PosterFormat } from './src/layout';
function posterPublicAssets(): Plugin {
  let publicDir = '';
  return {
    name: 'poster-public-assets', apply: 'build',
    configResolved(config) { publicDir = config.publicDir; },
    async generateBundle() {
      // Only website assets enter dist. Local films and their diagnostics stay local.
      for (const fileName of ['favicon.svg', 'fonts/Geist-Regular.woff2', 'fonts/Geist-Medium.woff2', 'fonts/OFL.txt']) {
        this.emitFile({ type: 'asset', fileName, source: await readFile(resolve(publicDir, fileName)) });
      }
    },
  };
}
function localVideoExport(): Plugin {
  let job = { state: 'idle', progress: 0, error: '', format: 'landscape' as PosterFormat, fps: 30 };
  let child: ReturnType<typeof spawn> | null = null;
  return { name:'local-poster-video-export', configureServer(server) {
    // Vite caches its public directory inventory. Since export writes are
    // excluded from HMR, serve these known filenames directly so a newly
    // generated file is available immediately, including video range seeks.
    server.middlewares.use('/exports', async (req,res,next) => {
      const name=(req.url??'').split('?')[0];
      if(!/^\/ai-engineer(?:-(?:landscape|portrait)-(?:30|60))?\.(?:mp4|json)$/.test(name)||!['GET','HEAD'].includes(req.method??'')){next();return;}
      const file=resolve(server.config.root,'public','exports',name.slice(1));
      let info;
      try{info=await stat(file);}catch{next();return;}
      if(!info.isFile()){next();return;}
      let start=0,end=info.size-1;
      const range=req.headers.range;
      if(range) {
        const match=/^bytes=(\d*)-(\d*)$/.exec(range);
        if(match&&(match[1]||match[2])) {
          start=match[1]?Number(match[1]):Math.max(0,info.size-Number(match[2]));
          end=match[1]&&match[2]?Math.min(end,Number(match[2])):end;
        } else start=info.size;
        if(start>end||start<0){res.statusCode=416;res.setHeader('Content-Range',`bytes */${info.size}`);res.end();return;}
        res.statusCode=206;res.setHeader('Content-Range',`bytes ${start}-${end}/${info.size}`);
      }
      res.setHeader('Content-Type',name.endsWith('.mp4')?'video/mp4':'application/json');
      res.setHeader('Content-Length',end-start+1);res.setHeader('Accept-Ranges','bytes');
      res.setHeader('Cache-Control','no-cache');res.setHeader('Last-Modified',info.mtime.toUTCString());
      if(req.method==='HEAD'){res.end();return;}
      const stream=createReadStream(file,{start,end});
      stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
    });
    server.middlewares.use('/__poster/export', (req,res) => {
      res.setHeader('Content-Type','application/json'); res.setHeader('Cache-Control','no-store');
      if(req.method==='GET'){res.end(JSON.stringify(job));return;}
      if(req.method!=='POST'){res.statusCode=405;res.end(JSON.stringify({error:'GET or POST required.'}));return;}
      const origin=req.headers.origin;
      if(origin && origin!==`http://${req.headers.host}`){res.statusCode=403;res.end(JSON.stringify({error:'Local origin required.'}));return;}
      let body='';
      req.on('data',chunk=>{body+=String(chunk);if(body.length>2048)req.destroy();});
      req.on('end',()=>{
        let selection: {format?:unknown;fps?:unknown};
        try{selection=body?JSON.parse(body):{};}catch{res.statusCode=400;res.end(JSON.stringify({error:'Invalid JSON.'}));return;}
        const format=selection?.format??'landscape',fps=selection?.fps??30;
        if(!['landscape','portrait'].includes(String(format)) || ![30,60].includes(Number(fps))){res.statusCode=400;res.end(JSON.stringify({error:'Select landscape/portrait and 30/60 FPS.'}));return;}
        if(job.state==='rendering'){res.statusCode=409;res.end(JSON.stringify(job));return;}
        job={state:'rendering',progress:0,error:'',format:format as PosterFormat,fps:Number(fps)};
        child=spawn(process.execPath,['scripts/export-video.mjs','--url','http://127.0.0.1:5173','--format',job.format,'--fps',String(job.fps),'--output',`public/exports/${exportName(job.format,job.fps)}`],{cwd:server.config.root,windowsHide:true,stdio:['ignore','pipe','pipe']});
        let buffered='',error='';
        child.stdout?.on('data',chunk=>{buffered+=String(chunk);const lines=buffered.split('\n');buffered=lines.pop()??'';for(const line of lines)if(line.startsWith('PROGRESS '))job.progress=Number(line.slice(9));});
        child.stderr?.on('data',chunk=>{error=(error+String(chunk)).slice(-1500);});
        child.on('error',cause=>{job={...job,state:'failed',error:cause.message};child=null;});
        child.on('close',code=>{job={...job,state:code===0?'complete':'failed',progress:code===0?100:job.progress,error:code===0?'':error||'Render failed. Check FFmpeg and browser installation.'};child=null;});
        res.end(JSON.stringify(job));
      });
    });
    server.httpServer?.on('close',()=>child?.kill());
  }};
}
export default defineConfig(({command,isPreview}) => ({
  // Local authoring stays at /; production and preview use the Pages project path.
  base: command === 'serve' && !isPreview ? '/' : '/ai-engineer-future-careers/',
  plugins:[react(),localVideoExport(),posterPublicAssets()],
  build:{copyPublicDir:false,sourcemap:false},
  server:{port:5173,strictPort:true,watch:{ignored:['**/public/exports/**','**/qa/**','**/release/**','**/test-results/**']}},
  preview:{port:4173,strictPort:true},
}));
