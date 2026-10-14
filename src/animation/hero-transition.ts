import gsap from 'gsap';
import { SIGNATURE_REVEAL_SECONDS } from './signature';

export const HERO_TRANSITION_SECONDS = 1.8;

// One shot, including its exact temporal mirror. Every keyframe uses native
// poster coordinates; ResizeObserver scales the finished composition outside
// this timeline, so resizing never requires measuring or rebuilding the shot.
export function addHeroTransition(root: HTMLElement, timeline: gsap.core.Timeline, direction: number) {
  const hero = root.querySelector<HTMLElement>('[data-scene="0"]')!;
  const work = root.querySelector<HTMLElement>('[data-scene="1"]')!;
  const light = hero.querySelector<HTMLElement>('[data-hero-light]')!;
  const surface = work.querySelector<HTMLElement>('[data-work-surface]')!;
  const title = hero.querySelector<HTMLElement>('h1')!;
  const nextTitle = work.querySelector<HTMLElement>('h2')!;
  const geometry = hero.querySelector<HTMLElement>('.intro-geometry')!;
  const initial = new Map<Element, gsap.TweenVars>();
  const duration = HERO_TRANSITION_SECONDS;

  function shot(target: Element | Element[], from: gsap.TweenVars, to: gsap.TweenVars, start: number, end: number, ease = 'power2.inOut') {
    const elements = Array.isArray(target) ? target : [target];
    for (const element of elements) {
      if (direction < 0) initial.set(element, { ...initial.get(element), ...to });
      else initial.set(element, { ...from, ...initial.get(element) });
    }
    const forwardEase = gsap.parseEase(ease);
    timeline.fromTo(target, direction > 0 ? from : to, {
      ...(direction > 0 ? to : from), duration: (end - start) * duration,
      ease: direction > 0 ? forwardEase : (progress: number) => 1 - forwardEase(1 - progress),
      immediateRender: false, force3D: true,
    }, (direction > 0 ? start : 1 - end) * duration);
  }

  root.classList.add('hero-shot-active');
  gsap.set(hero, { autoAlpha: 1, zIndex: 2, transformOrigin: '550px 430px' });
  gsap.set(work, { autoAlpha: 1, zIndex: 3, backgroundImage: 'none', backgroundColor: 'transparent', transformOrigin: '550px 430px' });
  gsap.set(light, { xPercent: -50, yPercent: -50, autoAlpha: 1 });
  gsap.set(title, { transformOrigin: '18% 32%' });
  gsap.set(nextTitle, { transformOrigin: '0% 50%' });

  // 0–20%: the camera and foreground gently advance at different depths.
  shot(hero, { scale: 1 }, { scale: 1.11 }, 0, .68);
  shot(title, { scale: 1, x: 0, y: 0 }, { scale: 1.055, x: -5, y: -4 }, 0, .2);
  shot(geometry, { x: 0, y: 0, scale: 1 }, { x: 22, y: -8, scale: 1.035 }, 0, .2);

  // 20–48%: the same DOM title leaves the frame; light grows from its edge.
  shot(title, { scale: 1.055, x: -5, y: -4 }, { scale: 2.65, x: -310, y: -215 }, .2, .58);
  shot(title, { opacity: 1 }, { opacity: 0 }, .34, .55);
  shot(geometry, { x: 22, y: -8, scale: 1.035 }, { x: 72, y: -34, scale: 1.14 }, .2, .48);
  shot(geometry, { opacity: 1 }, { opacity: 0 }, .18, .48);
  const heroDetails = [...hero.querySelectorAll('.intro-label, .intro-tagline, .intro-discipline, .poster-top, .poster-bottom')];
  shot(heroDetails, { opacity: 1, y: 0 }, { opacity: 0, y: -15 }, .12, .42);
  const signature=hero.querySelector('[data-signature]');
  if(signature)shot(signature,{opacity:direction>0?Number(gsap.getProperty(signature,'opacity')):1,y:direction>0?Number(gsap.getProperty(signature,'y')):0},{opacity:0,y:-12},.12,.12+SIGNATURE_REVEAL_SECONDS/duration);
  // Transforming a fixed-size plane avoids SVG glyph copies, giant mask
  // rasterization, clip-path animation, and layout properties in this cut.
  shot(light, { scale: 0 }, { scale: 1.9 }, .2, .75);

  // 48–75%: both scenes occupy the same camera space, with no panel swap.
  shot(work, { scale: 1.065, x: 18, y: 12 }, { scale: 1, x: 0, y: 0 }, .48, 1, 'power3.out');
  shot(nextTitle, { x: 30, y: 38, scale: .94, opacity: 0 }, { x: 0, y: 0, scale: 1, opacity: 1 }, .48, .75, 'power3.out');
  for (const [i, line] of [...nextTitle.querySelectorAll('[data-line]')].entries()) {
    shot(line, { yPercent: 14 }, { yPercent: 0 }, .48 + i * .02, .73 + i * .01, 'power3.out');
  }
  // The subtle final gradient arrives only once the expanding plane covers
  // the entire stage, matching the resting page without a white-frame flash.
  shot(surface, { opacity: 0 }, { opacity: 1 }, .66, .86, 'sine.inOut');

  // 75–100%: title locks into place, then copy and diagrams settle in order.
  for (const [i, selector] of ['.scene-kicker', '.work-description', '.work-diagram', '.work-tasks'].entries()) {
    shot(work.querySelector(selector)!, { opacity: 0, y: 18 }, { opacity: 1, y: 0 }, .75 + i * .015, .935 + i * .02, 'power3.out');
  }
  shot([...work.querySelectorAll('.poster-top, .poster-bottom')], { opacity: 0 }, { opacity: 1 }, .77, .98, 'sine.inOut');

  // A fromTo tween is intentionally lazy. Explicit initial poses keep pause,
  // progress=0, backward seeking and the first displayed frame deterministic.
  for (const [element, pose] of initial) gsap.set(element, pose);
}
