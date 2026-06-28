#!/usr/bin/env python3
"""Gifty cutout tool — local SAM point-prompt server (keeps SAM in memory).

Run inside the venv (torch + segment-anything):
  python scripts/gifty/cutter/server.py --renders docs/design/gifty \
     --out public/gifty/parts --ckpt <sam_vit_b.pth> --model vit_b
Open http://localhost:8077
"""
import argparse, base64, io, os, glob, threading
import numpy as np
import cv2
import torch
torch.set_num_threads(max(1, (os.cpu_count() or 4) // 2))  # don't peg all cores
from flask import Flask, request, jsonify, send_from_directory
from PIL import Image
from segment_anything import sam_model_registry, SamPredictor

PREVIEW_MAX = 512        # downscale mask previews so the browser isn't decoding 1024² PNGs
_lock = threading.Lock() # serialize SAM calls — never let requests pile up

ap = argparse.ArgumentParser()
ap.add_argument("--renders", required=True)
ap.add_argument("--out", required=True)
ap.add_argument("--ckpt", required=True)
ap.add_argument("--model", default="vit_b")
ap.add_argument("--port", type=int, default=8077)
a = ap.parse_args()
# send_from_directory needs absolute paths (relative dirs 404 on modern Flask)
a.renders = os.path.abspath(a.renders)
a.out = os.path.abspath(a.out)
os.makedirs(a.out, exist_ok=True)

print("loading SAM…", flush=True)
sam = sam_model_registry[a.model](checkpoint=a.ckpt).to("cpu")
P = SamPredictor(sam)
print("SAM ready", flush=True)

HERE = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__)
cur = {"name": None, "img": None, "W": 0, "H": 0}


def _mask(points, max_cov):
    W, H = cur["W"], cur["H"]
    coords = np.array([[p["x"] * W, p["y"] * H] for p in points])
    labels = np.array([p["label"] for p in points])
    with _lock, torch.inference_mode():           # one at a time, no grad memory
        masks, scores, _ = P.predict(point_coords=coords, point_labels=labels, multimask_output=True)
    order = np.argsort(-scores)
    chosen = order[0]
    for i in order:
        if masks[i].sum() / (H * W) <= max_cov:
            chosen = i
            break
    return masks[chosen], float(scores[chosen])


def _refine(mask, smooth, color_tol):
    """Post-process the raw SAM mask.
      smooth (0..15): morphological close+open to straighten/soften the edge
                      (closes nicks, removes specks, rounds jaggies).
      color_tol (0..60): grow the mask into neighbouring pixels whose color is
                      within tol of the part's mean color — snaps to the true
                      color boundary, recovers thin bits / kills halos.
    """
    m = mask.astype(np.uint8)
    if color_tol > 0 and m.any():
        img = cur["img"].astype(np.int16)
        mean = img[mask].mean(0)                      # part's average color
        dist = np.sqrt(((img - mean) ** 2).sum(2))    # per-pixel color distance
        similar = (dist <= color_tol).astype(np.uint8)
        # grow only into similar pixels that are CONNECTED to the mask: iteratively
        # dilate the mask but clamp to the similar region (flood-fill within color).
        reach = max(3, color_tol // 4)
        for _ in range(reach):
            d = cv2.dilate(m, np.ones((3, 3), np.uint8))
            nxt = ((m | (d & similar)) > 0).astype(np.uint8)
            if nxt.sum() == m.sum():
                break
            m = nxt
    if smooth > 0:
        k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (smooth * 2 + 1, smooth * 2 + 1))
        m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, k)   # fill nicks / straighten
        m = cv2.morphologyEx(m, cv2.MORPH_OPEN, k)    # drop specks / soften
    return m.astype(bool)


def _preview_png(mask, view="isolate"):
    """Cheap, downscaled preview. View modes:
       overlay  – pink tint ON the part (see what's selected in context)
       isolate  – the part stays full-color, everything ELSE is dimmed+greyed
       cutout   – only the part, rest fully transparent (true cutout)
    """
    H, W = mask.shape
    img = cur["img"]  # RGB
    out = np.zeros((H, W, 4), np.uint8)
    if view == "overlay":
        out[mask] = (229, 68, 127, 160)
    elif view == "cutout":
        out[..., :3] = img
        out[..., 3] = (mask * 255).astype(np.uint8)
    else:  # isolate: part full-color, background greyed+dark
        grey = (img.mean(2, keepdims=True) * np.array([1, 1, 1]) * 0.35).astype(np.uint8)
        out[..., :3] = np.where(mask[..., None], img, grey)
        out[..., 3] = np.where(mask, 255, 235)  # rest slightly translucent
    im = Image.fromarray(out, "RGBA")
    # downscale preserving EXACT source aspect (avoid ±1px rounding that would
    # make the overlay drift vs the square base under object-fit:contain)
    if max(W, H) > PREVIEW_MAX:
        s = PREVIEW_MAX / max(W, H)
        im = im.resize((round(W * s), round(H * s)), Image.NEAREST)
    buf = io.BytesIO(); im.save(buf, "PNG", optimize=True)
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


@app.route("/")
def index():
    return send_from_directory(HERE, "index.html")

@app.route("/images")
def images():
    return jsonify([os.path.basename(f) for f in sorted(glob.glob(os.path.join(a.renders, "*.png")))])

@app.route("/render/<path:name>")
def render(name):
    return send_from_directory(a.renders, name)

# cache SAM image embeddings so switching renders is instant (set_image is ~5s)
_emb = {}  # name -> (features, input_size, original_size, img, W, H)

def _embed_into_predictor(name):
    if name in _emb:
        feat, isz, osz, img, W, H = _emb[name]
        P.features = feat
        P.input_size = isz
        P.original_size = osz
        P.is_image_set = True
        cur.update(name=name, img=img, H=H, W=W)
        return
    img = np.array(Image.open(os.path.join(a.renders, name)).convert("RGB"))
    with _lock, torch.inference_mode():
        P.set_image(img)
    _emb[name] = (P.features, P.input_size, P.original_size, img, img.shape[1], img.shape[0])
    cur.update(name=name, img=img, H=img.shape[0], W=img.shape[1])

@app.route("/embed", methods=["POST"])
def embed():
    name = request.json["name"]
    _embed_into_predictor(name)
    return jsonify(ok=True, w=cur["W"], h=cur["H"], cached=name in _emb)

@app.route("/segment", methods=["POST"])
def segment():
    if cur["img"] is None:
        return jsonify(error="embed first"), 400
    j = request.json
    if not j["points"]:
        return jsonify(png="", coverage=0, score=0)
    m, sc = _mask(j["points"], j.get("maxCoverage", 1.0))
    m = _refine(m, int(j.get("smooth", 0)), int(j.get("colorTol", 0)))
    return jsonify(png=_preview_png(m, j.get("view", "isolate")),
                   coverage=float(m.sum() / (cur["W"] * cur["H"])), score=sc)

@app.route("/save", methods=["POST"])
def save():
    j = request.json
    m, _ = _mask(j["points"], j.get("maxCoverage", 1.0))
    m = _refine(m, int(j.get("smooth", 0)), int(j.get("colorTol", 0)))
    alpha = (m * 255).astype(np.uint8)
    feather = int(j.get("feather", 0))
    if feather > 0:                                   # soft anti-aliased edge on save
        alpha = cv2.GaussianBlur(alpha, (feather * 2 + 1, feather * 2 + 1), 0)
    rgba = np.dstack([cur["img"], alpha])
    base = os.path.splitext(cur["name"])[0]
    d = os.path.join(a.out, base); os.makedirs(d, exist_ok=True)
    path = os.path.join(d, j["part"] + ".png")
    Image.fromarray(rgba, "RGBA").save(path)
    return jsonify(ok=True, path=os.path.relpath(path))

def _prewarm():
    names = [os.path.basename(f) for f in sorted(glob.glob(os.path.join(a.renders, "*.png")))]
    for n in names:
        try:
            _embed_into_predictor(n)
            print(f"prewarmed {n} ({len(_emb)}/{len(names)})", flush=True)
        except Exception as e:
            print("prewarm skip", n, e, flush=True)

def _full_silhouette():
    """Whole-character mask = non-background pixels. Background is the flat light
    grey AND its soft ground shadow (a darker, still-desaturated grey). We treat
    any low-saturation grey as background so the shadow isn't kept."""
    img = cur["img"].astype(int)
    r, g, b = img[..., 0], img[..., 1], img[..., 2]
    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)
    sat = mx - mn                                    # chroma; greys ≈ 0
    grey = sat < 22                                  # any neutral grey = bg/shadow
    light = mx > 150                                 # exclude only mid+light greys
    bg = grey & light
    m = (~bg).astype(np.uint8)
    # clean: drop specks, keep the largest connected blob (the character)
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n, lbl, stats, _ = cv2.connectedComponentsWithStats(m, 8)
    if n > 1:
        biggest = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
        m = (lbl == biggest).astype(np.uint8)
    return m.astype(bool)


@app.route("/derive_body", methods=["POST"])
def derive_body():
    """body = full silhouette − (other already-saved parts), then inpaint the
    holes left where those parts were, so the box is whole. Returns a preview."""
    base = os.path.splitext(cur["name"])[0]
    pdir = os.path.join(a.out, base)
    exclude = request.json.get("exclude", [])  # part names to subtract
    sil = _full_silhouette().astype(np.uint8)
    holes = np.zeros_like(sil)
    for part in exclude:
        p = os.path.join(pdir, part + ".png")
        if os.path.isfile(p):
            al = np.array(Image.open(p).convert("RGBA"))[..., 3] > 40
            sil[al] = 0
            holes[al] = 1
    # inpaint the removed regions so the body is continuous behind them
    img_bgr = cv2.cvtColor(cur["img"], cv2.COLOR_RGB2BGR)
    inpainted = cv2.inpaint(img_bgr, (holes * 255).astype(np.uint8), 6, cv2.INPAINT_TELEA)
    inpainted = cv2.cvtColor(inpainted, cv2.COLOR_BGR2RGB)
    # stash WITH the render name so a concurrent embed can't misroute the save
    cur["_body"] = {"name": cur["name"], "img": inpainted, "mask": sil.astype(bool)}
    out = np.zeros((*sil.shape, 4), np.uint8)
    out[..., :3] = np.where(sil[..., None].astype(bool), inpainted, (cur["img"] * 0.35).astype(np.uint8))
    out[..., 3] = np.where(sil.astype(bool), 255, 200)
    im = Image.fromarray(out, "RGBA")
    if max(im.size) > PREVIEW_MAX:
        s = PREVIEW_MAX / max(im.size); im = im.resize((int(im.width*s), int(im.height*s)), Image.NEAREST)
    buf = io.BytesIO(); im.save(buf, "PNG", optimize=True)
    return jsonify(png="data:image/png;base64," + base64.b64encode(buf.getvalue()).decode(),
                   coverage=float(sil.sum() / sil.size))


@app.route("/save_body", methods=["POST"])
def save_body():
    """Save the derived+inpainted body layer to ITS OWN render (race-safe)."""
    b = cur.get("_body")
    if not b:
        return jsonify(error="derive body first"), 400
    rgba = np.dstack([b["img"], (b["mask"] * 255).astype(np.uint8)])
    base = os.path.splitext(b["name"])[0]
    d = os.path.join(a.out, base); os.makedirs(d, exist_ok=True)
    path = os.path.join(d, "body.png")
    Image.fromarray(rgba, "RGBA").save(path)
    return jsonify(ok=True, path=os.path.relpath(path))


@app.route("/save_painted", methods=["POST"])
def save_painted():
    """Save a part from a hand-painted mask sent as a base64 PNG (alpha = mask).
    Used by the brush tool to fix edges / paint custom regions."""
    j = request.json
    data = base64.b64decode(j["maskPng"].split(",", 1)[1])
    pm = np.array(Image.open(io.BytesIO(data)).convert("L").resize((cur["W"], cur["H"]), Image.NEAREST))
    m = pm > 40
    rgba = np.dstack([cur["img"], (m * 255).astype(np.uint8)])
    base = os.path.splitext(cur["name"])[0]
    d = os.path.join(a.out, base); os.makedirs(d, exist_ok=True)
    path = os.path.join(d, j["part"] + ".png")
    Image.fromarray(rgba, "RGBA").save(path)
    return jsonify(ok=True, path=os.path.relpath(path))


if __name__ == "__main__":
    print(f"open http://localhost:{a.port}", flush=True)
    # warm embeddings in the background so image-switching is instant
    threading.Thread(target=_prewarm, daemon=True).start()
    # threaded so a slow op never freezes the page/CSS
    app.run(port=a.port, debug=False, threaded=True)
