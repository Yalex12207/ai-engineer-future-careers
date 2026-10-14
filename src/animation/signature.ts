import gsap from 'gsap';

export const SIGNATURE_REVEAL_SECONDS = .6;
export function addSignatureReveal(root: HTMLElement, timeline: gsap.core.Timeline, at: number) {
  const signature=root.querySelector<HTMLElement>('[data-signature]');
  if(!signature)return;
  gsap.set(signature,{autoAlpha:0,y:12});
  timeline.fromTo(signature,{autoAlpha:0,y:12},{autoAlpha:1,y:0,duration:SIGNATURE_REVEAL_SECONDS,ease:'power2.out',immediateRender:false},at);
}
export function createSignatureReveal(root: HTMLElement) {
  const timeline=gsap.timeline({paused:true});
  addSignatureReveal(root,timeline,0);
  return timeline;
}
