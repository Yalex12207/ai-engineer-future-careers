import gsap from 'gsap';
import { nativeSize } from '../layout';
import { addHeroTransition, HERO_TRANSITION_SECONDS } from './hero-transition';
import { addSignatureReveal, SIGNATURE_REVEAL_SECONDS } from './signature';

export const TRANSITION_SECONDS = 1.35;
export const transitionNames = ['Typography Zoom', 'Geometric Morph', 'Editorial Push', 'Mask Wipe', 'Match Cut'] as const;
export type TransitionName = typeof transitionNames[number];
export function transitionDuration(from: number, to: number) {
  return Math.min(from, to) === 0 && Math.max(from, to) === 1 ? HERO_TRANSITION_SECONDS : TRANSITION_SECONDS;
}

function panels(root: HTMLElement) { return [...root.querySelectorAll<HTMLElement>('[data-scene]')]; }
// Only panels touched by the preceding phase need their child styles reset.
// Resetting every glyph in all five mounted chapters creates an avoidable
// burst of style work at the start of an otherwise compositor-driven cut.
const dirtyPanels = new WeakMap<HTMLElement, number[]>();
export function readingState(root: HTMLElement, index: number) {
  const frames = panels(root);
  const dirty = new Set([...(dirtyPanels.get(root) ?? frames.map((_, i) => i)), index]);
  const children = (selector: string) => [...dirty].flatMap(i => [...frames[i].querySelectorAll(selector)]);
  gsap.set(frames, { autoAlpha: 0, x: 0, y: 0, xPercent: 0, yPercent: 0, scale: 1, zIndex: 0, clipPath: 'inset(0%)', force3D: 'auto' });
  gsap.set(children('[data-line]'), { x: 0, y: 0, xPercent: 0, yPercent: 0, autoAlpha: 1, force3D: 'auto' });
  gsap.set(children('[data-char]'), { x: 0, y: 0, yPercent: 0, autoAlpha: 1 });
  gsap.set(children('[data-enter], [data-grid], [data-card], [data-word], [data-signature]'), { x: 0, y: 0, autoAlpha: 1, force3D: 'auto' });
  gsap.set(children('[data-word]'), { letterSpacing: '-.04em' });
  gsap.set(children('.intro-title'), { scale: 1, x: 0, y: 0 });
  gsap.set(children('.intro-title h1, h2.scene-title, .intro-geometry'), { scale: 1, x: 0, y: 0, autoAlpha: 1, force3D: 'auto' });
  gsap.set(children('.poster-top, .poster-bottom, .intro-label, .intro-tagline, .intro-discipline'), { x: 0, y: 0, autoAlpha: 1, force3D: 'auto' });
  gsap.set(root.querySelectorAll('[data-hero-light]'), { autoAlpha: 0, scale: 0 });
  gsap.set(root.querySelectorAll('[data-work-surface]'), { opacity: 1 });
  gsap.set(root.querySelector('[data-scene="1"]'), { clearProps: 'backgroundImage,backgroundColor' });
  root.classList.remove('hero-shot-active');
  gsap.set(children('.intelligence-mark, .model-symbol, .place-symbol, .place-symbol i'), { visibility: 'visible' });
  gsap.set(root.querySelectorAll('.interactive-portal, .interactive-morph, .interactive-wipe'), { autoAlpha: 0 });
  gsap.set(frames[index], { autoAlpha: 1, zIndex: 2 });
  dirtyPanels.set(root, [index]);
}

function nativeRect(root: HTMLElement, element: Element) {
  const stage = root.getBoundingClientRect(), bounds = element.getBoundingClientRect();
  const scale = stage.width / nativeSize(root).width;
  return { x: (bounds.left - stage.left) / scale, y: (bounds.top - stage.top) / scale, width: bounds.width / scale, height: bounds.height / scale };
}
function center(root: HTMLElement, element: Element) {
  const rect = nativeRect(root, element);
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}
// Identical cubic segments let GSAP interpolate every coordinate continuously.
export function ellipsePath(rx: number, ry: number) {
  const k = .55228475;
  return `M ${-rx} 0 C ${-rx} ${-ry*k} ${-rx*k} ${-ry} 0 ${-ry} C ${rx*k} ${-ry} ${rx} ${-ry*k} ${rx} 0 C ${rx} ${ry*k} ${rx*k} ${ry} 0 ${ry} C ${-rx*k} ${ry} ${-rx} ${ry*k} ${-rx} 0 Z`;
}
function enterText(tl: gsap.core.Timeline, frame: HTMLElement, at = .55) {
  const chars = frame.querySelectorAll('[data-char]');
  gsap.set(frame.querySelectorAll('[data-line]'), { yPercent: chars.length ? 0 : 110 });
  if (chars.length) {
    gsap.set(chars, { yPercent: 110, autoAlpha: 0 });
    tl.to(chars, { yPercent: 0, autoAlpha: 1, duration: .42, stagger: { amount: .24 }, ease: 'power3.out' }, at);
  }
  gsap.set(frame.querySelectorAll('[data-enter], [data-word]'), { y: 14, autoAlpha: 0 });
  if (!chars.length) tl.fromTo(frame.querySelectorAll('[data-line]'), { yPercent: 110 }, { yPercent: 0, duration: .5, stagger: .05, ease: 'power3.out', immediateRender: false }, at);
  tl.fromTo(frame.querySelectorAll('[data-enter]'), { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .4, stagger: { amount: .2 }, ease: 'power2.out', immediateRender: false }, at + .1);
  if (frame.querySelector('[data-word]')) tl.to(frame.querySelectorAll('[data-word]'), { y: 0, autoAlpha: 1, duration: .38, stagger: .045, ease: 'power3.out' }, at + .1);
  if(frame.querySelector('[data-signature]'))addSignatureReveal(frame,tl,Math.min(at+.15,TRANSITION_SECONDS-SIGNATURE_REVEAL_SECONDS));
}

function typographyZoom(root: HTMLElement, tl: gsap.core.Timeline, outgoing: HTMLElement, incoming: HTMLElement) {
  const svg = root.querySelector<SVGSVGElement>('.interactive-portal')!;
  const letters = svg.querySelector<SVGGElement>('[data-portal-letters]')!;
  const textNodes = [...letters.querySelectorAll('text')];
  const lines = [...outgoing.querySelectorAll<HTMLElement>('h1 [data-line], h2 [data-line]')];
  const canvas = document.createElement('canvas').getContext('2d')!;
  textNodes.forEach((text, i) => {
    const line = lines[i];
    if (!line) { text.textContent = ''; return; }
    const rect = nativeRect(root, line), style = getComputedStyle(line);
    canvas.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const metrics = canvas.measureText(line.textContent ?? '');
    const ascent = metrics.fontBoundingBoxAscent || parseFloat(style.fontSize) * .8;
    const descent = metrics.fontBoundingBoxDescent || parseFloat(style.fontSize) * .2;
    text.textContent = line.textContent;
    text.setAttribute('x', String(rect.x));
    text.setAttribute('y', String(rect.y + (rect.height - ascent - descent) / 2 + ascent));
    Object.assign(text.style, { fontFamily: style.fontFamily, fontWeight: style.fontWeight, fontSize: style.fontSize, letterSpacing: style.letterSpacing });
  });
  const introStem = outgoing.querySelector('.intro-i');
  const firstLine = nativeRect(root, lines[0]);
  const firstFont = parseFloat(getComputedStyle(lines[0]).fontSize);
  // AI uses the I stem. On the way back, the M in “Making” has a solid left
  // stem; zoom around that stroke, rather than the empty line-box center.
  const focus = introStem ? center(root, introStem) : { x: firstLine.x + firstFont * .12, y: firstLine.y + firstLine.height * .5 };
  gsap.set(svg.querySelector('[data-portal-surface]'), { fill: outgoing.classList.contains('dark') ? '#101010' : '#F5F5F2' });
  // A <g> inside a mask has no CSS layout box. Animate its native SVG matrix
  // explicitly so a previous chapter's cached SVG origin cannot leak back.
  gsap.set(letters, { clearProps: 'transform' });
  letters.removeAttribute('data-svg-origin');
  const matrix = (scale: number) => `translate(${focus.x} ${focus.y}) scale(${scale}) translate(${-focus.x} ${-focus.y})`;
  letters.setAttribute('transform', matrix(1));
  tl.set(svg, { autoAlpha: 1 }, .08);
  tl.set(outgoing, { autoAlpha: 0 }, .08);
  const zoom = Math.max(introStem ? 38 : 160, nativeSize(root).width / (firstFont * .035));
  tl.fromTo(letters, { attr: { transform: matrix(1) } }, { attr: { transform: matrix(zoom) }, duration: 1.12, ease: 'power3.in', immediateRender: false }, .08);
  enterText(tl, incoming, .63);
  tl.set(svg, { autoAlpha: 0 }, 1.2);
}

function geometricMorph(root: HTMLElement, tl: gsap.core.Timeline, outgoing: HTMLElement, incoming: HTMLElement, direction: number) {
  const source = outgoing.querySelector(direction > 0 ? '.model-symbol' : '.place-symbol i')!;
  const target = incoming.querySelector(direction > 0 ? '.place-symbol i' : '.model-symbol')!;
  const start = center(root, source), end = center(root, target);
  const overlay = root.querySelector('.interactive-morph')!, group = overlay.querySelector('[data-morph-center]')!;
  const paths = [...group.querySelectorAll('path')];
  const size = nativeSize(root);
  const sphereRadius = parseFloat(getComputedStyle(direction > 0 ? source : target).width) / 2;
  const ringRadius = parseFloat(getComputedStyle(direction > 0 ? target : source).width) / 2;
  const sphere: [number,number][] = [[sphereRadius,sphereRadius],[sphereRadius*.45,sphereRadius],[sphereRadius,sphereRadius*.45]];
  const ring: [number,number][] = [[ringRadius,ringRadius],[ringRadius,ringRadius],[ringRadius,ringRadius]];
  const startShapes = direction > 0 ? sphere : ring, endShapes = direction > 0 ? ring : sphere;
  gsap.set(group, { x: start.x, y: start.y });
  paths.forEach((path, i) => gsap.set(path, { attr: { d: ellipsePath(...startShapes[i]) }, opacity: 1 }));
  gsap.set(overlay, { autoAlpha: 1, color: direction > 0 ? '#101010' : '#8A8A8A' });
  gsap.set(source, { visibility: 'hidden' }); gsap.set(target, { visibility: 'hidden' });
  tl.fromTo(incoming, { clipPath: `circle(0% at ${start.x/size.width*100}% ${start.y/size.height*100}%)` }, { clipPath: `circle(160% at ${start.x/size.width*100}% ${start.y/size.height*100}%)`, duration: 1.05, ease: 'power3.inOut', immediateRender: false }, .02);
  paths.forEach((path, i) => {
    tl.to(path, { attr: { d: ellipsePath(sphereRadius*1.2,sphereRadius*1.2) }, duration: .6, ease: 'power2.inOut' }, 0);
    tl.to(path, { attr: { d: ellipsePath(...endShapes[i]) }, duration: .5, ease: 'power2.inOut' }, .7);
  });
  tl.to(overlay, { color: direction > 0 ? '#F5F5F2' : '#101010', duration: .4 }, .17);
  tl.to(group, { x: end.x, y: end.y, duration: 1.2, ease: 'power2.inOut' }, 0);
  enterText(tl, incoming, .58);
  if (direction > 0) tl.to(overlay, { color: '#8A8A8A', duration: .12 }, 1.08);
  tl.set(target, { visibility: 'visible' }, 1.2); tl.set(overlay, { autoAlpha: 0 }, 1.2);
}

function editorialPush(tl: gsap.core.Timeline, outgoing: HTMLElement, incoming: HTMLElement, direction: number) {
  gsap.set(incoming.querySelectorAll('[data-card], [data-grid]'), { x: (i: number) => direction * (i % 2 ? 36 : 20) });
  tl.fromTo(incoming, { xPercent: direction * 100 }, { xPercent: 0, duration: 1.15, ease: 'power3.inOut', immediateRender: false }, 0);
  tl.to(outgoing, { xPercent: direction * -100, duration: 1.15, ease: 'power3.inOut' }, 0);
  tl.fromTo(incoming.querySelectorAll('[data-card], [data-grid]'), { x: (i: number) => direction * (i % 2 ? 36 : 20) }, { x: 0, duration: .55, stagger: .05, ease: 'power3.out', immediateRender: false }, .65);
  if (incoming.querySelector('[data-char]')) enterText(tl, incoming, .57);
}

function maskWipe(root: HTMLElement, tl: gsap.core.Timeline, outgoing: HTMLElement, incoming: HTMLElement, direction: number) {
  const wipe = root.querySelector('.interactive-wipe');
  const below = 'polygon(0 100%, 100% 125%, 100% 125%, 0 100%)';
  const above = 'polygon(0 -125%, 100% -100%, 100% -100%, 0 -125%)';
  gsap.set(wipe, { autoAlpha: 1, backgroundColor: incoming.classList.contains('dark') ? '#101010' : '#F5F5F2', clipPath: direction > 0 ? below : above });
  tl.to(wipe, { clipPath: 'polygon(0 0%, 100% 0%, 100% 100%, 0 100%)', duration: .55, ease: 'power3.inOut' }, 0);
  tl.set(outgoing, { autoAlpha: 0 }, .55);
  tl.to(wipe, { clipPath: direction > 0 ? above : below, duration: .65, ease: 'power3.inOut' }, .55);
  enterText(tl, incoming, .65);
}

function matchCut(root: HTMLElement, tl: gsap.core.Timeline, outgoing: HTMLElement, incoming: HTMLElement, direction: number) {
  const source = outgoing.querySelector(direction > 0 ? '.foundation-grid > div' : '.intelligence-mark')!;
  const target = incoming.querySelector(direction > 0 ? '.intelligence-mark' : '.foundation-grid > div')!;
  const start = center(root, source), end = center(root, target);
  if (direction > 0) start.y = nativeRect(root, source).y; else end.y = nativeRect(root, target).y;
  const overlay = root.querySelector('.interactive-morph')!, group = overlay.querySelector('[data-morph-center]')!;
  const paths = [...group.querySelectorAll('path')];
  const radius = 120 / 300 * parseFloat(getComputedStyle(direction > 0 ? target : source).width);
  const lineRadius = nativeRect(root, direction > 0 ? source : target).width / 2;
  gsap.set(group, { x: start.x, y: start.y }); gsap.set(paths.slice(1), { opacity: 0 });
  gsap.set(paths[0], { opacity: 1, attr: { d: direction > 0 ? ellipsePath(lineRadius,0) : ellipsePath(radius,radius) } });
  gsap.set(overlay, { autoAlpha: 1, color: '#8A8A8A' });
  gsap.set(direction < 0 ? source : target, { visibility: 'hidden' });
  tl.to(outgoing.querySelectorAll('[data-line]'), { yPercent: -110, duration: .45, stagger: .04, ease: 'power3.in' }, 0);
  tl.to(outgoing.querySelectorAll('[data-enter], [data-word], [data-signature]'), { y: -30, autoAlpha: 0, duration: .35, stagger: { amount: .1 } }, 0);
  tl.set(outgoing, { autoAlpha: 0 }, .5);
  tl.to(group, { x: end.x, y: end.y, duration: 1.2, ease: 'power2.inOut' }, 0);
  tl.to(paths[0], { attr: { d: direction > 0 ? ellipsePath(radius,radius) : ellipsePath(lineRadius,0) }, duration: 1.2, ease: 'power2.inOut' }, 0);
  enterText(tl, incoming, .57);
  if (direction > 0) tl.to(overlay, { color: '#F5F5F2', duration: .5 }, .55);
  tl.set(target, { visibility: 'visible' }, 1.2); tl.set(overlay, { autoAlpha: 0 }, 1.2);
}

export function createInteractiveTransition(root: HTMLElement, from: number, to: number, done: () => void) {
  const signature=root.querySelector('[data-signature]');
  // Preserve an in-flight first-load reveal when the user navigates early.
  const signaturePose=from===0&&signature?{opacity:Number(gsap.getProperty(signature,'opacity')),y:Number(gsap.getProperty(signature,'y'))}:null;
  readingState(root, from);
  if(signature&&signaturePose)gsap.set(signature,signaturePose);
  dirtyPanels.set(root, [from, to]);
  const frames = panels(root), outgoing = frames[from], incoming = frames[to];
  const wraps = Math.abs(from - to) === 4;
  const direction = wraps ? (from === 4 ? 1 : -1) : Math.sign(to - from);
  const effect = !wraps && Math.abs(from - to) > 1 ? 3 : wraps ? 4 : Math.min(from, to);
  gsap.set(incoming, { autoAlpha: 1, zIndex: 3 }); gsap.set(outgoing, { zIndex: 2 });
  if (effect === 0 || effect === 3 || effect === 4) gsap.set(incoming, { zIndex: 1 });
  const tl = gsap.timeline({ paused: true, onComplete: done });
  if (effect === 0 && root.dataset.format === 'landscape') addHeroTransition(root, tl, direction);
  else if (effect === 0) typographyZoom(root, tl, outgoing, incoming);
  else if (effect === 1) geometricMorph(root, tl, outgoing, incoming, direction);
  else if (effect === 2) editorialPush(tl, outgoing, incoming, direction);
  else if (effect === 3) maskWipe(root, tl, outgoing, incoming, direction);
  else matchCut(root, tl, outgoing, incoming, direction);
  const duration = transitionDuration(from, to);
  tl.to({}, { duration: .001 }, duration - .001);
  return { timeline: tl, name: transitionNames[effect] };
}
