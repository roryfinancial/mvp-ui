import { test } from "node:test";
import assert from "node:assert/strict";
import { spriteCss } from "./spriteStyle.ts";

test("spriteCss sizes the div by place box and scales the atlas to the cell", () => {
  // a layer occupying a 0.125-wide region, rendered at size=512 → 64px wide.
  const css = spriteCss({
    place: { x: 0.25, y: 0.5, w: 0.125, h: 0.25 },
    cell: { sx: 40, sy: 0, sw: 64, sh: 128 },
    atlas: { w: 200, h: 128 },
    size: 512,
  });
  assert.equal(css.width, 64);   // 0.125 * 512
  assert.equal(css.height, 128); // 0.25 * 512
  // background scaled so the 64px-wide cell maps onto the 64px div:
  // backgroundSize = atlas scaled by (divW / cellW) = 200*(64/64)=200, 128*(128/128)=128
  assert.equal(css.backgroundSize, "200px 128px");
  // position shifts the atlas so the cell's top-left lands at the div origin
  assert.equal(css.backgroundPosition, "-40px -0px");
  assert.equal(css.backgroundRepeat, "no-repeat");
});
