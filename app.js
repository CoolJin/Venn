import { ParseError, tokenize, toRPN, evalRPN, runTests } from './logic.js';
import { initSVG, setMode, setRegions } from './svg.js';

/* Custom Cursor: nur Desktop (pointer:fine) */
const cursor = document.getElementById('cursor');
const hasFinePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
if (hasFinePointer) {
  let tx=0, ty=0, cx=0, cy=0;
  window.addEventListener('mousemove', e=>{ tx=e.clientX; ty=e.clientY; });
  (function raf(){ cx+=(tx-cx)*0.16; cy+=(ty-cy)*0.16; cursor.style.left=cx+'px'; cursor.style.top=cy+'px'; requestAnimationFrame(raf); })();
  window.addEventListener('mousedown', ()=> cursor.style.transform='translate(-50%,-50%) scale(0.86)');
  window.addEventListener('mouseup',   ()=> cursor.style.transform='translate(-50%,-50%) scale(1)');
} else {
  // Mobile: Cursor-Element ausblenden zur Sicherheit
  if (cursor) cursor.style.display='none';
}

const svg     = document.getElementById('vennSvg');
const exprEl  = document.getElementById('expr');
const warnC   = document.getElementById('warnC');
const status  = document.getElementById('status');
const chipsWrap = document.getElementById('chips');

initSVG(svg);

/* pointer glow vars (funktioniert mit Maus & Touch) */
function attachPointerVars(els){
  els.forEach(el=>{
    const set = (x,y)=>{
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${x - r.left}px`);
      el.style.setProperty('--my', `${y - r.top}px`);
    };
    el.addEventListener('pointermove', ev=> set(ev.clientX, ev.clientY));
    el.addEventListener('pointerdown', ev=> set(ev.clientX, ev.clientY));
    el.addEventListener('touchstart', ev=>{
      const t=ev.touches[0]; if(t) set(t.clientX, t.clientY);
    }, {passive:true});
  });
}

/* input chips */
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
attachPointerVars([...document.querySelectorAll('.chip')]);

/* Buttons & Segments mit Glow */
attachPointerVars([...document.querySelectorAll('.btn, .toggle label')]);

function insertAtCursor(input, text){
  const s=(input.selectionStart==null?input.value.length:input.selectionStart);
  const e=(input.selectionEnd==null?input.value.length:input.selectionEnd);
  input.value = input.value.slice(0,s)+text+input.value.slice(e);
  input.selectionStart = input.selectionEnd = s+text.length; input.focus();
}
function backspaceAtCursor(input){
  let s=(input.selectionStart==null?input.value.length:input.selectionStart);
  let e=(input.selectionEnd==null?input.value.length:input.selectionEnd);
  if(s!==e){ input.value=input.value.slice(0,s)+input.value.slice(e); input.selectionStart=input.selectionEnd=s; input.focus(); return; }
  if(s>0){ input.value=input.value.slice(0,s-1)+input.value.slice(s); input.selectionStart=input.selectionEnd=s-1; input.focus(); }
}

/* Tabelle */
function escHTML(s){ return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#39;"); }
function prettyExpr(s){ return escHTML(s.split('<->').join('↔').split('->').join('→').split('|').join('∨').split('&').join('∧').split('~').join('¬')); }
function updateTable(rpn, mode){
  const thead=document.getElementById('thead'), tbody=document.getElementById('tbody'), colg=document.getElementById('colgroup');
  thead.innerHTML=''; tbody.innerHTML=''; colg.innerHTML='';
  const label=prettyExpr(exprEl.value.trim());
  const cg = mode===3?'<col><col><col><col class="sep">':'<col><col><col class="sep">';
  colg.insertAdjacentHTML('beforeend', cg);
  thead.insertAdjacentHTML('beforeend', mode===3
    ? `<tr><th>A</th><th>B</th><th>C</th><th>${label}</th></tr>`
    : `<tr><th>A</th><th>B</th><th>${label}</th></tr>`);
  if(!rpn) return;
  const n=mode===3?3:2, rows=1<<n;
  for(let k=0;k<rows;k++){
    const A=!!((k>>(n-1-0))&1), B=!!((k>>(n-1-1))&1), C=n===3?!!((k>>(n-1-2))&1):false;
    const f = evalRPN(rpn,{A,B,C});
    const row = mode===3
      ? `<tr><td>${A?1:0}</td><td>${B?1:0}</td><td>${C?1:0}</td><td>${f?1:0}</td></tr>`
      : `<tr><td>${A?1:0}</td><td>${B?1:0}</td><td>${f?1:0}</td></tr>`;
    tbody.insertAdjacentHTML('beforeend', row);
  }
}

/* Regionen */
function computeRegions(rpn, mode){
  if(!rpn) return {OUT:0,A:0,B:0,C:0,AB:0,AC:0,BC:0,ABC:0};
  const v = (A,B,C)=> evalRPN(rpn,{A,B,C})?1:0;
  if(mode===2){
    return { OUT:v(0,0,0), A:v(1,0,0), B:v(0,1,0), C:0, AB:v(1,1,0), AC:0, BC:0, ABC:0 };
  }
  return { OUT:v(0,0,0), A:v(1,0,0), B:v(0,1,0), C:v(0,0,1), AB:v(1,1,0), AC:v(1,0,1), BC:v(0,1,1), ABC:v(1,1,1) };
}

/* Render + Fehler */
function render(){
  const raw = exprEl.value.trim();
  const mode = +document.querySelector('input[name="mode"]:checked').value;
  setMode(svg, mode);
  warnC.style.display = (mode===2 && /\bC\b/.test(raw)) ? 'inline' : 'none';

  let rpn=null;
  try{
    const tokens = tokenize(raw);
    if(tokens.length===0){ status.textContent=''; setRegions(svg, computeRegions(null,mode), mode); updateTable(null, mode); return; }
    rpn = toRPN(tokens);
    if(!rpn || !rpn.length) throw new ParseError('Empty expression');
    status.textContent = '';
  }catch(e){
    status.textContent = 'Parse error: ' + (e && e.message ? e.message : 'invalid expression');
    setRegions(svg, computeRegions(null,mode), mode);
    updateTable(null, mode);
    return;
  }

  const active = computeRegions(rpn, mode);
  setRegions(svg, active, mode);
  updateTable(rpn, mode);
  runTests(); // silent
}

/* Export */
async function exportPNG(svgEl){
  try{
    const serializer = new XMLSerializer();
    const src = serializer.serializeToString(svgEl);
    const blob = new Blob([src], {type:'image/svg+xml;charset=utf-8'});
    const url = URL.createObjectURL(blob);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    const w = Math.max(1, svgEl.clientWidth);
    const h = Math.max(1, svgEl.clientHeight);

    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = w*scale; canvas.height = h*scale;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0b0d10';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    await new Promise((res,rej)=>{ img.onload=()=>res(); img.onerror=rej; img.src=url; });
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);

    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'venn.png';
    a.click();
  }catch(_){
    exportSVG(svgEl);
  }
}
function exportSVG(svgEl){
  const serializer = new XMLSerializer();
  const src = serializer.serializeToString(svgEl);
  const blob = new Blob([src], {type:'image/svg+xml;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'venn.svg'; a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),0);
}

/* events */
document.getElementById('btnRender').onclick = ()=> render();
document.getElementById('btnClear').onclick  = ()=>{ exprEl.value=''; render(); };
document.getElementById('btnExportPng').onclick = ()=> exportPNG(svg);
document.getElementById('btnExportSvg').onclick = ()=> exportSVG(svg);
Array.from(document.getElementsByName('mode')).forEach(r=> r.addEventListener('change', render));
exprEl.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); render(); } });

/* init */
exprEl.value='(A ∨ B) ∧ (A ∨ C)';
render();
