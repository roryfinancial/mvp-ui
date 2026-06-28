#!/usr/bin/env python3
"""Rectify each render's face: warp its 4-corner face-quad to a flat square
using a perspective homography. Output raw un-skewed faces (the 'hitbox' view)
so face parts from any render register to a common frame.

  python scripts/gifty/unskew-faces.py
Out: public/gifty/unskew/<render>.png  + a contact-sheet
"""
import os, json
import numpy as np, cv2
from PIL import Image

ROOT="."
RENDERS="docs/design/gifty"
ANCH="public/gifty/parts/anchors.json"
OUT="public/gifty/unskew"; os.makedirs(OUT, exist_ok=True)
S=512  # square output size

anchors=json.load(open(ANCH))

def quad_of(v):
    if "quad" in v and v["quad"]: return v["quad"]
    # migrate anchors-only
    bl,tr=v["anchor"],v["center"]
    x0,x1=min(bl["x"],tr["x"]),max(bl["x"],tr["x"]); y0,y1=min(bl["y"],tr["y"]),max(bl["y"],tr["y"])
    return {"TL":{"x":x0,"y":y0},"TR":{"x":x1,"y":y0},"BR":{"x":x1,"y":y1},"BL":{"x":x0,"y":y1}}

tiles=[]
for base,v in anchors.items():
    src=f"{RENDERS}/{base}.png"
    if not os.path.exists(src): continue
    img=np.array(Image.open(src).convert("RGB")); H,W=img.shape[:2]
    q=quad_of(v)
    src_pts=np.float32([[q["TL"]["x"]*W,q["TL"]["y"]*H],[q["TR"]["x"]*W,q["TR"]["y"]*H],
                        [q["BR"]["x"]*W,q["BR"]["y"]*H],[q["BL"]["x"]*W,q["BL"]["y"]*H]])
    dst_pts=np.float32([[0,0],[S,0],[S,S],[0,S]])
    M=cv2.getPerspectiveTransform(src_pts,dst_pts)
    warp=cv2.warpPerspective(img,M,(S,S),flags=cv2.INTER_CUBIC,borderMode=cv2.BORDER_REPLICATE)
    short=base.replace("Gemini_Generated_Image_","")[:6]
    Image.fromarray(warp).save(f"{OUT}/{short}.png")
    tiles.append((short,warp))
    print("unskewed",short)

# contact sheet
cols=min(6,len(tiles)); rows=(len(tiles)+cols-1)//cols
sheet=Image.new("RGB",(cols*S//2,rows*S//2),(40,40,40))
from PIL import ImageDraw
for i,(name,w) in enumerate(tiles):
    t=Image.fromarray(w).resize((S//2,S//2)); 
    d=ImageDraw.Draw(t); d.text((4,4),name,fill=(255,220,0))
    sheet.paste(t,((i%cols)*S//2,(i//cols)*S//2))
sheet.save(f"{ROOT}/{os.environ.get('SP','/tmp')}/unskew_sheet.png" if os.environ.get('SP') else "public/gifty/unskew/_sheet.png")
print("done:",len(tiles),"faces")
