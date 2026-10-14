import { useEffect, type RefObject } from 'react';

export function isEditing(target: EventTarget | null) {
  return target instanceof Element && !!target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]');
}
type InputOptions = {
  enabled: boolean; blocked: boolean;
  step: (direction: number) => boolean;
  pointer: (x: number, y: number) => void;
  fullscreen: () => void;
  toggle: () => void;
  restart: () => void;
};
export function useSceneInput(surface: RefObject<HTMLElement | null>, stage: RefObject<HTMLElement | null>, { enabled, blocked, step, pointer, fullscreen, toggle, restart }: InputOptions) {
  useEffect(() => {
    const element = surface.current, canvas = stage.current;
    if (!element || !canvas || !enabled || blocked) return;
    let wheelAmount = 0, latched = false, wheelTimer = 0;
    let touch: { id: number; x: number; y: number } | null = null;
    const nativeScroll = (target: EventTarget | null) => target instanceof Element && !!target.closest('[data-native-scroll]');
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey || isEditing(event.target) || nativeScroll(event.target) || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      event.preventDefault();
      clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(() => { latched = false; wheelAmount = 0; }, 220);
      if (latched) return;
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
      if (Math.sign(delta) !== Math.sign(wheelAmount)) wheelAmount = 0;
      wheelAmount += delta;
      if (Math.abs(wheelAmount) >= 38) {
        latched = true;
        // A rejected request stays latched until this gesture ends. Momentum
        // arriving during a transition cannot advance another act afterwards.
        step(Math.sign(wheelAmount));
      }
    };
    const key = (event: KeyboardEvent) => {
      if (isEditing(event.target) || event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); step(event.key === 'ArrowRight' ? 1 : -1); }
      if (event.key.toLowerCase() === 'f') { event.preventDefault(); fullscreen(); }
      if (event.code === 'Space') { event.preventDefault(); toggle(); }
      if (event.key.toLowerCase() === 'r') { event.preventDefault(); restart(); }
      if (event.key === 'Escape' && document.fullscreenElement) void document.exitFullscreen();
    };
    const down = (event: PointerEvent) => {
      if (event.pointerType !== 'touch' || !event.isPrimary || isEditing(event.target) || !(event.target instanceof Element) || event.target.closest('button, a, [data-native-scroll]') || !canvas.contains(event.target)) return;
      touch = { id: event.pointerId, x: event.clientX, y: event.clientY };
    };
    const up = (event: PointerEvent) => {
      if (!touch || touch.id !== event.pointerId) return;
      const dx = event.clientX - touch.x, dy = event.clientY - touch.y; touch = null;
      if (Math.abs(dy) >= 45 && Math.abs(dy) > Math.abs(dx) * 1.2) step(dy < 0 ? 1 : -1);
    };
    const cancel = () => { touch = null; };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      const bounds = canvas.getBoundingClientRect();
      pointer(Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1)), Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1)));
    };
    const leave = () => pointer(0, 0);
    element.addEventListener('wheel', wheel, { passive: false });
    window.addEventListener('keydown', key);
    canvas.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up); window.addEventListener('pointercancel', cancel);
    canvas.addEventListener('pointermove', move); canvas.addEventListener('pointerleave', leave);
    return () => {
      clearTimeout(wheelTimer);
      element.removeEventListener('wheel', wheel); window.removeEventListener('keydown', key);
      canvas.removeEventListener('pointerdown', down); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', cancel);
      canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerleave', leave);
    };
  }, [surface, stage, enabled, blocked, step, pointer, fullscreen, toggle, restart]);
}
