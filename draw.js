// Canvas rendering & geometry
export function getDPR(){ return Math.max(1, Math.min(window.devicePixelRatio || 1, 2)); }

export function centersAndR(mode, canvas){
  const w = canvas.width, h = canvas.height;
  if(mode===3){
    const r = Math.min(w,h)*0.29;
    return { r,
      A:{x:w*0.36, y:h*0.60},
      B:{x:w*0.64, y:h*0.60},
      C:{x:w*0.50, y:h*0.34}
    };
  } else {
    const r = Math.min(w,h)*0.36;
    return { r,
      A:{x:w*0.42, y:h*0.52},
      B:{x:w*0.58, y:h*0.52}
    };
  }
}
export function inside(x,y,c,r){ const dx=x-c.x, dy=y-c.y; return dx*dx+dy*dy <= r*r; }

export function drawBackdrop(ctx, canvas){
  const w = canvas.width, h = canvas.height;
  ctx.save(); ctx.clearRect(0,0,w,h);
  const grd = ctx.createLinearGradient(0,0,0,h);
  grd.addColorStop(0,'rgba(8,10,14,0.98)'); grd.addColorStop(1,'rgba(8,10,14,0.90)');
  ctx.fillStyle = grd; ctx.fillRect(0,0,w,h); ctx.restore();
}
export function drawMessage(ctx, canvas, msg){
  const w = canvas.width; const DPR = getDPR();
  ctx.save(); ctx.fillStyle='rgba(255,255,255,0.08)';
  if(ctx.roundRect){ ctx.roundRect(20*DPR,20*DPR, w-40*DPR, 60*DPR, 14*DPR); ctx.fill(); }
  ctx.fillStyle='#e9ecf1'; ctx.font = `${16*DPR}px Inter, system-ui, sans-serif`; ctx.textAlign='center';
  ctx.fillText(msg, w/2, 60*DPR); ctx.restore();
}
export function drawVenn(ctx, canvas, rpn, mode, evalRPN){
  drawBackdrop(ctx, canvas);
  const geom = centersAndR(mode, canvas);
  const w = canvas.width, h = canvas.height;

  const img = ctx.createImageData(w, h);
  const data = img.data; const c1 = {r:0, g:229, b:255};

  for(let y=0; y<h; y++){
    for(let x=0; x<w; x++){
      let A=false,B=false,C=false;
      if(mode===3){ A=inside(x,y,geom.A,geom.r); B=inside(x,y,geom.B,geom.r); C=inside(x,y,geom.C,geom.r); }
      else { A=inside(x,y,geom.A,geom.r); B=inside(x,y,geom.B,geom.r); }
      if(evalRPN(rpn, {A,B,C})){
        const idx = (y*w + x)*4; data[idx]=c1.r; data[idx+1]=c1.g; data[idx+2]=c1.b; data[idx+3]=72;
      }
    }
  }
  ctx.putImageData(img,0,0);

  const DPR = getDPR();
  ctx.save();
  ctx.lineWidth = 2*DPR; ctx.strokeStyle = 'rgba(255,255,255,0.98)'; ctx.shadowColor = 'rgba(0,229,255,0.28)'; ctx.shadowBlur = 8*DPR;
  const circle = c => { ctx.beginPath(); ctx.arc(c.x,c.y,geom.r,0,Math.PI*2); ctx.stroke(); };
  circle(geom.A); circle(geom.B); if(mode===3) circle(geom.C);
  ctx.shadowBlur = 0; ctx.fillStyle = '#e9ecf1'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font = `${18*DPR}px Inter, system-ui, sans-serif`;
  ctx.fillText('A', geom.A.x, geom.A.y); ctx.fillText('B', geom.B.x, geom.B.y); if(mode===3) ctx.fillText('C', geom.C.x, geom.C.y);
  ctx.restore();
}
