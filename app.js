import { ParseError, tokenize, toRPN, evalRPN, truthVector, eq, runTests } from './logic.js';
import { initSVG, setMode, setRegions } from './svg.js';

// cursor
const cursor = document.getElementById('cursor');
let tx=0, ty=0, cx=0, cy=0;
window.addEventListener('mousemove', e=>{ tx=e.clientX; ty=e.clientY; });
(function raf(){ cx+=(tx-cx)*0.16; cy+=(ty-cy)*0.16; cursor.style.left=cx+'px'; cursor.style.top=cy+'px'; requestAnimationFrame(raf); })();
window.addEventListener('mousedown', ()=> cursor.style.transform='translate(-50%,-50%) scale(0.86)');
window.addEventListener('mouseup',   ()=> cursor.style.transform='translate(-50%,-50%) scale(1)');

const svg = document.getElementById('vennSvg');
initSVG(svg);

// UI refs
const exprEl = document.getElementById('expr');
const warnC  = document.getElementById('warnC');
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
  input.value = input.value.slice(0,s)+text+input.value.slice(e);
  input.selectionStart = input.selectionEnd = s+text.length; input.focus();
}
function backspaceAtCursor(input){
  let s=(input.selectionStart==null?input.value.length:input.selectionStart);
  let e=(input.selectionEnd==null?input.value.length:input.selectionEnd);
  if(s!==e){ input.value=input.value.slice(0,s)+input.value.slice(e); input.selectionStart=input.selectionEnd=s; input.focus(); return; }
  if(s>0){ input.value=input.value.slice(0,s-1)+input.value.slice(s); input.selectionStart=input.selectionEnd=s-1; input.focus(); }
}

// truth table
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

// render
function computeRegions(rpn, mode){
  if(!rpn) return {OUT:0,A:0,B:0,C:0,AB:0,AC:0,BC:0,ABC:0};
  const v = (A,B,C)=> evalRPN(rpn,{A,B,C})?1:0;
  if(mode===2){
    return { OUT:v(0,0,0), A:v(1,0,0), B:v(0,1,0), C:0, AB:v(1,1,0), AC:0, BC:0, ABC:0 };
  }
  return {
    OUT:v(0,0,0), A:v(1,0,0), B:v(0,1,0), C:v(0,0,1),
    AB:v(1,1,0), AC:v(1,0,1), BC:v(0,1,1), ABC:v(1,1,1)
  };
}

function render(){
  const raw = exprEl.value.trim();
  const mode = +document.querySelector('input[name="mode"]:checked').value;
  setMode(svg, mode);
  warnC.style.display = (mode===2 && /\bC\b/.test(raw)) ? 'inline' : 'none';

  let rpn=null;
  try{ rpn = toRPN(tokenize(raw)); }
  catch(e){ updateTable(null, mode); setRegions(svg, {OUT:0,A:0,B:0,C:0,AB:0,AC:0,BC:0,ABC:0}); return; }

  const active = computeRegions(rpn, mode);
  setRegions(svg, active);
  updateTable(rpn, mode);
  runTests(); // silent
}

// events
document.getElementById('btnRender').onclick = ()=> render();
document.getElementById('btnClear').onclick  = ()=>{ exprEl.value=''; render(); };
document.getElementById('btnExport').onclick = ()=>{
  // Export as SVG (no canvas used)
  const serializer = new XMLSerializer();
  const src = serializer.serializeToString(svg);
  const blob = new Blob([src], {type:'image/svg+xml;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'venn.svg'; a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href), 0);
};
Array.from(document.getElementsByName('mode')).forEach(r=> r.addEventListener('change', render));
exprEl.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); render(); } });

// init
exprEl.value='(A ∨ B) ∧ (A ∨ C)';
render();
