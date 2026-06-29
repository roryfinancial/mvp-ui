#!/usr/bin/env python3
"""Gifty part editor — a dependency-free local tool to clean existing rig parts.

Lists every PNG in the locked rig-final dir, lets you zoom on light/dark/checker
backgrounds, brush-erase or magic-erase (flood by color similarity) stray pixels,
and save back (with a one-time backup in .editor-backup/). No SAM, no torch, no
flask — just Python's stdlib http.server.

  python scripts/gifty/part-editor/server.py            # serves rig-final
  python scripts/gifty/part-editor/server.py --dir public/gifty/rig-layers
  open http://localhost:8078

After saving parts, re-bake the web atlas:  npm run rig:compress
"""
import argparse
import base64
import json
import os
import shutil
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))

ap = argparse.ArgumentParser()
ap.add_argument("--dir", default="public/gifty/rig-final")
ap.add_argument("--port", type=int, default=8078)
args = ap.parse_args()
PARTS = os.path.abspath(os.path.join(ROOT, args.dir))
BACKUP = os.path.join(PARTS, ".editor-backup")


def list_parts():
    return sorted(f for f in os.listdir(PARTS)
                  if f.endswith(".png") and not f.startswith("."))


class H(BaseHTTPRequestHandler):
    def _send(self, code, body, ctype="application/json"):
        if isinstance(body, str):
            body = body.encode()
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *a):
        pass

    def do_GET(self):
        u = urlparse(self.path)
        if u.path == "/":
            self._send(200, INDEX, "text/html")
        elif u.path == "/parts":
            self._send(200, json.dumps(list_parts()))
        elif u.path == "/img":
            name = parse_qs(u.query).get("name", [""])[0]
            p = os.path.join(PARTS, name)
            if not (name and os.path.basename(name) == name and os.path.exists(p)):
                return self._send(404, "no")
            with open(p, "rb") as f:
                self._send(200, f.read(), "image/png")
        else:
            self._send(404, "no")

    def do_POST(self):
        u = urlparse(self.path)
        if u.path != "/save":
            return self._send(404, "no")
        n = int(self.headers.get("Content-Length", 0))
        data = json.loads(self.rfile.read(n))
        name = data.get("name", "")
        if not (name and os.path.basename(name) == name and name.endswith(".png")):
            return self._send(400, json.dumps({"err": "bad name"}))
        dst = os.path.join(PARTS, name)
        if not os.path.exists(dst):
            return self._send(404, json.dumps({"err": "not found"}))
        os.makedirs(BACKUP, exist_ok=True)
        bkp = os.path.join(BACKUP, name)
        if not os.path.exists(bkp):
            shutil.copy2(dst, bkp)   # one-time backup of the original
        png = base64.b64decode(data["png"].split(",", 1)[1])
        with open(dst, "wb") as f:
            f.write(png)
        self._send(200, json.dumps({"ok": True, "backedUp": not os.path.exists(bkp)}))


INDEX = r"""<!doctype html><html><head><meta charset=utf-8><title>Gifty Part Editor</title>
<style>
 body{margin:0;font:13px system-ui;background:#0d1b3a;color:#eef;display:flex;height:100vh}
 #side{width:200px;overflow:auto;border-right:1px solid #223;padding:8px;flex:none}
 #side button{display:block;width:100%;text-align:left;margin:2px 0;padding:5px 7px;border:1px solid #2a3a6a;
   background:transparent;color:#cde;border-radius:6px;cursor:pointer;font-size:12px}
 #side button.on{background:#E5447F;border-color:#E5447F;color:#fff}
 #main{flex:1;display:flex;flex-direction:column}
 #bar{padding:8px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;border-bottom:1px solid #223}
 #bar button,#bar select{padding:6px 10px;border-radius:6px;border:1px solid #2a3a6a;background:#16234a;color:#fff;cursor:pointer}
 #bar button.on{background:#3a6;border-color:#3a6}
 #stage{flex:1;overflow:auto}
 #wrap{position:relative;image-rendering:pixelated;width:max-content}
 canvas{display:block;image-rendering:pixelated}
 .hint{opacity:.6}
 label{display:flex;gap:4px;align-items:center}
</style></head><body>
<div id=side><b>Parts</b><div id=list></div></div>
<div id=main>
 <div id=bar>
  <button id=tBrush class=on>🧽 Erase brush</button>
  <button id=tMagic>✨ Magic erase</button>
  <label>size <input id=size type=range min=1 max=40 value=8></label>
  <label>tol <input id=tol type=range min=2 max=120 value=40></label>
  <label>bg <select id=bg><option value=dark>dark</option><option value=light>light</option><option value=magenta>magenta</option><option value=checker>checker</option></select></label>
  <label>zoom <input id=zoom type=range min=1 max=12 value=4></label>
  <button id=undo>�undo</button>
  <button id=reset>reset</button>
  <button id=save>💾 Save (re-bake after!)</button>
  <span id=status class=hint></span>
 </div>
 <div id=stage><div id=wrap><canvas id=cv></canvas></div></div>
</div>
<script>
let cur=null, img=null, W=0,H=0, ctx, undoStack=[];
let fullW=0, fullH=0, offX=0, offY=0;   // crop offset back onto the full canvas
const cv=document.getElementById('cv'), wrap=document.getElementById('wrap');
ctx=cv.getContext('2d',{willReadFrequently:true});
let tool='brush';
const $=id=>document.getElementById(id);

fetch('/parts').then(r=>r.json()).then(parts=>{
 const L=$('list');
 parts.forEach(p=>{const b=document.createElement('button');b.textContent=p;b.onclick=()=>load(p,b);L.appendChild(b);});
});

function load(name,btn){
 [...$('list').children].forEach(b=>b.classList.toggle('on',b===btn));
 cur=name; const im=new Image();
 im.onload=()=>{fullW=im.naturalWidth;fullH=im.naturalHeight;
   // find the content bbox on the full image, then crop the editing canvas to it + pad
   const tmp=document.createElement('canvas');tmp.width=fullW;tmp.height=fullH;
   const tc=tmp.getContext('2d',{willReadFrequently:true});tc.drawImage(im,0,0);
   const d=tc.getImageData(0,0,fullW,fullH).data;let x0=fullW,y0=fullH,x1=0,y1=0,any=false;
   for(let y=0;y<fullH;y++)for(let x=0;x<fullW;x++){if(d[(y*fullW+x)*4+3]>8){any=true;if(x<x0)x0=x;if(y<y0)y0=y;if(x>x1)x1=x;if(y>y1)y1=y;}}
   const pad=24;if(!any){x0=0;y0=0;x1=fullW-1;y1=fullH-1;}
   offX=Math.max(0,x0-pad);offY=Math.max(0,y0-pad);
   W=Math.min(fullW,x1+pad)-offX;H=Math.min(fullH,y1+pad)-offY;
   img=im;cv.width=W;cv.height=H;ctx.clearRect(0,0,W,H);
   ctx.drawImage(im,offX,offY,W,H,0,0,W,H);undoStack=[];
   fitZoom();applyZoom();$('status').textContent=name+'  part '+W+'×'+H+' @('+offX+','+offY+')';};
 im.src='/img?name='+encodeURIComponent(name)+'&t='+Date.now();
}
function fitZoom(){const z=Math.max(2,Math.min(12,Math.floor(Math.min(($('stage').clientWidth-30)/Math.max(1,W),($('stage').clientHeight-30)/Math.max(1,H)))));
 $('zoom').value=z||4;}
function applyZoom(){const z=+$('zoom').value;cv.style.width=(W*z)+'px';cv.style.height=(H*z)+'px';drawBg();}
function drawBg(){const m=$('bg').value;let c='#0d1b3a';
 if(m==='light')c='#dfe6f5'; if(m==='magenta')c='#ff00ff';
 if(m==='checker'){wrap.style.background='conic-gradient(#888 90deg,#bbb 0 180deg,#888 0 270deg,#bbb 0) 0 0/16px 16px';return;}
 wrap.style.background=c;}
function draw(){/* canvas already holds the pixels */}
function pushUndo(){if(!img)return;undoStack.push(ctx.getImageData(0,0,W,H));if(undoStack.length>30)undoStack.shift();}

function pos(e){const r=cv.getBoundingClientRect();const z=+$('zoom').value;
 return {x:Math.floor((e.clientX-r.left)/z),y:Math.floor((e.clientY-r.top)/z)};}

let down=false;
cv.addEventListener('pointerdown',e=>{if(!img)return;pushUndo();down=true;
 if(tool==='magic')magic(pos(e)); else erase(pos(e));});
cv.addEventListener('pointermove',e=>{if(down&&tool==='brush')erase(pos(e));});
window.addEventListener('pointerup',()=>down=false);

function erase(p){const s=+$('size').value;const d=ctx.getImageData(Math.max(0,p.x-s),Math.max(0,p.y-s),s*2,s*2);
 const im=d.data;for(let yy=0;yy<d.height;yy++)for(let xx=0;xx<d.width;xx++){
  const dx=xx-(p.x-(p.x-s<0?p.x:s)),dy=yy-(p.y-(p.y-s<0?p.y:s));
  if(dx*dx+dy*dy<=s*s){const i=(yy*d.width+xx)*4;im[i+3]=0;}}
 ctx.putImageData(d,Math.max(0,p.x-s),Math.max(0,p.y-s));}

function magic(p){const tol=+$('tol').value;const all=ctx.getImageData(0,0,W,H);const d=all.data;
 const i0=(p.y*W+p.x)*4;const r0=d[i0],g0=d[i0+1],b0=d[i0+2];
 if(d[i0+3]===0)return;const seen=new Uint8Array(W*H);const st=[p.y*W+p.x];
 while(st.length){const idx=st.pop();if(seen[idx])continue;seen[idx]=1;const i=idx*4;
  if(d[i+3]===0)continue;const dr=d[i]-r0,dg=d[i+1]-g0,db=d[i+2]-b0;
  if(dr*dr+dg*dg+db*db>tol*tol)continue;d[i+3]=0;
  const x=idx%W,y=(idx/W)|0;
  if(x>0)st.push(idx-1);if(x<W-1)st.push(idx+1);if(y>0)st.push(idx-W);if(y<H-1)st.push(idx+W);}
 ctx.putImageData(all,0,0);}

$('tBrush').onclick=()=>{tool='brush';$('tBrush').classList.add('on');$('tMagic').classList.remove('on');};
$('tMagic').onclick=()=>{tool='magic';$('tMagic').classList.add('on');$('tBrush').classList.remove('on');};
$('zoom').oninput=applyZoom; $('bg').onchange=drawBg;
$('undo').onclick=()=>{if(undoStack.length){ctx.putImageData(undoStack.pop(),0,0);}};
$('reset').onclick=()=>{if(cur)load(cur,[...$('list').children].find(b=>b.textContent===cur));};
$('save').onclick=()=>{if(!cur)return;$('status').textContent='saving…';
 // re-composite the edited crop back onto the FULL-size canvas at its original offset
 const full=document.createElement('canvas');full.width=fullW;full.height=fullH;
 full.getContext('2d').drawImage(cv,offX,offY);
 fetch('/save',{method:'POST',body:JSON.stringify({name:cur,png:full.toDataURL('image/png')})})
 .then(r=>r.json()).then(j=>{$('status').textContent=j.ok?('saved '+cur+' — now run `npm run rig:compress`'):('err '+(j.err||''));});};
drawBg();
</script></body></html>"""

if __name__ == "__main__":
    print(f"Gifty part editor → http://localhost:{args.port}  (editing {PARTS})")
    ThreadingHTTPServer(("127.0.0.1", args.port), H).serve_forever()
