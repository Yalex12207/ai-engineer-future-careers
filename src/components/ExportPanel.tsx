import { useEffect, useState } from 'react';
import { Check, Copy, Download, Film, X } from 'lucide-react';
import { exportName, layouts, type PosterFormat } from '../layout';
type Job = { state: 'idle' | 'rendering' | 'complete' | 'failed'; progress: number; format?: PosterFormat; fps?: number; error?: string };
export function ExportPanel({ close }: { close: () => void }) {
  const [job,setJob] = useState<Job>({state:'idle',progress:0});
  const [format,setFormat] = useState<PosterFormat>('landscape');
  const [fps,setFps] = useState(30);
  const [available,setAvailable] = useState(false), [copied,setCopied] = useState(false), [cliOnly,setCliOnly] = useState(import.meta.env.PROD);
  const [legacyAvailable,setLegacyAvailable] = useState(false);
  const requestedFile = `/exports/${exportName(format,fps)}`;
  const file = legacyAvailable ? '/exports/ai-engineer.mp4' : requestedFile;
  const size = layouts[format];
  const command = `npm run export:video -- --format ${format} --fps ${fps}`;
  useEffect(() => {
    if (import.meta.env.PROD) return;
    const abort = new AbortController(); setAvailable(false); setCopied(false); setLegacyAvailable(false);
    void (async () => {
      const response=await fetch(requestedFile,{method:'HEAD',signal:abort.signal});
      let found=response.ok&&(response.headers.get('content-type')??'').startsWith('video/');
      let legacy=false;
      if(!found&&format==='portrait'&&fps===30) {
        const existing=await fetch('/exports/ai-engineer.mp4',{method:'HEAD',signal:abort.signal});
        legacy=found=existing.ok&&(existing.headers.get('content-type')??'').startsWith('video/');
      }
      if(!abort.signal.aborted){setAvailable(found);setLegacyAvailable(legacy);}
    })().catch(()=>{});
    return () => abort.abort();
  },[requestedFile,format,fps]);
  useEffect(() => {
    if (import.meta.env.PROD) return;
    const abort = new AbortController();
    void fetch('/__poster/export',{signal:abort.signal}).then(async r => {
      if(!r.ok || !(r.headers.get('content-type')??'').includes('application/json')) {setCliOnly(true);return;}
      const next = await r.json() as Job; setJob(next);
      if(next.state==='rendering' && next.format && next.fps) {setFormat(next.format);setFps(next.fps);}
    }).catch(()=>{if(!abort.signal.aborted)setCliOnly(true);});
    return () => abort.abort();
  },[]);
  useEffect(() => {
    if(job.state!=='rendering')return;
    const abort=new AbortController();const timer=window.setInterval(()=>{
      void fetch('/__poster/export',{signal:abort.signal}).then(r=>r.json()).then((next:Job)=>{setJob(next);if(next.state==='complete'){setLegacyAvailable(false);setAvailable(true);}}).catch(()=>{});
    },1000);
    return()=>{clearInterval(timer);abort.abort();};
  },[job.state]);
  async function render(){
    try{const response=await fetch('/__poster/export',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({format,fps})});if(!response.ok)throw new Error('Local renderer unavailable. Use the terminal command below.');setJob(await response.json() as Job);}
    catch(error){setJob({state:'failed',progress:0,error:String(error)});}
  }
  return <div className="export-backdrop" onClick={e=>{if(e.target===e.currentTarget)close();}}><section className="export-panel" role="dialog" aria-modal="true" aria-labelledby="export-title"><div className="export-heading"><Film size={23}/><button onClick={close} aria-label="Close export panel"><X size={20}/></button></div><p className="ui-label">TAKE IT WITH YOU</p><h2 id="export-title">Your future.<br/>In motion.</h2><p className="export-copy">The full five-act presentation, ready for the big screen.</p>
    <div className="export-options"><label>COMPOSITION<select aria-label="Export composition" value={format} disabled={job.state==='rendering'} onChange={e=>setFormat(e.target.value as PosterFormat)}><option value="landscape">Landscape · 1920 × 1080</option><option value="portrait">Portrait · 1080 × 1920</option></select></label><label>FRAME RATE<select aria-label="Export frame rate" value={fps} disabled={job.state==='rendering'} onChange={e=>setFps(Number(e.target.value))}><option value="30">30 FPS</option><option value="60">60 FPS</option></select></label></div>
    <div className="export-specs"><span>{size.exportWidth} × {size.exportHeight}</span><span>{fps} FPS</span><span>55 SEC</span><span>MP4 / H.264</span></div>
    {job.state==='rendering'&&<div role="status" className="export-progress"><span>Rendering frames · {Math.round(job.progress)}%</span><progress max="100" value={job.progress}/><small>Your interactive poster remains available.</small></div>}
    {job.state==='failed'&&<p role="alert" className="export-error">{job.error}</p>}
    {available&&<a className="solid-button download-button" href={file} download={`AI-Engineer-${size.exportWidth}x${size.exportHeight}-${fps}fps.mp4`}><Download size={16}/>Download MP4</a>}
    {!cliOnly&&<button className={available?'outline-button':'solid-button'} disabled={job.state==='rendering'} onClick={()=>void render()}><Film size={16}/>{job.state==='rendering'?'Rendering…':available?'Render again':'Render MP4'}</button>}
    <div className="export-command"><span className="ui-label">OR RUN IN YOUR TERMINAL</span><button onClick={()=>{void navigator.clipboard.writeText(command).then(()=>setCopied(true)).catch(()=>setCopied(false));}} aria-label="Copy video export command"><code>{command}</code>{copied?<Check size={15}/>:<Copy size={15}/>}</button><small>Local export uses Playwright + FFmpeg.</small></div></section></div>;
}
