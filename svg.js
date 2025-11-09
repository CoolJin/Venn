// Build static SVG (viewBox scaled), define regions via clipPath/mask, toggle via classes.
const VBW = 1000, VBH = 700;
const geom = {
  r3: 210,
  A:{x:360,y:420}, B:{x:640,y:420}, C:{x:500,y:240}
};

export function initSVG(svg){
  svg.setAttribute('viewBox', `0 0 ${VBW} ${VBH}`);
  svg.innerHTML = `
  <defs>
    <circle id="circA" cx="${geom.A.x}" cy="${geom.A.y}" r="${geom.r3}" />
    <circle id="circB" cx="${geom.B.x}" cy="${geom.B.y}" r="${geom.r3}" />
    <circle id="circC" cx="${geom.C.x}" cy="${geom.C.y}" r="${geom.r3}" />

    <clipPath id="clipA" clipPathUnits="userSpaceOnUse"><use href="#circA"/></clipPath>
    <clipPath id="clipB" clipPathUnits="userSpaceOnUse"><use href="#circB"/></clipPath>
    <clipPath id="clipC" clipPathUnits="userSpaceOnUse"><use href="#circC"/></clipPath>

    <!-- negative masks -->
    <mask id="minusA" maskUnits="userSpaceOnUse">
      <rect x="0" y="0" width="${VBW}" height="${VBH}" fill="white"/>
      <use href="#circA" fill="black"/>
    </mask>
    <mask id="minusB" maskUnits="userSpaceOnUse">
      <rect x="0" y="0" width="${VBW}" height="${VBH}" fill="white"/>
      <use href="#circB" fill="black"/>
    </mask>
    <mask id="minusC" maskUnits="userSpaceOnUse">
      <rect x="0" y="0" width="${VBW}" height="${VBH}" fill="white"/>
      <use href="#circC" fill="black"/>
    </mask>

    <style>
      .region { fill: rgba(0,229,255,0.28); opacity: 0; transition: opacity .15s ease; }
      .region.on { opacity: 1; }
      .outline { fill: none; stroke: rgba(255,255,255,0.98); stroke-width: 2; }
      .label { fill:#e9ecf1; font: 18px Inter, system-ui, sans-serif; text-anchor: middle; dominant-baseline: central; }
    </style>
  </defs>

  <!-- regions (8 for 3-set: OUT, A, B, C, AB, AC, BC, ABC) -->
  <g id="regions">
    <!-- outside: ~A & ~B & ~C -->
    <g id="rOUT">
      <g mask="url(#minusA)"><g mask="url(#minusB)"><g mask="url(#minusC)">
        <rect class="region" x="0" y="0" width="${VBW}" height="${VBH}"/>
      </g></g></g>
    </g>

    <!-- A only: A & ~B & ~C -->
    <g id="rA" clip-path="url(#clipA)">
      <g mask="url(#minusB)"><g mask="url(#minusC)">
        <rect class="region" x="0" y="0" width="${VBW}" height="${VBH}"/>
      </g></g>
    </g>

    <!-- B only -->
    <g id="rB" clip-path="url(#clipB)">
      <g mask="url(#minusA)"><g mask="url(#minusC)">
        <rect class="region" x="0" y="0" width="${VBW}" height="${VBH}"/>
      </g></g>
    </g>

    <!-- C only -->
    <g id="rC" clip-path="url(#clipC)">
      <g mask="url(#minusA)"><g mask="url(#minusB)">
        <rect class="region" x="0" y="0" width="${VBW}" height="${VBH}"/>
      </g></g>
    </g>

    <!-- AB only: A & B & ~C -->
    <g id="rAB"><g clip-path="url(#clipA)"><g clip-path="url(#clipB)">
      <g mask="url(#minusC)"><rect class="region" x="0" y="0" width="${VBW}" height="${VBH}"/></g>
    </g></g></g>

    <!-- AC only -->
    <g id="rAC"><g clip-path="url(#clipA)"><g clip-path="url(#clipC)">
      <g mask="url(#minusB)"><rect class="region" x="0" y="0" width="${VBW}" height="${VBH}"/></g>
    </g></g></g>

    <!-- BC only -->
    <g id="rBC"><g clip-path="url(#clipB)"><g clip-path="url(#clipC)">
      <g mask="url(#minusA)"><rect class="region" x="0" y="0" width="${VBW}" height="${VBH}"/></g>
    </g></g></g>

    <!-- ABC -->
    <g id="rABC"><g clip-path="url(#clipA)"><g clip-path="url(#clipB)"><g clip-path="url(#clipC)">
      <rect class="region" x="0" y="0" width="${VBW}" height="${VBH}"/>
    </g></g></g></g>
  </g>

  <!-- outlines and labels -->
  <g id="outlines">
    <use id="oA" class="outline" href="#circA"/><use id="oB" class="outline" href="#circB"/><use id="oC" class="outline" href="#circC"/>
    <text id="tA" class="label" x="${geom.A.x}" y="${geom.A.y}">A</text>
    <text id="tB" class="label" x="${geom.B.x}" y="${geom.B.y}">B</text>
    <text id="tC" class="label" x="${geom.C.x}" y="${geom.C.y}">C</text>
  </g>
  `;
}

export function setMode(svg, mode){
  // Show/hide all C-related visuals in 2-set mode
  const showC = mode===3;
  ['oC','tC','rC','rAC','rBC','rABC'].forEach(id=>{
    const el = svg.getElementById ? svg.getElementById(id) : svg.querySelector('#'+id);
    if(!el) return;
    el.style.display = showC ? '' : 'none';
  });
}

export function setRegions(svg, active){
  // active: { OUT, A, B, C, AB, AC, BC, ABC } booleans
  const map = {
    rOUT: active.OUT, rA:active.A, rB:active.B, rC:active.C,
    rAB:active.AB, rAC:active.AC, rBC:active.BC, rABC:active.ABC
  };
  for(const [id,on] of Object.entries(map)){
    const g = svg.querySelector('#'+id+' .region');
    if(!g) continue;
    g.classList.toggle('on', !!on);
  }
}
