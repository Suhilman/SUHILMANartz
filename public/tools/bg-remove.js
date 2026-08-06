/* =====================================================================
   Background Remover — cutout otomatis (flood-fill dari tepi) + edit
   manual (brush), resize, dan kompositing background baru.
   ===================================================================== */
'use strict';

const WORKER_SRC = String.raw`
const prog = (p,t) => self.postMessage({type:'progress',p:p,text:t});
function d2v(r0,g0,b0,r1,g1,b1){ const dr=r0-r1,dg=g0-g1,db=b0-b1; return dr*dr+dg*dg+db*db; }
self.onmessage = e => {
  try{
    const {data,width,height,target,tolerance,feather} = e.data;
    const px = new Uint8ClampedArray(data);
    const n = width*height;
    prog(0.05,'Menyiapkan…');

    let t = target;
    if(!t){
      let r=0,g=0,b=0,c=0;
      for(let x=0;x<width;x++){ for(const y of [0,height-1]){ const i=(y*width+x)*4; r+=px[i];g+=px[i+1];b+=px[i+2];c++; } }
      for(let y=0;y<height;y++){ for(const x of [0,width-1]){ const i=(y*width+x)*4; r+=px[i];g+=px[i+1];b+=px[i+2];c++; } }
      t=[r/c,g/c,b/c];
    }
    // kriteria hybrid: pixel harus (a) cukup dekat ke warna target GLOBAL, dan
    // (b) cukup dekat ke warna TETANGGA yang baru saja disapu — kombinasi ini
    // mencegah "kebocoran" flood-fill melewati tepi subjek yang warnanya
    // kebetulan mirip background, tanpa membutuhkan tepi background sempurna rata.
    const thr = (tolerance/100*260), thr2 = thr*thr;
    const localThr = thr*0.55, localThr2 = localThr*localThr;
    const okTarget = i => d2v(px[i],px[i+1],px[i+2], t[0],t[1],t[2]) <= thr2;

    prog(0.15,'Menyapu dari tepi…');
    const visited = new Uint8Array(n);
    const queue = new Int32Array(n);
    let qh=0, qt=0;
    const seed = (x,y) => {
      const idx=y*width+x, i=idx*4;
      if(!visited[idx] && okTarget(i)){ visited[idx]=1; queue[qt++]=idx; }
    };
    for(let x=0;x<width;x++){ seed(x,0); seed(x,height-1); }
    for(let y=0;y<height;y++){ seed(0,y); seed(width-1,y); }

    let steps=0;
    while(qh<qt){
      const idx=queue[qh++]; const x=idx%width, y=(idx-x)/width; const io=idx*4;
      const r0=px[io],g0=px[io+1],b0=px[io+2];
      const tryN = j => {
        if(visited[j]) return;
        const jo=j*4;
        if(okTarget(jo) && d2v(px[jo],px[jo+1],px[jo+2],r0,g0,b0)<=localThr2){ visited[j]=1; queue[qt++]=j; }
      };
      if(x>0) tryN(idx-1);
      if(x<width-1) tryN(idx+1);
      if(y>0) tryN(idx-width);
      if(y<height-1) tryN(idx+width);
      steps++; if((steps&65535)===0) prog(0.15+0.55*qh/n,'Menyapu dari tepi…');
    }

    prog(0.72,'Menghaluskan tepi…');
    // feather = jarak SPASIAL (piksel) ke area yang terhapus, bukan jarak warna —
    // supaya bagian subjek yang jauh dari tepi tidak ikut memudar hanya karena
    // warnanya kebetulan mirip background.
    const alpha = new Uint8ClampedArray(n).fill(255);
    for(let i=0;i<n;i++) if(visited[i]) alpha[i]=0;
    const featherPx = Math.max(0, Math.round(feather));
    if(featherPx>=1){
      const distArr = new Int16Array(n).fill(-1);
      const dq = new Int32Array(n); let dh=0, dt=0;
      for(let y=0;y<height;y++){
        for(let x=0;x<width;x++){
          const idx=y*width+x; if(!visited[idx]) continue;
          if(x>0 && !visited[idx-1] && distArr[idx-1]<0){ distArr[idx-1]=1; dq[dt++]=idx-1; }
          if(x<width-1 && !visited[idx+1] && distArr[idx+1]<0){ distArr[idx+1]=1; dq[dt++]=idx+1; }
          if(y>0 && !visited[idx-width] && distArr[idx-width]<0){ distArr[idx-width]=1; dq[dt++]=idx-width; }
          if(y<height-1 && !visited[idx+width] && distArr[idx+width]<0){ distArr[idx+width]=1; dq[dt++]=idx+width; }
        }
      }
      while(dh<dt){
        const idx=dq[dh++]; const d0=distArr[idx]; if(d0>=featherPx) continue;
        const x=idx%width, y=(idx-x)/width;
        if(x>0 && !visited[idx-1] && distArr[idx-1]<0){ distArr[idx-1]=d0+1; dq[dt++]=idx-1; }
        if(x<width-1 && !visited[idx+1] && distArr[idx+1]<0){ distArr[idx+1]=d0+1; dq[dt++]=idx+1; }
        if(y>0 && !visited[idx-width] && distArr[idx-width]<0){ distArr[idx-width]=d0+1; dq[dt++]=idx-width; }
        if(y<height-1 && !visited[idx+width] && distArr[idx+width]<0){ distArr[idx+width]=d0+1; dq[dt++]=idx+width; }
        if((dh&65535)===0) prog(0.72+0.18*dh/n,'Menghaluskan tepi…');
      }
      for(let i=0;i<n;i++){ if(visited[i]) continue; const d=distArr[i]; if(d>=1) alpha[i]=Math.round(255*Math.min(1,d/featherPx)); }
    }
    prog(0.95,'Menyusun hasil…');
    for(let i=0;i<n;i++) alpha[i] = (alpha[i]*px[i*4+3]/255)|0;
    self.postMessage({type:'done', buf:alpha.buffer, target:t}, [alpha.buffer]);
  }catch(err){ self.postMessage({type:'error', message:String(err&&err.message||err)}); }
};
`;

const $ = s => document.querySelector(s);
const has = s => !!document.querySelector(s);
const worker = new Worker(URL.createObjectURL(new Blob([WORKER_SRC], {type:'text/javascript'})));

const cvIn = $('#cvIn'), cvOut = $('#cvOut');
const ctxIn = cvIn.getContext('2d');
const ctxOut = cvOut.getContext('2d');
const vp = $('#vp'), drop = $('#drop'), dz = $('#dz');

let srcW = 0, srcH = 0, srcName = 'image';
let srcData = null;              // Uint8ClampedArray RGBA sumber, panjang srcW*srcH*4
let mask = null;                 // Uint8ClampedArray alpha, panjang srcW*srcH
let history = [];
let cutCv = document.createElement('canvas'), cutCtx = cutCv.getContext('2d');
let outW = 0, outH = 0, aspect = 1;
let bg = { mode:'transparent', color:'#ffffff', img:null, fit:'cover' };
let tool = 'pan', brushSize = 40, brushSoft = 10;
let sampleMode = 'auto', pickColor = null, picking = false;
let busy = false, hasImage = false;
let zoom = 1, panX = 0, panY = 0, compare = true, split = 0.5;
let painting = false, strokeSaved = false;

/* ---------- binding slider ↔ label ---------- */
function bindRange(id, out, fmt, onchange){
  const i = $('#'+id), o = $('#'+out);
  const upd = () => o.textContent = fmt(parseFloat(i.value));
  i.addEventListener('input', () => { upd(); onchange && onchange(); });
  upd();
}
bindRange('tol2','vTol2', v=>v);
bindRange('feather','vFeather', v=>v);
bindRange('brushSize','vBrush', v=>{ brushSize=v; return v+' px'; });
bindRange('brushSoft','vSoft', v=>{ brushSoft=v; return v; });

/* ---------- memuat file ---------- */
$('#file').onchange = e => { if(e.target.files[0]) loadFile(e.target.files[0]); e.target.value=''; };
['dragenter','dragover'].forEach(ev => vp.addEventListener(ev, e => {
  e.preventDefault(); drop.classList.add('over'); drop.style.display='flex'; }));
['dragleave','drop'].forEach(ev => vp.addEventListener(ev, e => {
  e.preventDefault(); drop.classList.remove('over'); if(hasImage) drop.style.display='none'; }));
vp.addEventListener('drop', e => { const f=e.dataTransfer.files[0]; if(f) loadFile(f); });
['dragenter','dragover'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); e.stopPropagation(); dz.classList.add('over'); }));
['dragleave','drop'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); e.stopPropagation(); dz.classList.remove('over'); }));
dz.addEventListener('drop', e => { const f=e.dataTransfer.files[0]; if(f) loadFile(f); });
window.addEventListener('paste', e => {
  for(const it of e.clipboardData.items) if(it.type.startsWith('image/')){ loadFile(it.getAsFile()); break; }
});

async function loadFile(file){
  err('');
  if(!file.type.startsWith('image/')) return err('File bukan gambar.');
  srcName = (file.name||'image').replace(/\.[^.]+$/,'');
  let img;
  try{
    const url = URL.createObjectURL(file);
    img = new Image();
    await new Promise((res,rej) => { img.onload=res; img.onerror=()=>rej(new Error('Gagal membaca gambar')); img.src=url; });
    URL.revokeObjectURL(url);
  }catch(e){ return err(e.message); }

  srcW = img.naturalWidth || 1024; srcH = img.naturalHeight || 1024;
  const c = document.createElement('canvas'); c.width=srcW; c.height=srcH;
  const cx = c.getContext('2d', {willReadFrequently:true});
  cx.drawImage(img,0,0,srcW,srcH);
  srcData = cx.getImageData(0,0,srcW,srcH).data;

  cvIn.width=srcW; cvIn.height=srcH; ctxIn.putImageData(new ImageData(new Uint8ClampedArray(srcData),srcW,srcH),0,0);
  cutCv.width=srcW; cutCv.height=srcH;
  mask = new Uint8ClampedArray(srcW*srcH).fill(255);
  history = [];
  outW = srcW; outH = srcH; aspect = srcW/srcH;
  $('#outW').value = outW; $('#outH').value = outH;

  $('#wrap').style.width = srcW+'px'; $('#wrap').style.height = srcH+'px';
  $('#fileInfo').textContent = srcName+' · '+srcW+'×'+srcH+' px';
  dz.classList.add('has'); $('#dzTitle').textContent = srcName;
  drop.style.display = 'none';
  hasImage = true; pickColor = null;
  $('#btnSave').disabled = false;
  fit();
  runCutout();
}

/* ---------- cutout otomatis (worker) ---------- */
function runCutout(){
  if(!hasImage || busy) return;
  busy = true; showOverlay(true,'Memproses cutout…',0);
  const buf = srcData.buffer.slice(0);
  worker.postMessage({
    type:'cutout', data: buf, width:srcW, height:srcH,
    target: pickColor, tolerance: +$('#tol2').value, feather: +$('#feather').value
  }, [buf]);
}
$('#btnCutout').onclick = runCutout;
worker.onmessage = e => {
  const m = e.data;
  if(m.type==='progress'){ showOverlay(true,m.text,m.p); return; }
  if(m.type==='error'){ busy=false; showOverlay(false); return err(m.message); }
  mask = new Uint8ClampedArray(m.buf);
  history = [];
  rebuildCut(); composite();
  busy = false; showOverlay(false);
};

/* ---------- sumber warna: otomatis / eyedropper ---------- */
function updateCursor(){
  vp.style.cursor = picking ? 'crosshair' : (tool==='pan' ? 'grab' : 'none');
  $('#brushcur').style.display = (!picking && tool!=='pan') ? 'block' : 'none';
}
document.querySelectorAll('#segSample button').forEach(b => b.onclick = () => {
  document.querySelectorAll('#segSample button').forEach(x=>x.classList.remove('on'));
  b.classList.add('on'); sampleMode = b.dataset.s;
  $('#pickHint').style.display = sampleMode==='pick' ? '' : 'none';
  if(sampleMode==='auto'){ pickColor=null; picking=false; } else picking = true;
  updateCursor();
});

/* ---------- alat edit (tool seg) ---------- */
document.querySelectorAll('#segTool button').forEach(b => b.onclick = () => {
  document.querySelectorAll('#segTool button').forEach(x=>x.classList.remove('on'));
  b.classList.add('on'); tool = b.dataset.tool;
  updateCursor();
});

/* ---------- undo ---------- */
$('#btnUndo').onclick = () => {
  if(!history.length) return;
  mask = history.pop();
  rebuildCut(); composite();
};
function pushHistory(){
  history.push(mask.slice());
  if(history.length>20) history.shift();
}

/* ---------- rebuild lapisan cutout & compositing ---------- */
function rebuildCut(){ updateCutRegion(0,0,srcW-1,srcH-1); }
function updateCutRegion(x0,y0,x1,y1){
  x0=Math.max(0,x0|0); y0=Math.max(0,y0|0); x1=Math.min(srcW-1,x1|0); y1=Math.min(srcH-1,y1|0);
  const w=x1-x0+1, h=y1-y0+1; if(w<=0||h<=0) return;
  const patch = cutCtx.createImageData(w,h);
  for(let y=0;y<h;y++){
    for(let x=0;x<w;x++){
      const si=(y0+y)*srcW+(x0+x), so=si*4, di=(y*w+x)*4;
      patch.data[di]=srcData[so]; patch.data[di+1]=srcData[so+1]; patch.data[di+2]=srcData[so+2];
      patch.data[di+3]=mask[si];
    }
  }
  cutCtx.putImageData(patch,x0,y0);
}

let rafPending = false;
function composite(){
  if(!hasImage || rafPending) return;
  rafPending = true;
  requestAnimationFrame(() => {
    rafPending = false;
    cvOut.width = outW; cvOut.height = outH;
    ctxOut.clearRect(0,0,outW,outH);
    if(bg.mode==='color'){ ctxOut.fillStyle = bg.color; ctxOut.fillRect(0,0,outW,outH); }
    else if(bg.mode==='image' && bg.img){ drawBgImage(ctxOut, bg.img, outW, outH, bg.fit); }
    ctxOut.imageSmoothingEnabled = true; ctxOut.imageSmoothingQuality = 'high';
    ctxOut.drawImage(cutCv,0,0,srcW,srcH,0,0,outW,outH);
    updateOutInfo();
  });
}
function drawBgImage(ctx,img,w,h,fit){
  const iw=img.naturalWidth, ih=img.naturalHeight;
  if(fit==='stretch'){ ctx.drawImage(img,0,0,w,h); return; }
  const s = fit==='cover' ? Math.max(w/iw,h/ih) : Math.min(w/iw,h/ih);
  const dw=iw*s, dh=ih*s;
  ctx.drawImage(img,(w-dw)/2,(h-dh)/2,dw,dh);
}

/* ---------- background: seg mode ---------- */
document.querySelectorAll('#segBg button').forEach(b => b.onclick = () => {
  document.querySelectorAll('#segBg button').forEach(x=>x.classList.remove('on'));
  b.classList.add('on'); bg.mode = b.dataset.bg;
  $('#bgColorRow').style.display = bg.mode==='color' ? '' : 'none';
  $('#bgImageRow').style.display = bg.mode==='image' ? '' : 'none';
  syncJpegOption(); composite();
});
$('#bgColor').oninput = e => { bg.color = e.target.value; composite(); };
$('#btnBgPick').onclick = () => $('#bgFile').click();
$('#bgFile').onchange = e => {
  const f = e.target.files[0]; if(!f) return;
  const url = URL.createObjectURL(f);
  const img = new Image();
  img.onload = () => {
    bg.img = img; $('#bgPrev').style.backgroundImage = 'url('+url+')';
    composite();
  };
  img.src = url;
  e.target.value = '';
};
$('#bgFit').onchange = e => { bg.fit = e.target.value; composite(); };
function syncJpegOption(){
  const jpegOpt = $('#fmt').querySelector('option[value="image/jpeg"]');
  jpegOpt.disabled = bg.mode==='transparent';
  if(bg.mode==='transparent' && $('#fmt').value==='image/jpeg') $('#fmt').value='image/png';
}

/* ---------- resize output ---------- */
let lockAspect = true;
$('#lockAspect').addEventListener('change', e => lockAspect = e.target.checked);
$('#outW').addEventListener('input', () => {
  outW = Math.max(1, Math.round(+$('#outW').value || srcW));
  if(lockAspect){ outH = Math.round(outW/aspect); $('#outH').value = outH; } else outH = Math.max(1, Math.round(+$('#outH').value||srcH));
  composite();
});
$('#outH').addEventListener('input', () => {
  outH = Math.max(1, Math.round(+$('#outH').value || srcH));
  if(lockAspect){ outW = Math.round(outH*aspect); $('#outW').value = outW; } else outW = Math.max(1, Math.round(+$('#outW').value||srcW));
  composite();
});
document.querySelectorAll('.pct-row button').forEach(b => b.onclick = () => {
  const p = +b.dataset.pct/100;
  outW = Math.max(1, Math.round(srcW*p)); outH = Math.max(1, Math.round(srcH*p));
  $('#outW').value = outW; $('#outH').value = outH;
  composite();
});

/* ---------- brush painting ---------- */
function imgCoords(clientX, clientY){
  const r = vp.getBoundingClientRect();
  return [ (clientX-r.left-panX)/zoom, (clientY-r.top-panY)/zoom ];
}
function paintAt(ix,iy){
  const rad = brushSize/2, soft = brushSoft, rr = rad+soft;
  const x0=Math.floor(ix-rr), x1=Math.ceil(ix+rr), y0=Math.floor(iy-rr), y1=Math.ceil(iy+rr);
  const cx0=Math.max(0,x0), cy0=Math.max(0,y0), cx1=Math.min(srcW-1,x1), cy1=Math.min(srcH-1,y1);
  const target = tool==='erase' ? 0 : 255;
  for(let y=cy0;y<=cy1;y++){
    for(let x=cx0;x<=cx1;x++){
      const d = Math.hypot(x-ix,y-iy);
      if(d>rr) continue;
      let strength = 1;
      if(d>rad && soft>0.01) strength = Math.max(0, 1-(d-rad)/soft);
      const idx = y*srcW+x;
      mask[idx] = mask[idx] + (target-mask[idx])*strength;
    }
  }
  updateCutRegion(cx0,cy0,cx1,cy1);
  composite();
}
vp.addEventListener('pointerdown', e => {
  if(e.target.closest('#floatPanel')) return;
  const [ix,iy] = imgCoords(e.clientX,e.clientY);
  if(picking){
    if(ix>=0&&iy>=0&&ix<srcW&&iy<srcH){
      const i=((iy|0)*srcW+(ix|0))*4;
      pickColor = [srcData[i],srcData[i+1],srcData[i+2]];
      picking = false; updateCursor();
      runCutout();
    }
    return;
  }
  if(tool==='pan'){
    dragging = true; lx=e.clientX; ly=e.clientY; vp.classList.add('drag'); vp.setPointerCapture(e.pointerId);
    return;
  }
  if(!hasImage) return;
  painting = true; strokeSaved = false;
  vp.setPointerCapture(e.pointerId);
  if(!strokeSaved){ pushHistory(); strokeSaved = true; }
  paintAt(ix,iy);
});
vp.addEventListener('pointermove', e => {
  const [ix,iy] = imgCoords(e.clientX,e.clientY);
  if(tool!=='pan'){
    const r = vp.getBoundingClientRect();
    const cur = $('#brushcur');
    cur.style.display='block';
    cur.style.left=(e.clientX-r.left)+'px'; cur.style.top=(e.clientY-r.top)+'px';
    cur.style.width=cur.style.height=(brushSize*zoom)+'px';
  }
  if(painting && hasImage) paintAt(ix,iy);
  if(dragging){ panX += e.clientX-lx; panY += e.clientY-ly; lx=e.clientX; ly=e.clientY; applyView(); }
});
vp.addEventListener('pointerup', () => { painting=false; dragging=false; vp.classList.remove('drag'); });
vp.addEventListener('pointerleave', () => { $('#brushcur').style.display='none'; });
vp.addEventListener('wheel', e => {
  if(!hasImage || e.target.closest('#floatPanel')) return; e.preventDefault();
  const r = vp.getBoundingClientRect();
  zoomAt(Math.exp(-e.deltaY*0.0016), e.clientX-r.left, e.clientY-r.top);
}, {passive:false});

/* ---------- viewport: zoom / pan / compare ---------- */
let dragging=false, lx=0, ly=0;
function applyView(){
  $('#wrap').style.transform = 'translate('+panX+'px,'+panY+'px) scale('+zoom+')';
  $('#zoomLbl').textContent = Math.round(zoom*100)+'%';
}
function fit(){
  const r = vp.getBoundingClientRect();
  zoom = Math.min((r.width-40)/srcW, (r.height-40)/srcH, 8);
  panX = (r.width-srcW*zoom)/2; panY = (r.height-srcH*zoom)/2; applyView();
}
function zoomAt(f,cx,cy){
  const z2 = Math.min(32, Math.max(0.02, zoom*f));
  panX = cx-(cx-panX)*(z2/zoom); panY = cy-(cy-panY)*(z2/zoom);
  zoom = z2; applyView();
}
$('#btnZoomIn').onclick = () => { const r=vp.getBoundingClientRect(); zoomAt(1.25,r.width/2,r.height/2); };
$('#btnZoomOut').onclick = () => { const r=vp.getBoundingClientRect(); zoomAt(0.8,r.width/2,r.height/2); };
$('#btnFit').onclick = () => hasImage && fit();
$('#btn100').onclick = () => { const r=vp.getBoundingClientRect();
  panX += (r.width/2-panX)*(1-1/zoom); panY += (r.height/2-panY)*(1-1/zoom); zoom=1; applyView(); };
$('#btnCompare').onclick = () => {
  compare = !compare;
  $('#btnCompare').classList.toggle('on', compare);
  $('#handle').classList.toggle('hide', !compare);
  $('#bl').style.display = compare ? '' : 'none';
  $('#br').style.display = compare ? '' : 'none';
  setSplit(compare ? split : 0);
};
function setSplit(v){ split=Math.min(1,Math.max(0,v)); $('#wrap').style.setProperty('--split',(split*100)+'%'); }
setSplit(0.5);
let hDrag=false;
$('#handle').addEventListener('pointerdown', e => { hDrag=true; e.stopPropagation(); $('#handle').setPointerCapture(e.pointerId); });
$('#handle').addEventListener('pointermove', e => { if(!hDrag) return; const r=$('#wrap').getBoundingClientRect(); setSplit((e.clientX-r.left)/r.width); });
$('#handle').addEventListener('pointerup', () => hDrag=false);
$('#btnMin').onclick = () => {
  const p = $('#floatPanel'); p.classList.toggle('min');
  $('#btnMin').textContent = p.classList.contains('min') ? '+' : '–';
};
window.addEventListener('resize', () => { if(hasImage) applyView(); });

/* ---------- reset ---------- */
$('#btnReset').onclick = () => {
  if(!hasImage) return;
  $('#tol2').value=35; $('#vTol2').textContent='35';
  $('#feather').value=12; $('#vFeather').textContent='12';
  document.querySelectorAll('#segSample button').forEach(b=>b.classList.toggle('on', b.dataset.s==='auto'));
  sampleMode='auto'; pickColor=null; picking=false;
  document.querySelectorAll('#segTool button').forEach(b=>b.classList.toggle('on', b.dataset.tool==='pan'));
  tool='pan'; updateCursor();
  $('#brushSize').value=40; $('#vBrush').textContent='40 px';
  $('#brushSoft').value=10; $('#vSoft').textContent='10';
  outW=srcW; outH=srcH; $('#outW').value=outW; $('#outH').value=outH;
  document.querySelectorAll('#segBg button').forEach(b=>b.classList.toggle('on', b.dataset.bg==='transparent'));
  bg = {mode:'transparent', color:'#ffffff', img:null, fit:'cover'};
  $('#bgColorRow').style.display='none'; $('#bgImageRow').style.display='none';
  syncJpegOption();
  runCutout();
};

/* ---------- ekspor ---------- */
$('#btnSave').onclick = () => {
  const fmt = $('#fmt').value, q = Math.min(100,Math.max(1,+$('#q').value))/100;
  if(fmt==='image/jpeg'){
    const tmp = document.createElement('canvas'); tmp.width=outW; tmp.height=outH;
    const tctx = tmp.getContext('2d');
    tctx.fillStyle = '#ffffff'; tctx.fillRect(0,0,outW,outH);
    tctx.drawImage(cvOut,0,0);
    tmp.toBlob(b => b ? dl(b, srcName+'-nobg.jpg') : err('Gagal encode.'), fmt, q);
    return;
  }
  cvOut.toBlob(b => {
    if(!b) return err('Gagal encode. Coba format lain.');
    const ext = fmt==='image/png' ? 'png' : 'webp';
    dl(b, srcName+'-nobg.'+ext);
  }, fmt, q);
};
function dl(blob,name){
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),4000);
}

/* ---------- lain-lain ---------- */
function updateOutInfo(){
  if(!hasImage){ $('#outInfo').textContent=''; return; }
  $('#outInfo').textContent = 'Output: '+outW+'×'+outH+' px ('+(outW*outH/1e6).toFixed(1)+' MP)';
  $('#dims').textContent = srcW+'×'+srcH+'  →  '+outW+'×'+outH;
}
function showOverlay(on,txt,p){
  $('#ov').classList.toggle('on', !!on);
  if(txt) $('#ovTxt').textContent = txt;
  if(p!=null) $('#ovBar').style.width = Math.round(p*100)+'%';
}
function err(m){ $('#err').textContent = m||''; }
