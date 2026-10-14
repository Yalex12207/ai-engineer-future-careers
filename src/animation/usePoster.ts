import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { createPosterTimeline } from './timeline';
import { createInteractiveTransition, readingState, type TransitionName } from './interactive-transitions';
import { createFilmRenderer, createIntro } from './film-renderer';
import { createAtmosphere } from './atmosphere';
import { createSignatureReveal } from './signature';
import { DURATION, sceneAt, scenes, type Mode } from '../content';
import type { PosterFormat } from '../layout';

export type PosterSnapshot = { time: number; index: number; playing: boolean; transitioning: boolean; mode: Mode; effect: TransitionName | null };
export type PosterAPI = {
  ready: boolean; duration: number; seek: (seconds: number) => void;
  go: (index: number) => boolean; step: (direction: number) => boolean;
  pause: () => void; play: () => void; restart: () => void; snapshot: () => PosterSnapshot;
  diagnostics: () => { activeTransitions: number; ambientActive: boolean; manualDuration: number; manualProgress: number };
};
declare global { interface Window { __poster?: PosterAPI } }

export function usePoster(renderOnly: boolean, format: PosterFormat) {
  const root = useRef<HTMLDivElement>(null);
  const master = useRef<gsap.core.Timeline | null>(null);
  const transition = useRef<gsap.core.Timeline | null>(null);
  const clock = useRef<gsap.core.Timeline | null>(null);
  const film = useRef<ReturnType<typeof createFilmRenderer> | null>(null);
  const atmosphere = useRef<ReturnType<typeof createAtmosphere> | null>(null);
  const signatureReveal = useRef<gsap.core.Timeline | null>(null);
  const signaturePlaying = useRef(false);
  const stateRef = useRef<PosterSnapshot>({ time: renderOnly ? 0 : 2, index: 0, playing: false, transitioning: false, mode: renderOnly ? 'export' : 'interactive', effect: null });
  const [state, setState] = useState(stateRef.current);
  const [ready, setReady] = useState(false);
  const readyRef = useRef(false), reduced = useRef(false), inView = useRef(true), ambientActive = useRef(false);
  const warming = useRef(false);
  const publish = useCallback((patch: Partial<PosterSnapshot>) => {
    stateRef.current = { ...stateRef.current, ...patch }; setState({ ...stateRef.current });
  }, []);
  const updateAmbient = useCallback(() => {
    root.current?.classList.toggle('hero-shot-ready', !renderOnly && (readyRef.current || warming.current) && !reduced.current && inView.current && !document.hidden && stateRef.current.index < 2);
    const enabled = !renderOnly && readyRef.current && !reduced.current && inView.current && !document.hidden && stateRef.current.mode === 'interactive' && stateRef.current.index === 0 && !stateRef.current.transitioning;
    ambientActive.current = enabled; atmosphere.current?.active(enabled);
  }, [renderOnly]);
  const stopFilm = useCallback(() => {
    clock.current?.kill(); clock.current = null; film.current?.destroy(); film.current = null;
    signatureReveal.current?.kill(); signatureReveal.current = null; signaturePlaying.current = false;
  }, []);
  const go = useCallback((index: number) => {
    if (renderOnly || !readyRef.current || !root.current || stateRef.current.transitioning || index === stateRef.current.index || index < 0 || index >= scenes.length) return false;
    const from = stateRef.current.index;
    stopFilm(); publish({ mode: 'interactive', transitioning: true, playing: true }); updateAmbient();
    if (reduced.current) {
      readingState(root.current, index); publish({ index, time: scenes[index].stable, transitioning: false, playing: false, effect: null }); updateAmbient(); return true;
    }
    const animation = createInteractiveTransition(root.current, from, index, () => {
      if (!root.current) return;
      readingState(root.current, index); transition.current = null;
      publish({ index, time: scenes[index].stable, transitioning: false, playing: false }); updateAmbient();
    });
    transition.current = animation.timeline; publish({ effect: animation.name }); animation.timeline.play(0); return true;
  }, [publish, renderOnly, stopFilm, updateAmbient]);
  const step = useCallback((direction: number) => go((stateRef.current.index + Math.sign(direction) + scenes.length) % scenes.length), [go]);
  const pointer = useCallback((x: number, y: number) => { if (ambientActive.current) atmosphere.current?.pointer(x, y); }, []);

  const seek = useCallback((seconds: number) => {
    if (!renderOnly && stateRef.current.mode !== 'autoplay') return;
    const time = Math.min(DURATION - .000001, Math.max(0, seconds));
    if (format === 'portrait') { master.current?.pause().time(time, true); publish({ time, index: sceneAt(time), playing: false, transitioning: false }); }
    else if (root.current) {
      film.current ??= createFilmRenderer(root.current, () => reduced.current);
      clock.current?.pause().time(time, true);
      publish({ ...film.current.seek(time), playing: false }); updateAmbient();
    }
  }, [format, publish, renderOnly, updateAmbient]);
  const pause = useCallback(() => {
    signatureReveal.current?.pause(); signaturePlaying.current = false;
    master.current?.pause(); transition.current?.pause(); clock.current?.pause(); publish({ playing: false }); updateAmbient();
  }, [publish, updateAmbient]);
  const play = useCallback(() => {
    if (!readyRef.current || !root.current) return;
    if (renderOnly) { master.current?.play(); return; }
    signatureReveal.current?.kill(); signatureReveal.current = null; signaturePlaying.current = false;
    if (transition.current) { transition.current.play(); publish({ playing: true }); return; }
    if (clock.current) { clock.current.play(); publish({ playing: true }); return; }
    film.current ??= createFilmRenderer(root.current, () => reduced.current);
    const cursor = { time: 0 };
    const start = stateRef.current.index === 0 ? 0 : scenes[stateRef.current.index].stable;
    publish({ mode: 'autoplay', playing: true }); updateAmbient();
    const presentation = gsap.timeline({ paused: true, onUpdate: () => {
      if (!film.current) return;
      const pose = film.current.seek(cursor.time);
      if (Math.floor(pose.time * 10) !== Math.floor(stateRef.current.time * 10) || pose.index !== stateRef.current.index || pose.transitioning !== stateRef.current.transitioning) publish(pose);
    }, onComplete: () => {
      clock.current = null; film.current?.destroy(); film.current = null;
      if (root.current) readingState(root.current, 0);
      publish({ index: 0, time: 2, mode: 'interactive', playing: false, transitioning: false, effect: null }); updateAmbient();
    } });
    clock.current = presentation;
    presentation.fromTo(cursor, { time: 0 }, { time: DURATION, duration: DURATION, ease: 'none' });
    publish(film.current.seek(start)); presentation.play(start);
  }, [publish, renderOnly, updateAmbient]);
  const toggle = useCallback(() => { if (stateRef.current.playing) pause(); else play(); }, [pause, play]);
  const restart = useCallback(() => {
    if (renderOnly || !readyRef.current || !root.current) return;
    const auto = stateRef.current.mode === 'autoplay' && stateRef.current.playing;
    transition.current?.kill(); transition.current = null; stopFilm();
    readingState(root.current, 0); publish({ index: 0, time: 2, mode: 'interactive', playing: false, transitioning: false, effect: null }); updateAmbient();
    if (auto) { play(); return; }
    if (reduced.current) return;
    publish({ transitioning: true, playing: true }); updateAmbient();
    transition.current = createIntro(root.current, () => {
      if (root.current) readingState(root.current, 0); transition.current = null;
      publish({ transitioning: false, playing: false }); updateAmbient();
    });
    transition.current.play(0);
  }, [play, publish, renderOnly, stopFilm, updateAmbient]);

  useLayoutEffect(() => {
    if (!root.current) return;
    let disposed = false;
    let warmFrame = 0;
    const preference = matchMedia('(prefers-reduced-motion: reduce)'); reduced.current = preference.matches && !renderOnly;
    const context = gsap.context(() => {
      if (renderOnly && format === 'portrait') master.current = createPosterTimeline(root.current!, () => {});
      else {
        readingState(root.current!, 0);
        if (renderOnly) film.current = createFilmRenderer(root.current!, () => false);
        else {
          atmosphere.current = createAtmosphere(root.current!);
          if(!reduced.current)gsap.set(root.current!.querySelector('[data-signature]'),{autoAlpha:0,y:12});
        }
      }
    }, root);
    const api: PosterAPI = { ready: false, duration: DURATION, seek, go, step, pause, play, restart, snapshot: () => ({ ...stateRef.current }), diagnostics: () => ({ activeTransitions: stateRef.current.transitioning ? 1 : 0, ambientActive: ambientActive.current, manualDuration: transition.current?.duration() ?? 0, manualProgress: transition.current?.progress() ?? 0 }) };
    window.__poster = api;
    void document.fonts.ready.then(async () => {
      if (disposed) return;
      if (renderOnly) seek(0);
      else if (!reduced.current) {
        // Promote the visible hero layers before enabling input. The initial
        // frame stays unchanged while the compositor prepares their textures.
        warming.current = true; root.current?.classList.add('hero-shot-ready');
        await new Promise<void>(resolve => { warmFrame = requestAnimationFrame(() => { warmFrame = requestAnimationFrame(() => resolve()); }); });
      }
      if (disposed) return;
      warming.current = false;
      api.ready = readyRef.current = true; setReady(true); updateAmbient();
      if(!renderOnly&&!reduced.current&&root.current) {
        signatureReveal.current = createSignatureReveal(root.current);
        signatureReveal.current.eventCallback('onComplete',()=>{signatureReveal.current=null;signaturePlaying.current=false;});
        signaturePlaying.current = true; signatureReveal.current.play(0);
      }
    });
    const visibility = () => {
      if (document.hidden) { transition.current?.pause(); clock.current?.pause(); signatureReveal.current?.pause(); }
      else if (stateRef.current.playing) { transition.current?.play(); clock.current?.play(); }
      if(!document.hidden&&signaturePlaying.current)signatureReveal.current?.resume();
      updateAmbient();
    };
    const preferenceChanged = () => {
      reduced.current = preference.matches && !renderOnly;
      if (reduced.current) transition.current?.progress(1);
      if (reduced.current) signatureReveal.current?.progress(1);
      if (stateRef.current.mode === 'autoplay' && film.current) publish(film.current.seek(stateRef.current.time));
      updateAmbient();
    };
    const observer = new IntersectionObserver(entries => { inView.current = entries[0].isIntersecting; updateAmbient(); });
    if (!renderOnly) observer.observe(root.current);
    document.addEventListener('visibilitychange', visibility); preference.addEventListener('change', preferenceChanged);
    return () => {
      disposed = true; readyRef.current = false; observer.disconnect(); transition.current?.kill(); transition.current = null;
      cancelAnimationFrame(warmFrame); warming.current = false; root.current?.classList.remove('hero-shot-ready');
      stopFilm(); atmosphere.current?.destroy(); atmosphere.current = null; ambientActive.current = false; context.revert(); master.current = null;
      document.removeEventListener('visibilitychange', visibility); preference.removeEventListener('change', preferenceChanged);
      if (window.__poster === api) delete window.__poster;
    };
  }, [format, go, pause, play, publish, renderOnly, restart, seek, step, stopFilm, updateAmbient]);
  return { root, state, ready, go, step, pointer, toggle, restart };
}
