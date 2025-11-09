import { ParseError, tokenize, toRPN, evalRPN, truthVector, eq, runTests } from './logic.js';
import { getDPR, drawVenn, drawBackdrop, drawMessage } from './draw.js';

const cursor = document.getElementById('cursor');
const exprEl  = document.getElementById('expr');
const warnC   = document.getElementById('warnC');
const canvas  = document.getElementById('venn');
const ctx     = canvas.getContext('2d');

// smooth cursor
let tx=0, ty=0, cx=0, cy=0;
window.addEventListener('mousemove', e=>{ tx=e.clientX; ty=e.clientY; });
(function raf(){ cx+=(tx-cx)*0.16; cy+=(ty-cy)*0.16; cursor.style.left=cx+'px'; cursor.style.top=cy+'px'; requestAnimationFrame(raf); })();
window.addEventListener('mousedown', ()=>{ cursor.style.transform='translate(-50%,-50%) scale(0.86)'; });
window.addEventListener('mouseup',   ()=>{ cursor.style.transform='translate(-50%,-50%) scale(1)';   });

// chips
const chipsWrap = document.getElementById('chips');
const chipDefs = [
  {t:'A',v:'A'},{t:'B',v:'B'},{t:'C',v:'C'},
  {t:'(',v:'('},{t:')',v:')'},
  {t:'¬',v:'¬'},{t:'∧',v:'∧'},{t:'∨',v:'∨'},{t:'→',v:'->'},{t:'↔',v:'<->'},
  {t:'⌫',v:'__BACKSPACE__', cls:'delete'}
];
for(const c of chipDefs){
  const b=document.createElement('div'); b.className='chip'+(c.cls?(' '+c.cls):''); b.textContent=c.t;
  b.onclick=()=>{ if(c.v==='__BACKSPACE__') backspaceAtCursor(exprEl); else insertAtCursor(exprEl,c.v); };
  chipsWrap.appendChild(b);
}
function insertAtCursor(input, text){
  const s=(input.selectionStart==null?input.value.length:input.selectionStart);
  const e=(input.selectionEnd==null?input.value.length:input.selectionEnd);
  const val=input.value; input.value=val.slice(0,s)+text+val.slice(e);
  const p=s+text.length; input.selectionStart=input.selectionEnd=p; input.focus();
}
function backspaceAtCursor(input){
  let s=(input.selectionStart==null?input.value.length:input.selectionStart);
  let e=(input.selectionEnd==null?input.value.length:input.selectionEnd);
  if(s!==e){ input.value=input.value.slice(0,s)+input.value.slice(e); input.selectionStart=input.selectionEnd=s; input.focus(); return; }
  if(s>0){ input.value=input.value.slice(0,s-1)+input.value.slice(s); input.selectionStart=input.selectionEnd=s-1; input.focus(); }
}

// resize (RAF-batched, no layout writes inside observer)
let pendingResize=null, resizeScheduled=false, lastW=0, lastH=0, lastDPR=getDPR();
const ro=new ResizeObserver(entries=>{ const cr=entries[0].contentRect; scheduleCanvasResize(cr.width, cr.height); });
ro.observe(canvas);
window.addEventListener('resize', ()=> scheduleCanvasResize(canvas.clientWidth, canvas.clientHeight));
function scheduleCanvasResize(cssW, cssH){
  const dpr=getDPR(); const targetW=Math.floor(cssW*dpr); const targetH=Math.floor(cssH*dpr);
  pendingResize={w:targetW,h:targetH,dpr};
  if(resizeScheduled) return;
  resizeScheduled=true;
  requestAnimationFrame(()=>{
    resizeScheduled=false;
    if(!pendingResize) return;
    const {w,h,dpr:curDPR}=pendingResize; pendingResize=null;
    if(w!==lastW||h!==lastH||curDPR!==lastDPR){
      lastW=w; lastH=h; lastDPR=curDPR;
      canvas.width=w; canvas.height=h;
      scheduleRender();
    }
  });
}

// render pipeline
let renderPending=false;
function scheduleRender(){ if(renderPending) return; renderPending=true; requestAnimationFrame(()=>{ renderPending=false; render(); }); }
function render(){
  const raw = exprEl.value.trim();
  const mode = +document.querySelector('input[name="mode"]:checked').value;
  warnC.style.display = (mode===2 && /\bC\b/.test(raw)) ? 'inline' : 'none';
  let rpn;
  try{ rpn = toRPN(tokenize(raw)); }
  catch(e){ drawBackdrop(ctx,canvas); drawMessage(ctx,canvas,'Parse error: '+e.message); updateTable(null, mode); return; }
  drawVenn(ctx,canvas,rpn,mode,evalRPN);
  updateTable(rpn, mode);
  runTests(); // silent
}

// truth table
function escHTML(s){
  let out=""; for(let i=0;i<s.length;i++){
    const ch=s[i];
    if(ch==='&') out+='&amp;'; else if(ch==='<') out+='&lt;'; else if(ch==='>') out+='&gt;';
    else if(ch==='"') out+='&quot;'; else if(ch==="'") out+='&#39;'; else out+=ch;
  } return out;
}
function prettyExpr(s){ return escHTML(s.split('<->').join('↔').split('->').join('→').split('|').join('∨').split('&').join('∧').split('~').join('¬')); }
function updateTable(rpn, mode){
  const thead=document.getElementById('thead'), tbody=document.getElementById('tbody'), colg=document.getElementById('colgroup');
  thead.innerHTML=''; tbody.innerHTML=''; colg.innerHTML='';
  const label = prettyExpr(exprEl.value.trim());
  const cg = mode===3 ? '<col><col><col><col class="sep">' : '<col><col><col class="sep">';
  colg.insertAdjacentHTML('beforeend', cg);
  const header = mode===3
    ? `<tr><th>A</th><th>B</th><th>C</th><th>${label}</th></tr>`
    : `<tr><th>A</th><th>B</th><th>${label}</th></tr>`;
  thead.insertAdjacentHTML('beforeend', header);
  if(!rpn) return;
  const n = mode===3 ? 3 : 2;
  const rows = 1<<n;
  for(let k=0;k<rows;k++){
    const A=!!((k>>(n-1-0))&1);
    const B=!!((k>>(n-1-1))&1);
    const C=n===3?!!((k>>(n-1-2))&1):false;
    const f=evalRPN(rpn,{A,B,C});
    const row = mode===3
      ? `<tr><td>${A?1:0}</td><td>${B?1:0}</td><td>${C?1:0}</td><td>${f?1:0}</td></tr>`
      : `<tr><td>${A?1:0}</td><td>${B?1:0}</td><td>${f?1:0}</td></tr>`;
    tbody.insertAdjacentHTML('beforeend', row);
  }
}

// events
document.getElementById('btnRender').onclick = ()=> scheduleRender();
document.getElementById('btnClear').onclick  = ()=>{ exprEl.value=''; scheduleRender(); };
document.getElementById('btnExport').onclick = ()=>{
  const tmp=document.createElement('canvas'); tmp.width=canvas.width; tmp.height=canvas.height;
  const tctx=tmp.getContext('2d'); tctx.fillStyle='#0b0d10'; tctx.fillRect(0,0,tmp.width,tmp.height); tctx.drawImage(canvas,0,0);
  const a=document.createElement('a'); a.href=tmp.toDataURL('image/png'); a.download='venn.png'; a.click();
};
Array.from(document.getElementsByName('mode')).forEach(r=> r.addEventListener('change', ()=> scheduleRender()));
exprEl.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); scheduleRender(); } });

// init
exprEl.value='(A ∨ B) ∧ (A ∨ C)';
scheduleCanvasResize(canvas.clientWidth, canvas.clientHeight);
scheduleRender();
