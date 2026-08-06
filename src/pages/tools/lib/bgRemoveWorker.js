/* =====================================================================
   Verbatim port of the self-contained cutout/mask algorithm from the
   original vanilla-JS "Remove Background" tool (bg-remove.js). This
   string is executed inside a Web Worker — it has no DOM access, it
   only receives pixel data and posts back progress/results.
   Copied byte-for-byte; do not "clean up" the style in here.
   ===================================================================== */
export const WORKER_SRC = String.raw`
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
