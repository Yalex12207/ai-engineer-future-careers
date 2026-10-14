import gsap from 'gsap';
import { DURATION, scenes } from '../content';

// All five scenes stay mounted. One deterministic timeline owns every poster
// property, including transitions; export renders the exact same timeline.
export function createPosterTimeline(root: HTMLElement, onUpdate: () => void) {
  const panels = Array.from(root.querySelectorAll<HTMLElement>('[data-scene]'));
  const q = (index: number, selector: string) => panels[index].querySelectorAll(selector);
  const timeline = gsap.timeline({ paused: true, repeat: -1, onUpdate });
  timeline.set(panels, { autoAlpha: 0, xPercent: 0, yPercent: 0, scale: 1, clipPath: 'inset(0% 0% 0% 0%)' }, 0);
  // Explicit starting states prevent incoming text from appearing briefly
  // before its reveal, and make rewinding independent of tween initialization.
  timeline.set(root.querySelectorAll('[data-line]'), { yPercent: 110 }, 0);
  timeline.set(root.querySelectorAll('[data-enter]'), { autoAlpha: 0, y: 18 }, 0);
  timeline.set(root.querySelectorAll('[data-grid], [data-card], [data-word]'), { autoAlpha: 0 }, 0);
  timeline.set('.match-cut', { autoAlpha: 0 }, 0);
  timeline.set('.match-shape', { width: 28, height: 210, borderRadius: 0, borderWidth: 14, opacity: 0, color: '#F5F5F2', rotation: 0, scale: 1, x: 0, y: 0, xPercent: -50, yPercent: -50 }, 0);
  timeline.set('.cinema-wipe', { y: 0, yPercent: 100 }, 0);

  function reveal(index: number, at: number) {
    timeline.fromTo(q(index, '[data-line]'), { yPercent: 110 }, { yPercent: 0, duration: .85, stagger: .12, ease: 'power3.out', immediateRender: false }, at);
    timeline.fromTo(q(index, '[data-enter]'), { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: .65, stagger: { amount: .4 }, ease: 'power2.out', immediateRender: false }, at + .25);
  }
  timeline.set(panels[0], { autoAlpha: 1 }, 0);
  timeline.fromTo(panels[0], { scale: 1.08 }, { scale: 1, duration: 1.65, ease: 'power3.out', immediateRender: false }, 0);
  reveal(0, .12);
  timeline.fromTo(q(0, '[data-mark]'), { rotation: -30, scale: .85, transformOrigin: '50% 50%' }, { rotation: 0, scale: 1, duration: 1.4, ease: 'power3.out', immediateRender: false }, .25);

  // A typographic I retains its silhouette as it becomes a rectangular stroke,
  // then opens into the circular model geometry in the following scene.
  timeline.set('.match-cut', { autoAlpha: 1 }, 9.25);
  timeline.fromTo('.match-glyph', { autoAlpha: 0, scaleY: .7 }, { autoAlpha: 1, scaleY: 1, duration: .25, immediateRender: false }, 9.25);
  timeline.to(panels[0], { opacity: .15, scale: 1.035, duration: .5 }, 9.3);
  timeline.set('.match-shape', { width: 28, height: 210, borderRadius: 0, borderWidth: 14, opacity: 0, color: '#F5F5F2', rotation: 0, scale: 1 }, 9.25);
  timeline.to('.match-glyph', { autoAlpha: 0, duration: .18 }, 9.65);
  timeline.to('.match-shape', { opacity: 1, width: 210, height: 210, borderRadius: '50%', borderWidth: 2, duration: .65, ease: 'power2.inOut' }, 9.65);
  timeline.fromTo(panels[1], { autoAlpha: 1, clipPath: 'circle(0% at 50% 41%)' }, { autoAlpha: 1, clipPath: 'circle(140% at 50% 41%)', duration: .9, ease: 'power3.inOut', immediateRender: false }, 10);
  timeline.to('.match-shape', { color: '#101010', scale: .45, duration: .55 }, 10);
  timeline.to('.match-cut', { autoAlpha: 0, duration: .2 }, 10.55);
  timeline.set(panels[0], { autoAlpha: 0 }, 10.9);
  reveal(1, 10.55);

  // Editorial push and circular-to-square morph lead into the split grid.
  timeline.fromTo(panels[2], { autoAlpha: 1, xPercent: 100 }, { autoAlpha: 1, xPercent: 0, duration: 1, ease: 'power3.inOut', immediateRender: false }, 21);
  timeline.to(panels[1], { xPercent: -100, duration: 1, ease: 'power3.inOut' }, 21);
  timeline.set(panels[1], { autoAlpha: 0 }, 22);
  timeline.set('.match-cut', { autoAlpha: 1 }, 21.15);
  timeline.fromTo('.match-shape', { color: '#F5F5F2', width: 210, height: 210, scale: .7, borderRadius: '50%', opacity: 1 }, { color: '#F5F5F2', width: 210, height: 210, opacity: 1, borderRadius: 0, scale: .5, rotation: 90, duration: .65, immediateRender: false }, 21.15);
  timeline.to('.match-cut', { autoAlpha: 0, duration: .2 }, 21.8);
  timeline.fromTo(q(2, '[data-grid]'), { x: (i: number) => i ? 70 : -70, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: .7, ease: 'power3.out', immediateRender: false }, 21.7);
  reveal(2, 21.7);

  timeline.fromTo(panels[3], { autoAlpha: 1, yPercent: 100 }, { autoAlpha: 1, yPercent: 0, duration: 1, ease: 'power3.inOut', immediateRender: false }, 33);
  timeline.to(panels[2], { yPercent: -100, duration: 1, ease: 'power3.inOut' }, 33);
  timeline.set(panels[2], { autoAlpha: 0 }, 34);
  timeline.fromTo(q(3, '[data-card]'), { x: (i: number) => i % 2 ? 100 : -100, y: 35, autoAlpha: 0 }, { x: 0, y: 0, autoAlpha: 1, duration: .75, stagger: .1, ease: 'power3.out', immediateRender: false }, 33.65);
  reveal(3, 33.65);

  timeline.set('.cinema-wipe', { backgroundColor: '#101010', y: 0, yPercent: 100 }, 44);
  timeline.to('.cinema-wipe', { yPercent: 0, duration: .55, ease: 'power3.inOut' }, 44);
  timeline.set(panels[3], { autoAlpha: 0 }, 44.55);
  timeline.set(panels[4], { autoAlpha: 1 }, 44.55);
  timeline.to('.cinema-wipe', { yPercent: -100, duration: .65, ease: 'power3.inOut' }, 44.55);
  timeline.fromTo(panels[4], { scale: 1.06 }, { scale: 1, duration: 1.4, ease: 'power3.out', immediateRender: false }, 44.6);
  timeline.fromTo(q(4, '[data-word]'), { x: (i: number) => (i % 2 ? 1 : -1) * 90, y: 20, letterSpacing: '.12em', autoAlpha: 0 }, { x: 0, y: 0, letterSpacing: '-.04em', autoAlpha: 1, duration: .9, stagger: .12, ease: 'power3.out', immediateRender: false }, 44.9);
  reveal(4, 44.9);
  // Black closing wipe gives the loop a continuous black cut into act one.
  timeline.set('.cinema-wipe', { y: 0, yPercent: 100, backgroundColor: '#101010' }, 54.25);
  timeline.to('.cinema-wipe', { yPercent: 0, duration: .75, ease: 'power3.inOut' }, 54.25);
  timeline.to({}, { duration: .001 }, DURATION - .001);
  scenes.forEach((scene, i) => timeline.addLabel(`scene-${i}`, scene.stable));
  return timeline;
}
