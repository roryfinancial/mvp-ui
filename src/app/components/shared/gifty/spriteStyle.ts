// src/app/components/shared/gifty/spriteStyle.ts
// Pure cell→CSS for an atlas-backed sprite div. No React imports needed.

type Place = { x: number; y: number; w: number; h: number };
type Cell = { sx: number; sy: number; sw: number; sh: number };
type Atlas = { w: number; h: number };

export function spriteCss(
  { place, cell, atlas, size }: { place: Place; cell: Cell; atlas: Atlas; size: number },
): React.CSSProperties {
  const divW = place.w * size;
  const divH = place.h * size;
  // scale the whole atlas image so the cell maps 1:1 onto the div
  const scaleX = divW / cell.sw;
  const scaleY = divH / cell.sh;
  const bgW = atlas.w * scaleX;
  const bgH = atlas.h * scaleY;
  return {
    width: divW,
    height: divH,
    backgroundSize: `${bgW}px ${bgH}px`,
    backgroundPosition: `-${cell.sx * scaleX}px -${cell.sy * scaleY}px`,
    backgroundRepeat: "no-repeat",
  };
}
