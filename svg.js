// Reines SVG: getrennte 2-Set- und 3-Set-Gruppen
const VBW = 1000, VBH = 700;
const geom3 = { r: 210, A:{x:360,y:420}, B:{x:640,y:420}, C:{x:500,y:240} };
/* 2-Set weiter auseinander + leicht größeres r, mittig */
const geom2 = { r: 240, A:{x:360,y:360}, B:{x:640,y:360} };

export function initSVG(svg){
  svg.setAttribute('viewBox', `0 0 ${VBW} ${VBH}`);
  svg.innerHTML = `
  <defs>
    <style>
      .region { fill: rgba(0,229,255,0.28); opacity: 0; transition: opacity .15s ease; }
      .region.on { opacity: 1; }
      .outline { fill: none; stroke: rgba(255,255,255,0.98); stroke-width: 2; }
      .label { fill:#e9ecf1; font: 18px Inter, system-ui, sans-serif; text-anchor: middle; dominant-baseline: central; }
    </style>

    <!-- 3-set circles -->
    <circle id="c3A" cx="${geom3.A.x}" cy="${geom3.A.y}" r="${geom3.r}" />
    <circle id="c3B" cx="${geom3.B.x}" cy="${geom3.B.y}" r="${geom3.r}" />
    <circle id="c3C" cx="${geom3.C.x}" cy="${geom3.C.y}" r="${geom3.r}" />
    <clipPath id="clip3A" clipPathUnits="userSpaceOnUse"><use href="#c3A"/></clipPath>
    <clipPath id="clip3B" clipPathUnits="userSpaceOnUse"><use href="#c3B"/></clipPath>
    <clipPath id="clip3C" clipPathUnits="userSpaceOnUse"><use href="#c3C"/></clipPath>
    <mask id="m3minusA" maskUnits="userSpaceOnUse"><rect width="${VBW}" height="${VBH}" fill="white"/><use href="#c3A" fill="black"/></mask>
    <mask id="m3minusB" maskUnits="userSpaceOnUse"><rect width="${VBW}" height="${VBH}" fill="white"/><use href="#c3B" fill="black"/></mask>
    <mask id="m3minusC" maskUnits="userSpaceOnUse"><rect width="${VBW}" height="${VBH}" fill="white"/><use href="#c3C" fill="black"/></mask>

    <!-- 2-set circles -->
    <circle id="c2A" cx="${geom2.A.x}" cy="${geom2.A.y}" r="${geom2.r}" />
    <circle id="c2B" cx="${geom2.B.x}" cy="${geom2.B.y}" r="${geom2.r}" />
    <clipPath id="clip2A" clipPathUnits="userSpaceOnUse"><use href="#c2A"/></clipPath>
    <clipPath id="clip2B" clipPathUnits="userSpaceOnUse"><use href="#c2B"/></clipPath>
    <mask id="m2minusA" maskUnits="userSpaceOnUse"><rect width="${VBW}" height="${VBH}" fill="white"/><use href="#c2A" fill="black"/></mask>
    <mask id="m2minusB" maskUnits="userSpaceOnUse"><rect width="${VBW}" height="${VBH}" fill="white"/><use href="#c2B" fill="black"/></mask>
  </defs>

  <!-- dunkler Export-Hintergrund -->
  <rect id="bgRect" x="0" y="0" width="${VBW}" height="${VBH}" fill="#0b0d10"/>

  <!-- 3-set regions -->
  <g id="regions3">
    <g id="r3OUT"><g mask="url(#m3minusA)"><g mask="url(#m3minusB)"><g mask="url(#m3minusC)">
      <rect class="region" x="0" y="0" width="${VBW}" height="${VBH}"/></g></g></g></g>
    <g id="r3A" clip-path="url(#clip3A)"><g mask="url(#m3minusB)"><g mask="url(#m3minusC)">
      <rect class="region" x="0" y="0" width="${VBW}" height="${VBH}"/></g></g></g>
    <g id="r3B" clip-path="url(#clip3B)"><g mask="url(#m3minusA)"><g mask="url(#m3minusC)">
      <rect class="region" x="0" y="0" width="${VBW}" height="${VBH}"/></g></g></g>
    <g id="r3C" clip-path="url(#clip3C)"><g mask="url(#m3minusA)"><g mask="url(#m3minusB)">
      <rect class="region" x="0" y="0" width="${VBW}" height="${VBH}"/></g></g></g>
    <g id="r3AB"><g clip-path="url(#clip3A)"><g clip-path="url(#clip3B)"><g mask="url(#m3minusC)">
      <rect class="region" x="0" y="0" width="${VBW}" height="${VBH}"/></g></g></g></g>
    <g id="r3AC"><g clip-path="url(#clip3A)"><g clip-path="url(#clip3C)"><g mask="url(#m3minusB)">
      <rect class="region" x="0" y="0" width="${VBW}" height="${VBH}"/></g></g></g></g>
    <g id="r3BC"><g clip-path="url(#clip3B)"><g clip-path="url(#clip3C)"><g mask="url(#m3minusA)">
      <rect class="region" x="0" y="0" width="${VBW}" height="${VBH}"/></g></g></g></g>
    <g id="r3ABC"><g clip-path="url(#clip3A)"><g clip-path="url(#clip3B)"><g clip-path="url(#clip3C)">
      <rect class="region" x="0" y="0" width="${VBW}" height="${VBH}"/></g></g></g></g>
  </g>

  <!-- 2-set regions (komplett getrennt, kein C-Leak) -->
  <g id="regions2" style="display:none">
    <g id="r2OUT"><g mask="url(#m2minusA)"><g mask="url(#m2minusB)">
      <rect class="region" x="0" y="0" width="${VBW}" height="${VBH}"/></g></g></g>
    <g id="r2A" clip-path="url(#clip2A)"><g mask="url(#m2minusB)">
      <rect class="region" x="0" y="0" width="${VBW}" height="${VBH}"/></g></g>
    <g id="r2B" clip-path="url(#clip2B)"><g mask="url(#m2minusA)">
      <rect class="region" x="0" y="0" width="${VBW}" height="${VBH}"/></g></g>
    <g id="r2AB"><g clip-path="url(#clip2A)"><g clip-path="url(#clip2B)">
      <rect class="region" x="0" y="0" width="${VBW}" height="${VBH}"/></g></g></g>
  </g>

  <!-- outlines & labels -->
  <g id="outlines3">
    <use class="outline" href="#c3A"/><use class="outline" href="#c3B"/><use class="outline" href="#c3C"/>
    <text class="label" x="${geom3.A.x}" y="${geom3.A.y}">A</text>
    <text class="label" x="${geom3.B.x}" y="${geom3.B.y}">B</text>
    <text class="label" x="${geom3.C.x}" y="${geom3.C.y}">C</text>
  </g>

  <g id="outlines2" style="display:none">
    <use class="outline" href="#c2A"/><use class="outline" href="#c2B"/>
    <text class="label" x="${geom2.A.x}" y="${geom2.A.y}">A</text>
    <text class="label" x="${geom2.B.x}" y="${geom2.B.y}">B</text>
  </g>
  `;
}

export function setMode(svg, mode){
  const g2 = svg.querySelector('#regions2');
  const g3 = svg.querySelector('#regions3');
  const o2 = svg.querySelector('#outlines2');
  const o3 = svg.querySelector('#outlines3');
  const show3 = mode===3;
  g3.style.display = show3 ? '' : 'none';
  o3.style.display = show3 ? '' : 'none';
  g2.style.display = show3 ? 'none' : '';
  o2.style.display = show3 ? 'none' : '';
}

export function setRegions(svg, active, mode){
  if(mode===3){
    const map = { r3OUT:'OUT', r3A:'A', r3B:'B', r3C:'C', r3AB:'AB', r3AC:'AC', r3BC:'BC', r3ABC:'ABC' };
    for(const [gid,key] of Object.entries(map)){
      const el = svg.querySelector('#'+gid+' .region');
      if(el) el.classList.toggle('on', !!active[key]);
    }
  } else {
    const map = { r2OUT:'OUT', r2A:'A', r2B:'B', r2AB:'AB' };
    for(const [gid,key] of Object.entries(map)){
      const el = svg.querySelector('#'+gid+' .region');
      if(el) el.classList.toggle('on', !!active[key]);
    }
  }
}
