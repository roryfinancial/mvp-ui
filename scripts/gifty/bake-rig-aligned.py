#!/usr/bin/env python3
"""
bake-rig-aligned.py — quad-aware rig baker.

Every face part is cut from some render, but each render frames Gifty's face at a
different scale/skew. Using the per-render FACE QUADS (anchors.json), we warp each
part from its source render's face-plane into the BASE render's face-plane via a
perspective homography. Result: parts from ANY render (smug eyes, every mouth
viseme, brows) land pixel-correct on the base Gifty — swaps line up.

Also emits the base face quad + canvas size so the runtime can later re-project
into face-space (flat front PFP, head turns, etc).

  python scripts/gifty/bake-rig-aligned.py
Out: public/gifty/rig-layers/ (PNGs warped into base space + rig.json)
"""
import os, json
import numpy as np, cv2
from PIL import Image

ROOT = "."
PARTS = "public/gifty/parts"
ANCH = f"{PARTS}/anchors.json"
OUT = "public/gifty/rig-layers"
C = 1024
os.makedirs(OUT, exist_ok=True)

anchors = json.load(open(ANCH))
def gid(short_or_full):
    # accept either a 6-char short or full folder name
    for k in anchors:
        if k.endswith(short_or_full) or k == short_or_full or short_or_full in k:
            return k
    return None

def quad_pts(render_key):
    q = anchors[render_key].get("quad")
    if not q:
        bl, tr = anchors[render_key]["anchor"], anchors[render_key]["center"]
        x0, x1 = min(bl["x"], tr["x"]), max(bl["x"], tr["x"]); y0, y1 = min(bl["y"], tr["y"]), max(bl["y"], tr["y"])
        q = {"TL": {"x": x0, "y": y0}, "TR": {"x": x1, "y": y0}, "BR": {"x": x1, "y": y1}, "BL": {"x": x0, "y": y1}}
    return np.float32([[q["TL"]["x"]*C, q["TL"]["y"]*C], [q["TR"]["x"]*C, q["TR"]["y"]*C],
                       [q["BR"]["x"]*C, q["BR"]["y"]*C], [q["BL"]["x"]*C, q["BL"]["y"]*C]])

BASE = "Gemini_Generated_Image_1c2np91c2np91c2n"   # thumbsup
base_quad = quad_pts(BASE)

def load_part(render_folder, part):
    p = f"{PARTS}/{render_folder}/{part}.png"
    if not os.path.exists(p): return None
    im = Image.open(p).convert("RGBA").resize((C, C))
    return np.array(im)

def warp_into_base(rgba, src_render):
    """Homography from src render's face-quad → base face-quad (FACE parts)."""
    src_q = quad_pts(src_render)
    H = cv2.getPerspectiveTransform(src_q, base_quad)
    return cv2.warpPerspective(rgba, H, (C, C), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))

def quad_metrics(q):
    """centroid + mean edge length of a 4-pt quad (face size proxy)."""
    cx, cy = q[:, 0].mean(), q[:, 1].mean()
    # average of the two diagonals as a robust scale
    d1 = np.linalg.norm(q[2] - q[0]); d2 = np.linalg.norm(q[3] - q[1])
    return np.array([cx, cy]), (d1 + d2) / 2

_BASE_C, _BASE_S = quad_metrics(base_quad)

def scale_into_base(rgba, src_render):
    """Similarity transform (uniform scale + translate) for LIMBS: not on the
    face plane, but scaled by the src render's face-size vs base, and shifted so
    the src face centroid maps onto the base face centroid. Keeps the limb's
    shape (no shear), just makes it the right relative size/position."""
    src_q = quad_pts(src_render)
    src_c, src_s = quad_metrics(src_q)
    s = _BASE_S / src_s                      # uniform scale factor
    # affine: x' = s*(x - src_c) + base_c
    M = np.float32([[s, 0, _BASE_C[0] - s * src_c[0]],
                    [0, s, _BASE_C[1] - s * src_c[1]]])
    return cv2.warpAffine(rgba, M, (C, C), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))

def bbox(rgba):
    a = rgba[..., 3] > 40
    ys, xs = np.where(a)
    if len(xs) == 0: return None
    return {"cx": round(float((xs.min()+xs.max())/2)/C, 4), "cy": round(float((ys.min()+ys.max())/2)/C, 4),
            "x": round(float(xs.min())/C, 4), "y": round(float(ys.min())/C, 4),
            "w": round(float(xs.max()-xs.min()+1)/C, 4), "h": round(float(ys.max()-ys.min()+1)/C, 4)}

def emit(name, render_folder, part, meta, mode="warp"):
    """mode: 'warp' = face homography (face parts) · 'scale' = similarity from
    face-quad size (limbs) · 'none' = base space, as-is."""
    rgba = load_part(render_folder, part)
    if rgba is None:
        print("  missing", render_folder, part); return False
    if mode == "warp":
        rgba = warp_into_base(rgba, render_folder)
    elif mode == "scale":
        rgba = scale_into_base(rgba, render_folder)
    Image.fromarray(rgba, "RGBA").save(f"{OUT}/{name}.png")
    meta[name] = bbox(rgba)
    return True

# ── layer plan ───────────────────────────────────────────────────────────────
# base structural layers come from BASE (no warp needed — already base space)
BASE_LAYERS = ["body", "leg_l", "leg_r", "arm_l", "arm_r", "bow", "eyebrow_l", "eyebrow_r"]
# mouth visemes/moods — each from a render, WARPED into base face-plane
MOUTHS = {
    "talk_ah": (BASE, "mouth"),
    "talk_oh": ("Gemini_Generated_Image_cqmh61cqmh61cqmh", "mouth"),
    "talk_eh": ("Gemini_Generated_Image_kc9x3vkc9x3vkc9x", "mouth"),
    "smile":   ("Gemini_Generated_Image_vcp61avcp61avcp6", "mouth"),
    "shy":     ("Gemini_Generated_Image_bfzncmbfzncmbfzn", "mouth"),
    "proud":   ("Gemini_Generated_Image_u1b4qyu1b4qyu1b4", "mouth"),
    "hmm":     ("Gemini_Generated_Image_xzp7kcxzp7kcxzp7", "mouth"),
}
EYES = {
    "normal": BASE,
    "smug":   "Gemini_Generated_Image_u1b4qyu1b4qyu1b4",
    "happy":  "Gemini_Generated_Image_vcp61avcp61avcp6",
}
PUPILS = {"normal": BASE}

# Arm/leg VARIANTS. Limbs aren't on the face plane, so they use a SIMILARITY
# transform (mode="scale"): scaled by the source render's face-quad size vs base
# and re-centered on the base face — correct relative size/position without shear.
# One option per render that has the cut, named by its pose.
G = "Gemini_Generated_Image_"
ARM_R = {
    "thumbsup": (G+"1c2np91c2np91c2n", "arm_r"),
    "wave":     (G+"kc9x3vkc9x3vkc9x", "arm_r"),
    "fist":     (G+"u1b4qyu1b4qyu1b4", "arm_r"),
    "salute":   (G+"r9wewpr9wewpr9we", "arm_r"),
    "down":     (G+"cqmh61cqmh61cqmh", "arm_r"),
    "sad":      (G+"bfzncmbfzncmbfzn", "arm_r"),
    "open":     (G+"ew4fcuew4fcuew4f", "arm_r"),
    "present":  (G+"wvymdawvymdawvym", "arm_r"),
    "calm":     (G+"vcp61avcp61avcp6", "arm_r"),
}
ARM_L = {
    "thumbsup": (G+"1c2np91c2np91c2n", "arm_l"),
    "down":     (G+"cqmh61cqmh61cqmh", "arm_l"),
    "wave":     (G+"kc9x3vkc9x3vkc9x", "arm_l"),
    "hip":      (G+"u1b4qyu1b4qyu1b4", "arm_l"),
    "salute":   (G+"r9wewpr9wewpr9we", "arm_l"),
    "sad":      (G+"bfzncmbfzncmbfzn", "arm_l"),
    "open":     (G+"ew4fcuew4fcuew4f", "arm_l"),
    "hold":     (G+"wvymdawvymdawvym", "arm_l"),
    "calm":     (G+"vcp61avcp61avcp6", "arm_l"),
}
LEGS = {
    "stand":  (G+"1c2np91c2np91c2n", ("leg_l", "leg_r")),
    "walk":   (G+"kc9x3vkc9x3vkc9x", ("leg_l", "leg_r")),
    "sit":    (G+"vcp61avcp61avcp6", ("leg_l", "leg_r")),
}

def main():
    for f in os.listdir(OUT):
        if f.endswith(".png"): os.remove(os.path.join(OUT, f))
    meta = {}

    # body/bow/eyebrows from base (no transform)
    for l in ["body", "bow", "eyebrow_l", "eyebrow_r"]:
        emit(l, BASE, l, meta, mode="none")

    # arm/leg variants — similarity-scaled by each render's face-quad vs base
    arm_r, arm_l, legs = {}, {}, {}
    for name, (render, part) in ARM_R.items():
        layer = f"armR_{name}"
        m = "none" if render == BASE else "scale"
        if emit(layer, render, part, meta, mode=m): arm_r[name] = layer
    for name, (render, part) in ARM_L.items():
        layer = f"armL_{name}"
        m = "none" if render == BASE else "scale"
        if emit(layer, render, part, meta, mode=m): arm_l[name] = layer
    for name, (render, (pl, pr)) in LEGS.items():
        m = "none" if render == BASE else "scale"
        if emit(f"legL_{name}", render, pl, meta, mode=m) and emit(f"legR_{name}", render, pr, meta, mode=m):
            legs[name] = {"l": f"legL_{name}", "r": f"legR_{name}"}

    mouths = {}
    for name, (render, part) in MOUTHS.items():
        layer = f"mouth_{name}"
        if emit(layer, render, part, meta, mode=("none" if render==BASE else "warp")):
            mouths[name] = layer

    eyes = {}
    for mood, render in EYES.items():
        for s in ("l", "r"):
            emit(f"eye_{mood}_{s}", render, f"eye_{s}", meta, mode=("none" if render==BASE else "warp"))
        eyes[mood] = {"l": f"eye_{mood}_l", "r": f"eye_{mood}_r"}

    pupils = {}
    for mood, render in PUPILS.items():
        for s in ("l", "r"):
            emit(f"pupil_{mood}_{s}", render, f"pupil_{s}", meta, mode=("none" if render==BASE else "warp"))
        pupils[mood] = {"l": f"pupil_{mood}_l", "r": f"pupil_{mood}_r"}

    order = ["body", "__legs__", "__armL__", "__armR__", "bow",
             "eyebrow_l", "eyebrow_r", "__eyes__", "__pupils__", "__mouth__"]

    # base face quad (0..1) for runtime face-space re-projection later
    bq = anchors[BASE].get("quad")
    json.dump({"canvas": C, "order": order, "base": BASE_LAYERS, "meta": meta,
               "mouths": mouths, "eyes": eyes, "pupils": pupils,
               "armR": arm_r, "armL": arm_l, "legs": legs,
               "defaults": {"mouth": "smile", "eyes": "normal", "pupils": "normal",
                            "armR": "thumbsup", "armL": "down", "legs": "stand"},
               "faceQuad": bq, "baseRender": BASE},
              open(f"{OUT}/rig.json", "w"), indent=1)
    print("✓ baked quad-aligned rig")
    print("  mouths:", ", ".join(mouths))
    print("  eye moods:", ", ".join(eyes))

if __name__ == "__main__":
    main()
