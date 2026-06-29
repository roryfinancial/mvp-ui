import type { Place, Cell } from "./spritePackTypes";
import type { CSSProperties } from "react";

/** Absolute-position a channel div at place*size and crop `cell` from its sheet.
 *  Same atlas-crop math as spriteCss, plus left/top so channels register on the canvas. */
export function frameCss(
  { place, cell, atlas, size }:
  { place: Place; cell: Cell; atlas: { w: number; h: number }; size: number },
): CSSProperties {
  const divW = place.w * size;
  const divH = place.h * size;
  const scaleX = divW / cell.sw;
  const scaleY = divH / cell.sh;
  return {
    position: "absolute",
    left: place.x * size,
    top: place.y * size,
    width: divW,
    height: divH,
    backgroundSize: `${atlas.w * scaleX}px ${atlas.h * scaleY}px`,
    backgroundPosition: `-${cell.sx * scaleX}px -${cell.sy * scaleY}px`,
    backgroundRepeat: "no-repeat",
  };
}
