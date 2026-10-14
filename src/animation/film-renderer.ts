import gsap from 'gsap';
import { DURATION, sceneAt, scenes } from '../content';
import { createInteractiveTransition, readingState, TRANSITION_SECONDS, transitionDuration } from './interactive-transitions';
import { addSignatureReveal, SIGNATURE_REVEAL_SECONDS } from './signature';

const TITLE_REVEAL_END = 1.1;
export const INTRO_SECONDS = TITLE_REVEAL_END + SIGNATURE_REVEAL_SECONDS;

export function createIntro(root: HTMLElement, done?: () => void) {
  readingState(root, 0);
  const frame = root.querySelector<HTMLElement>('[data-scene="0"]')!;
  gsap.set(frame.querySelectorAll('[data-char]'), { yPercent: 110, autoAlpha: 0 });
  gsap.set(frame.querySelectorAll('[data-enter]'), { y: 24, autoAlpha: 0 });
  const tl = gsap.timeline({ paused: true, onComplete: done });
  tl.fromTo(frame, { scale: 1.025 }, { scale: 1, duration: 1.35, ease: 'power2.out', immediateRender: false }, 0);
  tl.fromTo(frame.querySelectorAll('[data-char]'), { yPercent: 110, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: .65, stagger: { amount: .4 }, ease: 'power3.out', immediateRender: false }, .05);
  tl.fromTo(frame.querySelectorAll('[data-enter]'), { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .5, stagger: { amount: .25 }, ease: 'power2.out', immediateRender: false }, .45);
  addSignatureReveal(root,tl,TITLE_REVEAL_END);
  return tl;
}
// A paused renderer owns one phase at a time. The presentation clock and the
// frame exporter both seek this renderer; no video or wall-clock recording.
export function createFilmRenderer(root: HTMLElement, reduced = () => false) {
  let phase = '', animation: gsap.core.Timeline | null = null;
  function seek(seconds: number) {
    const time = Math.max(0, Math.min(DURATION - .000001, seconds));
    let index = sceneAt(time), from = -1, elapsed = 0, key = `hold-${index}`;
    if (time < INTRO_SECONDS) { key = 'intro'; elapsed = time; }
    else if (time >= DURATION - TRANSITION_SECONDS) { key = 'transition-4-0'; from = 4; index = 0; elapsed = time - (DURATION - TRANSITION_SECONDS); }
    else if (index > 0 && time < scenes[index].start + transitionDuration(index - 1, index)) {
      key = `transition-${index-1}-${index}`; from = index - 1; elapsed = time - scenes[index].start;
    }
    const reduce = reduced(), phaseKey = `${key}:${reduce}`;
    if (phaseKey !== phase) {
      animation?.kill(); animation = null; phase = phaseKey;
      // Live atmosphere is separate and paused before the film clock starts.
      gsap.set(root.querySelectorAll('[data-parallax], [data-idle-spin]'), { x: 0, y: 0, rotation: 0 });
      gsap.set(root.querySelectorAll('[data-meridian]'), { attr: { rx: 57 } });
      if (reduce) readingState(root, index);
      else if (key === 'intro') animation = createIntro(root);
      else if (from >= 0) animation = createInteractiveTransition(root, from, index, () => {}).timeline;
      else readingState(root, index);
    }
    animation?.time(elapsed, true);
    return { time, index, transitioning: !reduce && (key === 'intro' || from >= 0), effect: from >= 0 ? createEffect(from) : null };
  }
  function createEffect(from: number) { return ['Typography Zoom','Geometric Morph','Editorial Push','Mask Wipe','Match Cut'][from] as import('./interactive-transitions').TransitionName; }
  return { seek, destroy() { animation?.kill(); animation = null; phase = ''; } };
}
