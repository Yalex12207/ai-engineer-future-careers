import gsap from 'gsap';

export function createAtmosphere(root: HTMLElement) {
  const spin = root.querySelector('[data-idle-spin]');
  const parallax = root.querySelector('[data-parallax]');
  const meridians = root.querySelectorAll('[data-meridian]');
  const orbit = gsap.timeline({ paused: true });
  orbit.to(spin, { rotation: 360, duration: 70, repeat: -1, ease: 'none', transformOrigin: '50% 50%' }, 0);
  orbit.to(meridians, { attr: { rx: 68 }, duration: 8, repeat: -1, yoyo: true, ease: 'sine.inOut', stagger: 2 }, 0);
  const x = gsap.quickTo(parallax, 'x', { duration: .65, ease: 'power2.out' });
  const y = gsap.quickTo(parallax, 'y', { duration: .65, ease: 'power2.out' });
  return {
    active(enabled: boolean) { orbit.paused(!enabled); if (!enabled) { x.tween.pause(); y.tween.pause(); } },
    pointer(px: number, py: number) { x(px * 7); y(py * 6); },
    destroy() { orbit.kill(); x.tween.kill(); y.tween.kill(); },
  };
}
