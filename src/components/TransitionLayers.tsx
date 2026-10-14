export function TransitionLayers({ width = 1920, height = 1080 }: { width?: number; height?: number }) {
  return <>
    <svg className="interactive-portal" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <defs><mask id="type-portal" x="0" y="0" width={width} height={height} maskUnits="userSpaceOnUse" style={{ maskType: 'luminance' }}>
        <rect width={width} height={height} fill="white" />
        <g data-portal-letters fill="black"><text /><text /><text /></g>
      </mask></defs>
      <rect data-portal-surface width={width} height={height} fill="#101010" mask="url(#type-portal)" />
    </svg>
    <svg className="interactive-morph" viewBox={`0 0 ${width} ${height}`} fill="none" aria-hidden="true">
      <g data-morph-center stroke="currentColor" strokeWidth="1.3"><path /><path /><path /></g>
    </svg>
    <div className="interactive-wipe" aria-hidden="true" />
  </>;
}
