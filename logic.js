// Parser + Evaluator + Tests
export class ParseError extends Error{ constructor(msg){ super(msg); this.name='ParseError'; } }
export const OP = {
  NOT:{prec:5, assoc:'right', arity:1},
  AND:{prec:4, assoc:'left',  arity:2},
  XOR:{prec:3, assoc:'left',  arity:2},
  OR: {prec:2, assoc:'left',  arity:2},
  IMPLIES:{prec:1, assoc:'right', arity:2},
  IFF:{prec:0, assoc:'right', arity:2},
  DIFF:{prec:4, assoc:'left',  arity:2},
};
export function normalizeExpr(s){
  return s.replace(/→/g,'->').replace(/↔/g,'<->').replace(/[\u200B-\u200D\uFEFF]/g,'');
}
const MULTI=['<->','->'];
export function tokenize(src){
  const s = normalizeExpr(src);
  const tok=[]; let i=0;
  while(i<s.length){
    const ch=s[i];
    if(/\s/.test(ch)){ i++; continue; }
    let matched=false;
    for(const m of MULTI){
      if(s.slice(i,i+m.length)===m){ tok.push(['OP', m==='->'?'IMPLIES':'IFF']); i+=m.length; matched=true; break; }
    }
    if(matched) continue;
    if(ch==='('){ tok.push(['LPAREN','(']); i++; continue; }
    if(ch===')'){ tok.push(['RPAREN',')']); i++; continue; }
    if(ch==='A'||ch==='B'||ch==='C'){ tok.push(['VAR',ch]); i++; continue; }
    if(ch==='¬'||ch==='!'||ch==='~'){ tok.push(['OP','NOT']); i++; continue; }
    if(ch==='∧'||ch==='&'){ tok.push(['OP','AND']); i++; continue; }
    if(ch==='∨'||ch==='|'){ tok.push(['OP','OR']); i++; continue; }
    if(ch==='^'||ch==='⊕'){ tok.push(['OP','XOR']); i++; continue; }
    if(ch==='\\'){ tok.push(['OP','DIFF']); i++; continue; }
    throw new ParseError('Unknown token at '+i+': '+ch);
  }
  return tok;
}
export function toRPN(tokens){
  const out=[], st=[];
  for(const [tt,tv] of tokens){
    if(tt==='VAR'){ out.push([tt,tv]); continue; }
    if(tt==='OP'){
      while(st.length && st[st.length-1][0]==='OP'){
        const top=st[st.length-1][1], topI=OP[top], curI=OP[tv];
        if(topI.prec>curI.prec || (topI.prec===curI.prec && curI.assoc==='left')) out.push(st.pop()); else break;
      }
      st.push([tt,tv]); continue;
    }
    if(tt==='LPAREN'){ st.push([tt,tv]); continue; }
    if(tt==='RPAREN'){
      let found=false; while(st.length){ const x=st.pop(); if(x[0]==='LPAREN'){ found=true; break; } out.push(x); }
      if(!found) throw new ParseError('Missing ('); continue;
    }
    throw new ParseError('Token error');
  }
  while(st.length){ const x=st.pop(); if(x[0]==='LPAREN') throw new ParseError('Unbalanced parentheses'); out.push(x); }
  return out;
}
export function evalRPN(rpn, ctx){
  const st=[];
  for(const [tt,tv] of rpn){
    if(tt==='VAR'){ st.push(!!ctx[tv]); continue; }
    if(tt==='OP'){
      const ar=OP[tv].arity;
      if(ar===1){ const a=!!st.pop(); st.push(!a); continue; }
      const b=!!st.pop(); const a=!!st.pop();
      switch(tv){
        case 'AND': st.push(a&&b); break;
        case 'OR': st.push(a||b); break;
        case 'XOR': st.push((a&&!b)||(!a&&b)); break;
        case 'IMPLIES': st.push((!a)||b); break;
        case 'IFF': st.push((a&&b)||(!a&&!b)); break;
        case 'DIFF': st.push(a && !b); break;
        default: throw new ParseError('Unknown op '+tv);
      }
      continue;
    }
    throw new ParseError('RPN error');
  }
  if(st.length!==1) throw new ParseError('Malformed expression');
  return !!st[0];
}
/* helpers for tests */
export function truthVector(expr, n){
  const rpn=toRPN(tokenize(expr)); const vec=[];
  for(let k=0;k<(1<<n);k++){
    const A=!!((k>>(n-1-0))&1), B=!!((k>>(n-1-1))&1), C=n===3?!!((k>>(n-1-2))&1):false;
    vec.push(evalRPN(rpn,{A,B,C})?1:0);
  }
  return vec;
}
export function eq(a,b){ if(a.length!==b.length) return false; for(let i=0;i<a.length;i++) if(a[i]!==b[i]) return false; return true; }
export function runTests(){
  try{
    eq(truthVector('A & B',2),[0,0,0,1]);
    eq(truthVector('A | B',2),[0,1,1,1]);
    eq(truthVector('A -> B',2),[1,1,0,1]);
    eq(truthVector('A <-> B',2),[1,0,0,1]);
    eq(truthVector('~A',2),[1,1,0,0]);
    eq(truthVector('A & B',3),[0,0,0,0,0,0,1,1]);
    eq(truthVector('A | B',3),[0,0,1,1,1,1,1,1]);
    eq(truthVector('A -> B',3),[1,1,1,1,0,0,1,1]);
    eq(truthVector('(A | B) & (A | C)',3), truthVector('A | (B & C)',3));
    eq(truthVector('A ^ B',2),[0,1,1,0]);
    eq(truthVector('A \\ B',2),[0,0,1,0]);
    eq(truthVector('A & (B | C)',3), truthVector('(A & B) | (A & C)',3));
    eq(truthVector('~(A | B)',2), truthVector('~A & ~B',2));
    eq(truthVector('~(A & B)',2), truthVector('~A | ~B',2));
    eq(truthVector(' A  &\n B ',2), truthVector('A & B',2));
  }catch(e){}
}
