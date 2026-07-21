/**
 * Global fixed background layers — noise, grid, top glow.
 * Mirrors the body-level overlays from the approved template.
 */
export function BackgroundLayers() {
  return (
    <>
      {/* Noise overlay */}
      <div
        aria-hidden
        className="fixed inset-0 z-noise pointer-events-none opacity-[0.02] mix-blend-screen noise-bg"
      />
      {/* Grid overlay */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-base opacity-30 grid-bg-coarse"
      />
      {/* Top glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-base h-48 opacity-60 top-glow"
      />
    </>
  );
}
