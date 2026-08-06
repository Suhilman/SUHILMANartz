/* =====================================================================
   Image Studio — mesin bersama untuk enhance.html & vectorize.html
   Halaman pemanggil wajib menetapkan window.MODE = 'enhance' | 'vector'
   sebelum memuat file ini.
   ===================================================================== */
'use strict';

/* ---------------------------------------------------------------------
   WORKER — semua komputasi berat berjalan di thread terpisah
   --------------------------------------------------------------------- */
const WORKER_SRC = String.raw`
'use strict';
const S2L = new Float32Array(256), L2S = new Uint8Array(4096);
for (let i=0;i<256;i++){ const c=i/255; S2L[i] = c<=0.04045 ? c/12.92 : Math.pow((c+0.055)/1.055,2.4); }
for (let i=0;i<4096;i++){ const l=i/4095; const s = l<=0.0031308 ? l*12.92 : 1.055*Math.pow(l,1/2.4)-0.055;
  L2S[i] = Math.max(0,Math.min(255,Math.round(s*255))); }
const l2s = v => L2S[v<=0?0:(v>=1?4095:(v*4095)|0)];
const prog = (p,t) => self.postMessage({type:'progress',p:p,text:t});

/* ---- kernel resampling ---- */
function mkKernel(name){
  if(name==='lanczos2') return {r:2,f:x=>{ if(x===0)return 1; if(x>=2)return 0;
    const px=Math.PI*x; return 2*Math.sin(px)*Math.sin(px/2)/(px*px); }};
  if(name==='mitchell') return {r:2,f:x=>{ const B=1/3,C=1/3; x=Math.abs(x); const x2=x*x;
    if(x<1) return ((12-9*B-6*C)*x*x2+(-18+12*B+6*C)*x2+(6-2*B))/6;
    if(x<2) return ((-B-6*C)*x*x2+(6*B+30*C)*x2+(-12*B-48*C)*x+(8*B+24*C))/6; return 0; }};
  if(name==='catrom') return {r:2,f:x=>{ x=Math.abs(x); const x2=x*x;
    if(x<1) return 1.5*x*x2-2.5*x2+1;
    if(x<2) return -0.5*x*x2+2.5*x2-4*x+2; return 0; }};
  return {r:3,f:x=>{ if(x===0)return 1; const a=Math.abs(x); if(a>=3)return 0;
    const px=Math.PI*a; return 3*Math.sin(px)*Math.sin(px/3)/(px*px); }};
}
function weights(srcLen, dstLen, k){
  const scale = dstLen/srcLen, sup = scale<1 ? k.r/scale : k.r, taps = Math.ceil(sup*2)+2;
  const idx = new Int32Array(dstLen*taps), w = new Float32Array(dstLen*taps), n = new Int32Array(dstLen);
  for(let i=0;i<dstLen;i++){
    const center = (i+0.5)/scale - 0.5;
    let a = Math.ceil(center-sup), b = Math.floor(center+sup), c=0, sum=0;
    const off=i*taps;
    for(let j=a;j<=b;j++){
      let v = k.f(scale<1 ? (j-center)*scale : (j-center));
      if(v===0) continue;
      let p = j<0?0:(j>=srcLen?srcLen-1:j);
      idx[off+c]=p; w[off+c]=v; sum+=v; c++;
      if(c>=taps) break;
    }
    if(sum!==0) for(let t=0;t<c;t++) w[off+t]/=sum;
    n[i]=c;
  }
  return {idx:idx,w:w,n:n,taps:taps};
}
function resample(src, sw, sh, dw, dh, kname){
  if(sw===dw && sh===dh) return src;
  const k=mkKernel(kname);
  const wx=weights(sw,dw,k), wy=weights(sh,dh,k);
  const tmp=new Float32Array(dw*sh*4);
  for(let y=0;y<sh;y++){
    const sr=y*sw*4, dr=y*dw*4;
    for(let x=0;x<dw;x++){
      const off=x*wx.taps, n=wx.n[x]; let r=0,g=0,b=0,a=0;
      for(let t=0;t<n;t++){ const p=sr+wx.idx[off+t]*4, ww=wx.w[off+t];
        r+=src[p]*ww; g+=src[p+1]*ww; b+=src[p+2]*ww; a+=src[p+3]*ww; }
      const d=dr+x*4; tmp[d]=r; tmp[d+1]=g; tmp[d+2]=b; tmp[d+3]=a;
    }
    if((y&63)===0) prog(0.15+0.25*y/sh,'Resampling…');
  }
  const out=new Float32Array(dw*dh*4);
  for(let y=0;y<dh;y++){
    const off=y*wy.taps, n=wy.n[y], dr=y*dw*4;
    for(let x=0;x<dw;x++){
      let r=0,g=0,b=0,a=0;
      for(let t=0;t<n;t++){ const p=(wy.idx[off+t]*dw+x)*4, ww=wy.w[off+t];
        r+=tmp[p]*ww; g+=tmp[p+1]*ww; b+=tmp[p+2]*ww; a+=tmp[p+3]*ww; }
      const d=dr+x*4; out[d]=r; out[d+1]=g; out[d+2]=b; out[d+3]=a;
    }
    if((y&63)===0) prog(0.4+0.2*y/dh,'Resampling…');
  }
  return out;
}
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
/* box blur 3x ~= gaussian; untuk sigma besar (local contrast) */
function boxBlurPlane(src,w,h,sigma,ch){
  const n=w*h; let a=new Float32Array(n), b=new Float32Array(n);
  for(let i=0;i<n;i++) a[i]=src[i*4+ch];
  const bw=Math.max(1,Math.round(sigma*0.9));
  for(let pass=0;pass<3;pass++){
    for(let y=0;y<h;y++){
      const row=y*w; let sum=0;
      for(let i=-bw;i<=bw;i++){ let p=i<0?0:(i>=w?w-1:i); sum+=a[row+p]; }
      const inv=1/(2*bw+1);
      for(let x=0;x<w;x++){
        b[row+x]=sum*inv;
        let ad=x+bw+1, rm=x-bw; ad=ad>=w?w-1:ad; rm=rm<0?0:rm;
        sum+=a[row+ad]-a[row+rm];
      }
    }
    for(let x=0;x<w;x++){
      let sum=0;
      for(let i=-bw;i<=bw;i++){ let p=i<0?0:(i>=h?h-1:i); sum+=b[p*w+x]; }
      const inv=1/(2*bw+1);
      for(let y=0;y<h;y++){
        a[y*w+x]=sum*inv;
        let ad=y+bw+1, rm=y-bw; ad=ad>=h?h-1:ad; rm=rm<0?0:rm;
        sum+=b[ad*w+x]-b[rm*w+x];
      }
    }
  }
  return a;
}
/* bilateral filter — denoise yang mempertahankan tepi */
function bilateral(buf,w,h,strength){
  const r = strength>66?3:(strength>33?2:1);
  const ss = r*0.8, sr = 0.015 + 0.16*(strength/100);
  const sw2 = 2*ss*ss, sr2 = 2*sr*sr;
  const out=new Float32Array(buf.length);
  const gs=new Float32Array((2*r+1)*(2*r+1));
  for(let dy=-r,i=0;dy<=r;dy++) for(let dx=-r;dx<=r;dx++,i++) gs[i]=Math.exp(-(dx*dx+dy*dy)/sw2);
  for(let y=0;y<h;y++){
    for(let x=0;x<w;x++){
      const c=(y*w+x)*4, lc=0.2126*buf[c]+0.7152*buf[c+1]+0.0722*buf[c+2];
      let ar=0,ag=0,ab=0,wsum=0,i=0;
      for(let dy=-r;dy<=r;dy++){
        let py=y+dy; if(py<0)py=0; else if(py>=h)py=h-1;
        for(let dx=-r;dx<=r;dx++,i++){
          let px=x+dx; if(px<0)px=0; else if(px>=w)px=w-1;
          const p=(py*w+px)*4, lp=0.2126*buf[p]+0.7152*buf[p+1]+0.0722*buf[p+2];
          const d=lp-lc, ww=gs[i]*Math.exp(-(d*d)/sr2);
          ar+=buf[p]*ww; ag+=buf[p+1]*ww; ab+=buf[p+2]*ww; wsum+=ww;
        }
      }
      out[c]=ar/wsum; out[c+1]=ag/wsum; out[c+2]=ab/wsum; out[c+3]=buf[c+3];
    }
    if((y&31)===0) prog(0.05+0.1*y/h,'Reduksi noise…');
  }
  return out;
}
function sharpen(buf,w,h,amount,radius,threshold,clarity){
  if(amount<=0 && clarity<=0) return buf;
  const thr = threshold/255;
  if(amount>0){
    prog(0.65,'Menajamkan…');
    const A=amount/100;
    for(let ch=0;ch<3;ch++){
      const blur=gaussPlane(buf,w,h,radius,ch);
      for(let i=0,n=w*h;i<n;i++){
        const v=buf[i*4+ch], d=v-blur[i];
        if(Math.abs(d)>thr) buf[i*4+ch]=v+A*d;
      }
    }
  }
  if(clarity>0){
    prog(0.8,'Local contrast…');
    const C=clarity/100*0.7, sg=Math.max(4,Math.min(w,h)/60);
    for(let ch=0;ch<3;ch++){
      const blur=boxBlurPlane(buf,w,h,sg,ch);
      for(let i=0,n=w*h;i<n;i++){ const v=buf[i*4+ch]; buf[i*4+ch]=v+C*(v-blur[i]); }
    }
  }
  return buf;
}
/* ---------- ENHANCE ---------- */
function enhance(msg){
  const {data,width,height,dw,dh,kernel,denoise,amount,radius,thresh,clarity,sat,con,exp} = msg;
  prog(0.02,'Menyiapkan…');
  const px=new Uint8ClampedArray(data);
  let buf=new Float32Array(width*height*4);
  for(let i=0,n=width*height;i<n;i++){
    const a=px[i*4+3]/255;
    buf[i*4]  = S2L[px[i*4]]*a;
    buf[i*4+1]= S2L[px[i*4+1]]*a;
    buf[i*4+2]= S2L[px[i*4+2]]*a;
    buf[i*4+3]= a;
  }
  if(denoise>0) buf=bilateral(buf,width,height,denoise);
  buf=resample(buf,width,height,dw,dh,kernel);
  buf=sharpen(buf,dw,dh,amount,radius,thresh,clarity);

  prog(0.9,'Menyusun output…');
  const E=Math.pow(2,exp/100), Cc=con/100, Sc=1+sat/100;
  const out=new Uint8ClampedArray(dw*dh*4);
  for(let i=0,n=dw*dh;i<n;i++){
    let a=buf[i*4+3]; if(a<1e-6){ out[i*4+3]=0; continue; }
    let r=buf[i*4]/a*E, g=buf[i*4+1]/a*E, b=buf[i*4+2]/a*E;
    r=r<0?0:(r>1?1:r); g=g<0?0:(g>1?1:g); b=b<0?0:(b>1?1:b);
    let R=l2s(r)/255, G=l2s(g)/255, B=l2s(b)/255;
    if(Cc!==0){ const k=Cc>0?1/(1-Cc*0.9):1+Cc;
      R=(R-0.5)*k+0.5; G=(G-0.5)*k+0.5; B=(B-0.5)*k+0.5; }
    if(Sc!==1){ const L=0.2126*R+0.7152*G+0.0722*B;
      R=L+(R-L)*Sc; G=L+(G-L)*Sc; B=L+(B-L)*Sc; }
    out[i*4]=R*255; out[i*4+1]=G*255; out[i*4+2]=B*255; out[i*4+3]=a*255;
  }
  self.postMessage({type:'enhance',buf:out.buffer,w:dw,h:dh},[out.buffer]);
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
    if(e.data.type==='enhance') enhance(e.data);
    else if(e.data.type==='vector') vectorize(e.data);
  }catch(err){ self.postMessage({type:'error',message:String(err&&err.message||err)}); }
};
`;

/* ---------------------------------------------------------------------
   UI
   --------------------------------------------------------------------- */
const MODE = window.MODE === 'vector' ? 'vector' : 'enhance';
const $ = s => document.querySelector(s);
const has = s => !!document.querySelector(s);
const worker = new Worker(URL.createObjectURL(new Blob([WORKER_SRC], {type:'text/javascript'})));

const cvIn = $('#cvIn'), cvOut = $('#cvOut');
const ctxIn = cvIn.getContext('2d'), ctxOut = cvOut.getContext('2d');
let srcImgData = null, srcW = 0, srcH = 0, srcName = 'image';
let outW = 0, outH = 0, lastSVG = null;
let busy = false, pending = false, processed = false;
let zoom = 1, panX = 0, panY = 0, compare = true, split = 0.5;

/* ---------- pengikat slider ↔ label ---------- */
function bind(id, out, fmt){
  if(!has('#'+id)) return;
  const i = $('#'+id), o = $('#'+out);
  const upd = () => o.textContent = fmt(parseFloat(i.value));
  i.addEventListener('input', () => { upd(); scheduleRun(); });
  upd();
}
bind('scale','vScale', v=>v.toFixed(2)+'×');
bind('denoise','vDen', v=>v);
bind('amount','vAmt', v=>v);
bind('radius','vRad', v=>v.toFixed(1)+' px');
bind('thresh','vThr', v=>v);
bind('clarity','vClar', v=>v);
bind('sat','vSat', v=>v);
bind('con','vCon', v=>v);
bind('exp','vExp', v=>v);
bind('colors','vCols', v=>v);
bind('vblur','vVb', v=>v.toFixed(1)+' px');
bind('tol','vTol', v=>v.toFixed(1));
bind('minArea','vMin', v=>v+' px²');
['kernel','vscale','smooth'].forEach(id => has('#'+id) && $('#'+id).addEventListener('change', scheduleRun));

if(has('#scale')) $('#scale').addEventListener('input', () => {
  document.querySelectorAll('#segScale button').forEach(b =>
    b.classList.toggle('on', parseFloat(b.dataset.s) === parseFloat($('#scale').value)));
  updateOutInfo();
});
document.querySelectorAll('#segScale button').forEach(b => b.onclick = () => {
  document.querySelectorAll('#segScale button').forEach(x => x.classList.remove('on'));
  b.classList.add('on');
  $('#scale').value = b.dataset.s; $('#vScale').textContent = parseFloat(b.dataset.s).toFixed(2)+'×';
  updateOutInfo(); scheduleRun();
});

/* ---------- preset (khusus enhance) ---------- */
const PRESETS = {
  foto:   {kernel:'lanczos3', amount:55,  radius:1.0, thresh:3, clarity:18, denoise:0,  sat:0, con:0, exp:0},
  detail: {kernel:'lanczos3', amount:95,  radius:0.8, thresh:2, clarity:32, denoise:8,  sat:4, con:5, exp:0},
  jpeg:   {kernel:'lanczos3', amount:60,  radius:1.2, thresh:8, clarity:14, denoise:45, sat:0, con:0, exp:0},
  art:    {kernel:'lanczos2', amount:80,  radius:0.6, thresh:0, clarity:8,  denoise:0,  sat:0, con:6, exp:0},
  text:   {kernel:'catrom',   amount:120, radius:0.5, thresh:0, clarity:0,  denoise:0,  sat:0, con:10,exp:0}
};
let quiet = false;
function setVals(obj){
  quiet = true;
  for(const k in obj){
    if(!has('#'+k)) continue;
    const el = $('#'+k);
    if(el.type === 'checkbox') el.checked = obj[k];
    else { el.value = obj[k]; el.dispatchEvent(new Event('input')); }
  }
  quiet = false;
  updateOutInfo();
  if(processed && $('#live').checked) run();
}
if(has('#preset')){
  $('#preset').addEventListener('change', () => setVals(PRESETS[$('#preset').value]));
  ['amount','radius','thresh','clarity','denoise','sat','con','exp','kernel'].forEach(id =>
    has('#'+id) && $('#'+id).addEventListener('input', () => { if(!quiet) $('#preset').value = 'custom'; }));
}
const DEFAULTS = MODE === 'enhance'
  ? Object.assign({}, PRESETS.foto, {scale:2})
  : {colors:12, vblur:0.6, tol:1, minArea:12, vscale:'2', smooth:true};
if(has('#btnReset')) $('#btnReset').onclick = () => {
  if(has('#preset')) $('#preset').value = 'foto';
  setVals(DEFAULTS);
  document.querySelectorAll('#segScale button').forEach(b =>
    b.classList.toggle('on', b.dataset.s === '2'));
};

/* ---------- memuat file ---------- */
if(has('#btnPick')) $('#btnPick').onclick = () => $('#file').click();
$('#file').onchange = e => { if(e.target.files[0]) loadFile(e.target.files[0]); e.target.value = ''; };
const drop = $('#drop'), vp = $('#vp'), dz = $('#dz');

/* dropzone di viewport (area preview) */
['dragenter','dragover'].forEach(ev => vp.addEventListener(ev, e => {
  e.preventDefault(); drop.classList.add('over'); drop.style.display='flex'; }));
['dragleave','drop'].forEach(ev => vp.addEventListener(ev, e => {
  e.preventDefault(); drop.classList.remove('over'); if(srcImgData) drop.style.display='none'; }));
vp.addEventListener('drop', e => { const f = e.dataTransfer.files[0]; if(f) loadFile(f); });

/* dropzone di sidebar ("Pilih atau tarik gambar") */
if(dz){
  ['dragenter','dragover'].forEach(ev => dz.addEventListener(ev, e => {
    e.preventDefault(); e.stopPropagation(); dz.classList.add('over'); }));
  ['dragleave','drop'].forEach(ev => dz.addEventListener(ev, e => {
    e.preventDefault(); e.stopPropagation(); dz.classList.remove('over'); }));
  dz.addEventListener('drop', e => { const f = e.dataTransfer.files[0]; if(f) loadFile(f); });
}

window.addEventListener('paste', e => {
  for(const it of e.clipboardData.items) if(it.type.startsWith('image/')) { loadFile(it.getAsFile()); break; }
});

async function loadFile(file){
  err('');
  if(!file.type.startsWith('image/')) return err('File bukan gambar.');
  srcName = (file.name || 'image').replace(/\.[^.]+$/, '');
  try{
    const url = URL.createObjectURL(file);
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error('Gagal membaca gambar')); img.src = url; });
    srcW = img.naturalWidth || 1024; srcH = img.naturalHeight || 1024;
    const c = document.createElement('canvas'); c.width = srcW; c.height = srcH;
    const cx = c.getContext('2d', {willReadFrequently:true});
    cx.drawImage(img, 0, 0, srcW, srcH);
    srcImgData = cx.getImageData(0, 0, srcW, srcH);
    URL.revokeObjectURL(url);
  }catch(e){ return err(e.message); }

  cvIn.width = srcW; cvIn.height = srcH; ctxIn.putImageData(srcImgData, 0, 0);
  cvOut.width = srcW; cvOut.height = srcH; ctxOut.putImageData(srcImgData, 0, 0);
  $('#wrap').style.width = srcW+'px'; $('#wrap').style.height = srcH+'px';
  $('#fileInfo').textContent = srcName + ' · ' + srcW + '×' + srcH + ' px';
  if(dz){ dz.classList.add('has'); if(has('#dzTitle')) $('#dzTitle').textContent = srcName; }
  drop.style.display = 'none';
  $('#btnRun').disabled = false;
  processed = false; lastSVG = null;
  $('#br').textContent = 'BELUM DIPROSES'; $('#btnSave').disabled = true;
  fit(); updateOutInfo();
}

/* ---------- proses ---------- */
let timer = null;
function scheduleRun(){
  updateOutInfo();
  if(!srcImgData || !processed || !$('#live').checked) return;
  clearTimeout(timer); timer = setTimeout(run, 260);
}
$('#btnRun').onclick = run;

function targetSize(){
  const s = parseFloat($('#scale').value);
  return [Math.max(1, Math.round(srcW*s)), Math.max(1, Math.round(srcH*s))];
}
function updateOutInfo(){
  if(!srcImgData){ $('#outInfo').textContent = ''; return; }
  if(MODE === 'enhance'){
    const [w,h] = targetSize();
    $('#outInfo').textContent = 'Output: ' + w + '×' + h + ' px (' + (w*h/1e6).toFixed(1) + ' MP)';
    $('#dims').textContent = srcW+'×'+srcH+'  →  '+w+'×'+h;
  } else {
    $('#outInfo').textContent = 'Output: SVG vektor ' + srcW + '×' + srcH;
    $('#dims').textContent = srcW+'×'+srcH+'  →  SVG';
  }
}

function run(){
  if(!srcImgData) return;
  if(busy){ pending = true; return; }
  err(''); busy = true; pending = false; lastSVG = null;
  $('#btnSave').disabled = true;
  showOverlay(true, 'Memproses…', 0);
  const buf = srcImgData.data.slice().buffer;
  if(MODE === 'enhance'){
    const [w,h] = targetSize();
    if(w*h > 80e6){ busy=false; showOverlay(false); return err('Output terlalu besar ('+(w*h/1e6).toFixed(0)+' MP). Turunkan skala.'); }
    worker.postMessage({ type:'enhance', data:buf, width:srcW, height:srcH, dw:w, dh:h,
      kernel:$('#kernel').value, denoise:+$('#denoise').value, amount:+$('#amount').value,
      radius:+$('#radius').value, thresh:+$('#thresh').value, clarity:+$('#clarity').value,
      sat:+$('#sat').value, con:+$('#con').value, exp:+$('#exp').value }, [buf]);
  } else {
    worker.postMessage({ type:'vector', data:buf, width:srcW, height:srcH,
      colors:+$('#colors').value, vblur:+$('#vblur').value, tol:+$('#tol').value,
      minArea:+$('#minArea').value, smooth:$('#smooth').checked, vscale:+$('#vscale').value }, [buf]);
  }
}

worker.onmessage = async e => {
  const m = e.data;
  if(m.type === 'progress'){ showOverlay(true, m.text, m.p); return; }
  if(m.type === 'error'){ busy = false; showOverlay(false); return err(m.message); }
  if(m.type === 'enhance'){
    outW = m.w; outH = m.h;
    cvOut.width = outW; cvOut.height = outH;
    ctxOut.putImageData(new ImageData(new Uint8ClampedArray(m.buf), outW, outH), 0, 0);
    $('#outInfo').textContent = 'Output: ' + outW + '×' + outH + ' px (' + (outW*outH/1e6).toFixed(1) + ' MP)';
  }
  if(m.type === 'vector'){
    lastSVG = m.svg; outW = m.w; outH = m.h;
    const img = new Image();
    await new Promise(res => { img.onload = res; img.onerror = res;
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(m.svg); });
    cvOut.width = outW; cvOut.height = outH;
    ctxOut.clearRect(0,0,outW,outH); ctxOut.drawImage(img, 0, 0, outW, outH);
    $('#outInfo').textContent = 'SVG: ' + m.paths + ' path · ' + m.colors + ' warna · ' +
      (new Blob([m.svg]).size/1024).toFixed(0) + ' KB';
  }
  processed = true; $('#br').textContent = 'HASIL';
  busy = false; $('#btnSave').disabled = false; showOverlay(false);
  if(pending) run();
};

/* ---------- simpan ---------- */
$('#btnSave').onclick = () => {
  if(MODE === 'vector'){
    if(!lastSVG) return;
    dl(new Blob([lastSVG], {type:'image/svg+xml'}), srcName + '-vector.svg');
  } else {
    const fmt = $('#fmt').value, q = Math.min(100, Math.max(1, +$('#q').value))/100;
    cvOut.toBlob(b => {
      if(!b) return err('Gagal encode. Coba format lain.');
      const ext = fmt === 'image/png' ? 'png' : (fmt === 'image/webp' ? 'webp' : 'jpg');
      dl(b, srcName + '-' + outW + 'x' + outH + '.' + ext);
    }, fmt, q);
  }
};
function dl(blob, name){
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

/* ---------- tampilan: zoom / pan / compare ---------- */
function apply(){
  $('#wrap').style.transform = 'translate(' + panX + 'px,' + panY + 'px) scale(' + zoom + ')';
  $('#zoomLbl').textContent = Math.round(zoom*100) + '%';
}
function fit(){
  const r = vp.getBoundingClientRect();
  zoom = Math.min((r.width-40)/srcW, (r.height-40)/srcH, 8);
  panX = (r.width - srcW*zoom)/2; panY = (r.height - srcH*zoom)/2; apply();
}
function zoomAt(f, cx, cy){
  const z2 = Math.min(32, Math.max(0.02, zoom*f));
  panX = cx - (cx - panX) * (z2/zoom); panY = cy - (cy - panY) * (z2/zoom);
  zoom = z2; apply();
}
$('#btnZoomIn').onclick = () => { const r = vp.getBoundingClientRect(); zoomAt(1.25, r.width/2, r.height/2); };
$('#btnZoomOut').onclick = () => { const r = vp.getBoundingClientRect(); zoomAt(0.8, r.width/2, r.height/2); };
$('#btnFit').onclick = () => srcImgData && fit();
$('#btn100').onclick = () => { const r = vp.getBoundingClientRect();
  panX += (r.width/2 - panX) * (1 - 1/zoom); panY += (r.height/2 - panY) * (1 - 1/zoom);
  zoom = 1; apply(); };
vp.addEventListener('wheel', e => {
  if(!srcImgData || e.target.closest('#floatPanel')) return; e.preventDefault();
  const r = vp.getBoundingClientRect();
  zoomAt(Math.exp(-e.deltaY * 0.0016), e.clientX - r.left, e.clientY - r.top);
}, {passive:false});
let dragging = false, lx = 0, ly = 0;
vp.addEventListener('pointerdown', e => {
  if(e.target === $('#handle') || e.target.closest('#floatPanel')) return;
  dragging = true; lx = e.clientX; ly = e.clientY; vp.classList.add('drag'); vp.setPointerCapture(e.pointerId);
});
vp.addEventListener('pointermove', e => {
  if(!dragging) return; panX += e.clientX - lx; panY += e.clientY - ly; lx = e.clientX; ly = e.clientY; apply();
});
vp.addEventListener('pointerup', () => { dragging = false; vp.classList.remove('drag'); });

$('#btnCompare').onclick = () => {
  compare = !compare;
  $('#btnCompare').classList.toggle('on', compare);
  $('#handle').classList.toggle('hide', !compare);
  $('#bl').style.display = compare ? '' : 'none';
  $('#br').style.display = compare ? '' : 'none';
  setSplit(compare ? split : 0);
};
function setSplit(v){ split = Math.min(1, Math.max(0, v)); $('#wrap').style.setProperty('--split', (split*100)+'%'); }
setSplit(0.5);
let hDrag = false;
$('#handle').addEventListener('pointerdown', e => { hDrag = true; e.stopPropagation(); $('#handle').setPointerCapture(e.pointerId); });
$('#handle').addEventListener('pointermove', e => {
  if(!hDrag) return;
  const r = $('#wrap').getBoundingClientRect();
  setSplit((e.clientX - r.left) / r.width);
});
$('#handle').addEventListener('pointerup', () => hDrag = false);

$('#btnMin').onclick = () => {
  const p = $('#floatPanel'); p.classList.toggle('min');
  $('#btnMin').textContent = p.classList.contains('min') ? '+' : '–';
};

/* ---------- lain-lain ---------- */
function showOverlay(on, txt, p){
  $('#ov').classList.toggle('on', !!on);
  if(txt) $('#ovTxt').textContent = txt;
  if(p != null) $('#ovBar').style.width = Math.round(p*100) + '%';
}
function err(m){ $('#err').textContent = m || ''; }
window.addEventListener('resize', () => { if(srcImgData) apply(); });
