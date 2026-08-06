/* =====================================================================
   Enhance worker source — ported verbatim from image-studio/engine.js
   (the 'enhance' mode slice of the shared WORKER_SRC template literal:
   S2L/L2S linear-light LUTs, mkKernel, weights, resample, gaussPlane,
   boxBlurPlane, bilateral, sharpen and enhance()). The vectorize-mode
   functions from the original file are intentionally omitted since this
   worker only ever receives {type:'enhance'} messages.
   Runs 100% client-side inside a Worker built from this string via
   `new Worker(URL.createObjectURL(new Blob([WORKER_SRC], {type:'text/javascript'})))`.
   ===================================================================== */
export const WORKER_SRC = String.raw`
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

self.onmessage = e => {
  try{
    if(e.data.type==='enhance') enhance(e.data);
  }catch(err){ self.postMessage({type:'error',message:String(err&&err.message||err)}); }
};
`;
