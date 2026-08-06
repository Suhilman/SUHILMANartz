/* =====================================================================
   Vectorize worker source — ported verbatim (byte-for-byte, algorithmic
   code only) from image-studio/engine.js's WORKER_SRC template literal,
   trimmed to only the 'vector' mode slice: vectorize(msg) plus its
   helper functions (medianCut, traceMask, rdp, areaOf, pathStr, and the
   gaussPlane blur helper used for the pre-blur step). The 'enhance'
   mode code (mkKernel/weights/resample/bilateral/sharpen/enhance) is
   intentionally omitted — this page never sends {type:'enhance'}.
   ===================================================================== */
const WORKER_SRC = String.raw`
'use strict';
const prog = (p,t) => self.postMessage({type:'progress',p:p,text:t});

/* gaussian separable pada satu channel (stride 4) */
function gaussPlane(src, w, h, sigma, ch){
  const n=w*h, out=new Float32Array(n), tmp=new Float32Array(n);
  if(sigma<=0.01){ for(let i=0;i<n;i++) out[i]=src[i*4+ch]; return out; }
  const r=Math.max(1,Math.ceil(sigma*3)), ker=new Float32Array(2*r+1); let s=0;
  for(let i=-r;i<=r;i++){ const v=Math.exp(-(i*i)/(2*sigma*sigma)); ker[i+r]=v; s+=v; }
  for(let i=0;i<ker.length;i++) ker[i]/=s;
  for(let y=0;y<h;y++) for(let x=0;x<w;x++){
    let a=0; for(let i=-r;i<=r;i++){ let px=x+i; px=px<0?0:(px>=w?w-1:px);
      a+=src[(y*w+px)*4+ch]*ker[i+r]; }
    tmp[y*w+x]=a;
  }
  for(let y=0;y<h;y++) for(let x=0;x<w;x++){
    let a=0; for(let i=-r;i<=r;i++){ let py=y+i; py=py<0?0:(py>=h?h-1:py);
      a+=tmp[py*w+x]*ker[i+r]; }
    out[y*w+x]=a;
  }
  return out;
}
/* ---------- VECTORIZE ---------- */
function medianCut(px,n,k){
  const pts=[]; const step=Math.max(1,Math.floor(n/60000));
  for(let i=0;i<n;i+=step) if(px[i*4+3]>128) pts.push([px[i*4],px[i*4+1],px[i*4+2]]);
  if(!pts.length) return [[0,0,0]];
  let boxes=[pts];
  while(boxes.length<k){
    let bi=-1,bv=-1;
    for(let i=0;i<boxes.length;i++){
      const b=boxes[i]; if(b.length<2) continue;
      let mn=[255,255,255],mx=[0,0,0];
      for(const p of b) for(let c=0;c<3;c++){ if(p[c]<mn[c])mn[c]=p[c]; if(p[c]>mx[c])mx[c]=p[c]; }
      const v=Math.max(mx[0]-mn[0],mx[1]-mn[1],mx[2]-mn[2])*b.length;
      if(v>bv){bv=v;bi=i;}
    }
    if(bi<0) break;
    const b=boxes[bi]; let mn=[255,255,255],mx=[0,0,0];
    for(const p of b) for(let c=0;c<3;c++){ if(p[c]<mn[c])mn[c]=p[c]; if(p[c]>mx[c])mx[c]=p[c]; }
    let ch=0,best=-1; for(let c=0;c<3;c++) if(mx[c]-mn[c]>best){best=mx[c]-mn[c];ch=c;}
    b.sort((p,q)=>p[ch]-q[ch]);
    const m=b.length>>1;
    boxes.splice(bi,1,b.slice(0,m),b.slice(m));
  }
  return boxes.filter(b=>b.length).map(b=>{
    let r=0,g=0,bb=0; for(const p of b){r+=p[0];g+=p[1];bb+=p[2];}
    return [Math.round(r/b.length),Math.round(g/b.length),Math.round(bb/b.length)];
  });
}
/* jejak batas pixel mask -> daftar loop titik lattice */
function traceMask(mask,w,h){
  const map=new Map(), key=(x,y)=>y*(w+2)+x;
  const add=(x1,y1,x2,y2)=>{ const k=key(x1,y1); let a=map.get(k); if(!a){a=[];map.set(k,a);} a.push([x2,y2]); };
  for(let y=0;y<h;y++) for(let x=0;x<w;x++){
    if(!mask[y*w+x]) continue;
    if(x===0     || !mask[y*w+x-1]) add(x,y+1,x,y);
    if(x===w-1   || !mask[y*w+x+1]) add(x+1,y,x+1,y+1);
    if(y===0     || !mask[(y-1)*w+x]) add(x,y,x+1,y);
    if(y===h-1   || !mask[(y+1)*w+x]) add(x+1,y+1,x,y+1);
  }
  const loops=[];
  for(const k0 of Array.from(map.keys())){
    while(true){
      const arr=map.get(k0); if(!arr||!arr.length) break;
      let sx=k0%(w+2), sy=(k0-sx)/(w+2);
      const loop=[[sx,sy]]; let cx=sx,cy=sy;
      while(true){
        const a=map.get(key(cx,cy)); if(!a||!a.length) break;
        const nx=a.pop();
        cx=nx[0]; cy=nx[1];
        if(cx===sx&&cy===sy) break;
        loop.push([cx,cy]);
      }
      if(loop.length>3) loops.push(loop);
    }
  }
  return loops;
}
function rdp(pts,eps){
  if(pts.length<4) return pts;
  const keep=new Uint8Array(pts.length); keep[0]=1; keep[pts.length-1]=1;
  const st=[[0,pts.length-1]];
  while(st.length){
    const [a,b]=st.pop(); if(b-a<2) continue;
    const ax=pts[a][0],ay=pts[a][1],bx=pts[b][0],by=pts[b][1];
    const dx=bx-ax,dy=by-ay,len=Math.hypot(dx,dy)||1;
    let mi=-1,md=-1;
    for(let i=a+1;i<b;i++){
      const d=Math.abs((pts[i][0]-ax)*dy-(pts[i][1]-ay)*dx)/len;
      if(d>md){md=d;mi=i;}
    }
    if(md>eps){ keep[mi]=1; st.push([a,mi],[mi,b]); }
  }
  return pts.filter((_,i)=>keep[i]);
}
function areaOf(p){ let a=0; for(let i=0,n=p.length;i<n;i++){ const q=p[(i+1)%n]; a+=p[i][0]*q[1]-q[0]*p[i][1]; } return a/2; }
function pathStr(loops,sc,smooth,q){
  const f=v=>{ const r=Math.round(v*q)/q; return String(r); };
  let d='';
  for(const lp of loops){
    const p=lp.map(pt=>[pt[0]/sc,pt[1]/sc]);
    if(!smooth || p.length<4){
      d+='M'+f(p[0][0])+' '+f(p[0][1]);
      for(let i=1;i<p.length;i++) d+='L'+f(p[i][0])+' '+f(p[i][1]);
      d+='Z';
    } else {
      const mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
      let m0=mid(p[p.length-1],p[0]);
      d+='M'+f(m0[0])+' '+f(m0[1]);
      for(let i=0;i<p.length;i++){
        const c=p[i], nx=p[(i+1)%p.length], m=mid(c,nx);
        d+='Q'+f(c[0])+' '+f(c[1])+' '+f(m[0])+' '+f(m[1]);
      }
      d+='Z';
    }
  }
  return d;
}
function vectorize(msg){
  const {data,width,height,colors,vblur,tol,minArea,smooth,vscale}=msg;
  prog(0.05,'Menyiapkan…');
  const src=new Uint8ClampedArray(data);
  let px=src;
  if(vblur>0.05){
    const f=new Float32Array(width*height*4);
    for(let i=0;i<f.length;i++) f[i]=src[i];
    const o=new Uint8ClampedArray(width*height*4);
    for(let ch=0;ch<4;ch++){ const g=gaussPlane(f,width,height,vblur,ch);
      for(let i=0,n=width*height;i<n;i++) o[i*4+ch]=g[i]; }
    px=o;
  }
  prog(0.15,'Kuantisasi warna…');
  const pal=medianCut(px,width*height,colors);
  const sc=vscale, W=width*sc, H=height*sc;
  const lbl=new Int16Array(W*H); const counts=new Int32Array(pal.length);
  for(let y=0;y<H;y++){
    const sy=(y/sc)|0;
    for(let x=0;x<W;x++){
      const sx=(x/sc)|0, p=(sy*width+sx)*4;
      if(px[p+3]<128){ lbl[y*W+x]=-1; continue; }
      let bi=0,bd=1e9;
      for(let i=0;i<pal.length;i++){
        const dr=px[p]-pal[i][0], dg=px[p+1]-pal[i][1], db=px[p+2]-pal[i][2];
        const d=dr*dr*0.299+dg*dg*0.587+db*db*0.114;
        if(d<bd){bd=d;bi=i;}
      }
      lbl[y*W+x]=bi; counts[bi]++;
    }
    if((y&127)===0) prog(0.15+0.3*y/H,'Memetakan warna…');
  }
  const order=pal.map((c,i)=>i).filter(i=>counts[i]>0).sort((a,b)=>counts[b]-counts[a]);
  const mask=new Uint8Array(W*H);
  const parts=[]; let done=0;
  const minA=minArea*sc*sc;
  for(const ci of order){
    for(let i=0;i<W*H;i++) mask[i]=lbl[i]===ci?1:0;
    let loops=traceMask(mask,W,H);
    loops=loops.filter(lp=>Math.abs(areaOf(lp))>=minA).map(lp=>rdp(lp,tol*sc*0.5));
    loops=loops.filter(lp=>lp.length>2);
    if(loops.length){
      const c=pal[ci];
      const hex='#'+((1<<24)+(c[0]<<16)+(c[1]<<8)+c[2]).toString(16).slice(1);
      parts.push('<path fill="'+hex+'" fill-rule="nonzero" d="'+pathStr(loops,sc,smooth,10)+'"/>');
    }
    done++; prog(0.45+0.5*done/order.length,'Tracing layer '+done+'/'+order.length+'…');
  }
  const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+width+' '+height+
    '" width="'+width+'" height="'+height+'" shape-rendering="geometricPrecision">\n'+
    parts.join('\n')+'\n</svg>';
  self.postMessage({type:'vector',svg:svg,w:width,h:height,paths:parts.length,colors:order.length});
}

self.onmessage = e => {
  try{
    if(e.data.type==='vector') vectorize(e.data);
  }catch(err){ self.postMessage({type:'error',message:String(err&&err.message||err)}); }
};
`;

export default WORKER_SRC;
