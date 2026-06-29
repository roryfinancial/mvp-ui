import { test } from "node:test";
import assert from "node:assert/strict";
import { frameCss } from "./frameStyle.ts";

test("frameCss positions div at place*size and crops the cell", () => {
  const css = frameCss({
    place: { x: 0.25, y: 0.10, w: 0.5, h: 0.5 },
    cell: { sx: 2, sy: 2, sw: 100, sh: 100 },
    atlas: { w: 400, h: 200 },
    size: 320,
  });
  // div geometry from place
  assert.equal(css.left, 80);    // 0.25 * 320
  assert.equal(css.top, 32);     // 0.10 * 320
  assert.equal(css.width, 160);  // 0.5 * 320
  assert.equal(css.height, 160); // 0.5 * 320
  assert.equal(css.position, "absolute");
  // background crops the cell: scaleX = 160/100 = 1.6
  assert.equal(css.backgroundSize, `${400 * 1.6}px ${200 * 1.6}px`);
  assert.equal(css.backgroundPosition, `-${2 * 1.6}px -${2 * 1.6}px`);
  assert.equal(css.backgroundRepeat, "no-repeat");
});
