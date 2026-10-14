import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, BookOpen, Film, Maximize2, Pause, Play, RotateCcw, X } from 'lucide-react';
import { usePoster } from './animation/usePoster';
import { isEditing, useSceneInput } from './animation/useSceneInput';
import { Scenes } from './components/Scenes';
import { PortraitScenes } from './components/PortraitScenes';
import { CompactReader } from './components/CompactReader';
import { ExportPanel } from './components/ExportPanel';
import { scenes } from './content';
import { layouts, type PosterFormat } from './layout';

const query = new URLSearchParams(location.search);
const renderOnly = query.get('render') === '1';
const format: PosterFormat = renderOnly && query.get('format') === 'portrait' ? 'portrait' : 'landscape';
const size = layouts[format];

export function App() {
  const { root, state, ready, go, step, pointer, toggle, restart } = usePoster(renderOnly, format);
  const [fullscreen, setFullscreen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [error, setError] = useState('');
  const [scale, setScale] = useState(1);
  const surface = useRef<HTMLElement>(null), stage = useRef<HTMLDivElement>(null);
  const focusBeforeExport = useRef<HTMLElement | null>(null);
  const scene = scenes[state.index];
  const toggleFullscreen = useCallback(() => {
    const result = document.fullscreenElement ? document.exitFullscreen() : stage.current?.requestFullscreen();
    void result?.catch(() => setError('Open this preview in your browser to use fullscreen.'));
  }, []);
  useSceneInput(surface, stage, { enabled: ready && !renderOnly, blocked: exportOpen, step, pointer, fullscreen: toggleFullscreen, toggle, restart });
  useEffect(() => {
    if (!stage.current) return;
    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setScale(Math.max(.01, Math.min(width / size.width, height / size.height)));
    });
    observer.observe(stage.current);
    const changed = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', changed);
    return () => { observer.disconnect(); document.removeEventListener('fullscreenchange', changed); };
  }, []);
  useEffect(() => {
    if (!exportOpen) return;
    focusBeforeExport.current = document.activeElement as HTMLElement;
    document.querySelector<HTMLElement>('.export-panel button')?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isEditing(event.target)) setExportOpen(false);
      if (event.key !== 'Tab') return;
      const controls = [...document.querySelectorAll<HTMLElement>('.export-panel button:not(:disabled), .export-panel a, .export-panel select')];
      const current = controls.indexOf(document.activeElement as HTMLElement);
      event.preventDefault(); controls[(current + (event.shiftKey ? -1 : 1) + controls.length) % controls.length]?.focus();
    };
    window.addEventListener('keydown', key);
    return () => { window.removeEventListener('keydown', key); focusBeforeExport.current?.focus(); };
  }, [exportOpen]);
  const poster = <div ref={stage} className={`poster-stage ${renderOnly ? 'render-stage' : 'interactive-stage'}`} tabIndex={-1} data-tone={[1,3].includes(state.index) ? 'light' : 'dark'} style={{ '--poster-width': `${size.width*scale}px` } as CSSProperties}>
    <div className="poster-fit" style={{ width: size.width*scale, height: size.height*scale }}><div ref={root} className={`poster ${format === 'landscape' ? 'landscape-poster' : ''}`} data-format={format} data-ready={ready} data-active-scene={state.index} data-transitioning={state.transitioning} data-transition={state.effect ?? ''} style={{ transform: `scale(${scale})` }}>{format === 'portrait' ? <PortraitScenes /> : <Scenes />}</div></div>
    {fullscreen && <><div className="fullscreen-tools"><button aria-label="Previous scene" disabled={state.transitioning} onClick={() => step(-1)}><ArrowLeft size={16} /></button><button aria-label={state.playing ? 'Pause presentation' : 'Play presentation'} onClick={toggle}>{state.playing ? <Pause size={15} /> : <Play size={15} />}</button><button aria-label="Restart presentation" onClick={restart}><RotateCcw size={15} /></button><button aria-label="Next scene" disabled={state.transitioning} onClick={() => step(1)}><ArrowRight size={16} /></button><span>{String(state.index+1).padStart(2,'0')} / 05</span></div><button className="fullscreen-exit" aria-label="Exit fullscreen" onClick={toggleFullscreen}><X size={18} /><span>ESC</span></button></>}
  </div>;
  if (renderOnly) return <main className="render-page">{poster}</main>;
  return <main ref={surface} className={`career-app interactive-app widescreen-app ${notesOpen ? 'notes-open' : ''} ${fullscreen ? 'is-fullscreen' : ''}`} data-mode={state.mode}>
    <header className="app-header"><a className="app-brand" href={import.meta.env.BASE_URL} aria-label="Future Careers home"><span className="brand-symbol">ai<span>↗</span></span><div>FUTURE CAREERS<small>ARTIFICIAL INTELLIGENCE ENGINEER</small></div></a><p className="header-course">DESIGNING INTELLIGENCE.<br /><span>SHAPING TOMORROW.</span></p><div className="header-actions"><button aria-label="Speaking notes" aria-expanded={notesOpen} aria-controls="speaking-notes" onClick={() => setNotesOpen(!notesOpen)}><BookOpen size={15} /><span>Speaking notes</span></button><button aria-label="Export film" onClick={() => setExportOpen(true)}><Film size={15} /><span>Export film</span></button><button aria-label="Fullscreen" onClick={toggleFullscreen}><Maximize2 size={15} /></button></div></header>
    <section className="interactive-workspace" aria-label="Widescreen interactive poster">{poster}</section>
    <footer className="chapter-footer"><div className="presentation-controls"><button aria-label="Previous scene" disabled={!ready || state.transitioning} onClick={() => step(-1)}><ArrowLeft size={15} /></button><button className="presentation-play" aria-label={state.playing ? 'Pause presentation' : 'Play presentation'} disabled={!ready} onClick={toggle}>{state.playing ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}{state.playing ? 'Pause' : 'Play'}</button><button aria-label="Restart presentation" disabled={!ready} onClick={restart}><RotateCcw size={15} /></button><span className="presentation-mode">{state.mode === 'autoplay' ? 'AUTO PRESENTATION' : 'INTERACTIVE'}</span></div>
      <nav className="chapter-progress" aria-label="Presentation progress">{scenes.map((chapter,i) => { const fill = i < state.index ? 1 : i > state.index ? 0 : state.mode === 'autoplay' ? Math.max(0,Math.min(1,(state.time-chapter.start)/(chapter.end-chapter.start))) : .24; return <button key={chapter.name} aria-label={`Scene ${i+1}: ${chapter.name}`} aria-current={state.index === i ? 'step' : undefined} disabled={!ready || state.transitioning} onClick={() => go(i)}><span>{String(i+1).padStart(2,'0')}</span><span className="chapter-track"><i className="chapter-fill" style={{ transform: `scaleX(${fill})` }} /></span></button>; })}<span className="progress-count" aria-live="polite">{String(state.index+1).padStart(2,'0')} / 05</span></nav>
      <button className="next-label" aria-label="Next scene" onClick={() => step(1)} disabled={!ready || state.transitioning}>{state.index === 4 ? 'BACK TO START' : 'NEXT'}<ArrowDown size={13} /></button>
    </footer>
    <CompactReader index={state.index} />
    {notesOpen && <aside id="speaking-notes" className="presenter-notes" data-native-scroll="true" aria-label="Speaking notes"><div className="notes-top"><span className="ui-label">PRESENTER NOTES</span><button aria-label="Close speaking notes" onClick={() => setNotesOpen(false)}><X size={16} /></button></div><span className="note-scene-number">{String(state.index+1).padStart(2,'0')} / 05</span><h2>{scene.name}</h2><p className="note-text">{scene.note}</p><div className="speaker-cue"><span>↗</span><p>{scene.cue}</p></div><div className="notes-keys"><span>SCROLL / SWIPE / ← → CHANGE SCENE</span><span>SPACE PLAY / PAUSE · R RESTART</span><span>F FULLSCREEN · ESC EXIT</span></div></aside>}
    {error && <div role="alert" className="app-error">{error}<button onClick={() => setError('')} aria-label="Dismiss message"><X size={15} /></button></div>}
    {exportOpen && <ExportPanel close={() => setExportOpen(false)} />}
    <p className="sr-only" aria-live="polite">Scene {state.index+1} of 5: {scene.name}</p>
  </main>;
}
