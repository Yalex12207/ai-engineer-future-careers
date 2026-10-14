import { createRequire } from 'node:module';

// Reuse the PNG decoder exported by the installed Playwright dependency.
// Compare decoded pixels, not compressed PNG bytes: GPU text rasterization
// may vary by one color level even when every scene pose is exactly frozen.
const { PNG } = createRequire(import.meta.url)('playwright-core/lib/utilsBundle') as {
  PNG: { sync: { read: (bytes: Buffer) => { width: number; height: number; data: Buffer } } };
};
export function maximumPixelDifference(before: Buffer, after: Buffer) {
  const a=PNG.sync.read(before),b=PNG.sync.read(after);
  if(a.width!==b.width||a.height!==b.height)return Infinity;
  let max=0;
  for(let i=0;i<a.data.length;i++)max=Math.max(max,Math.abs(a.data[i]-b.data[i]));
  return max;
}
