export type PosterFormat = 'landscape' | 'portrait';
export const layouts = {
  landscape: { width: 1920, height: 1080, exportWidth: 1920, exportHeight: 1080 },
  portrait: { width: 540, height: 960, exportWidth: 1080, exportHeight: 1920 },
} as const;
export function nativeSize(root: HTMLElement) { return layouts[root.dataset.format === 'portrait' ? 'portrait' : 'landscape']; }
export function exportName(format: PosterFormat, fps: number) { return `ai-engineer-${format}-${fps}.mp4`; }
