/* MNEMO — fundo em shader WebGL (tinta líquida em espiral) */
'use strict';
(function () {
  const BG = M.bg = { target: null, cur: null, intensity: 0, tInt: 0, ok: false };
  const PALETTES = {
    menu: [[0.09, 0.05, 0.22], [0.42, 0.16, 0.62], [0.05, 0.55, 0.62]],
    run: [[0.04, 0.07, 0.16], [0.13, 0.32, 0.55], [0.36, 0.14, 0.55]],
    boss: [[0.12, 0.02, 0.05], [0.55, 0.06, 0.16], [0.75, 0.32, 0.08]],
    shop: [[0.03, 0.10, 0.09], [0.06, 0.42, 0.35], [0.55, 0.45, 0.10]],
    win: [[0.10, 0.06, 0.02], [0.75, 0.50, 0.10], [0.85, 0.25, 0.55]],
    lose: [[0.05, 0.03, 0.06], [0.22, 0.08, 0.18], [0.20, 0.18, 0.28]],
  };
  BG.set = (name) => { BG.target = PALETTES[name] || PALETTES.menu; };
  BG.setPal = (pal) => { BG.target = pal; };

  const FS = `
precision mediump float;
uniform vec2 R; uniform float T; uniform vec3 C1; uniform vec3 C2; uniform vec3 C3; uniform float I;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
float fbm(vec2 p){ float v=0., a=.5; mat2 m=mat2(1.6,1.2,-1.2,1.6); for(int i=0;i<5;i++){ v+=a*n(p); p=m*p; a*=.5;} return v; }
void main(){
  vec2 uv = (gl_FragCoord.xy - .5*R) / min(R.x,R.y);
  float t = T * (0.035 + I*0.05);
  float r = length(uv);
  float ang = atan(uv.y, uv.x) + (1.2 + I*1.5) / (r + .6) * sin(t*2.) * .6 + t;
  vec2 p = vec2(cos(ang), sin(ang)) * r * 2.2;
  vec2 q = vec2(fbm(p + t), fbm(p - t + 3.1));
  vec2 w = vec2(fbm(p + 3.*q + vec2(1.7, 9.2) + t*1.3), fbm(p + 3.*q + vec2(8.3, 2.8) - t));
  float f = fbm(p + 2.5*w);
  vec3 col = mix(C1, C2, smoothstep(.2, .8, f));
  col = mix(col, C3, smoothstep(.45, .95, w.x) * .75);
  float bands = smoothstep(.48,.5, fract(f*6. + t)) - smoothstep(.5,.52, fract(f*6. + t));
  col += bands * .035 * (1. + I*2.);
  col *= 1. - r*.55;
  col += (h(gl_FragCoord.xy + fract(T)) - .5) * .035;
  gl_FragColor = vec4(col, 1.);
}`;
  const VS = 'attribute vec2 a; void main(){ gl_Position = vec4(a,0.,1.); }';

  BG.init = (canvas) => {
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
    if (!gl) { canvas.style.background = 'radial-gradient(circle at 50% 40%, #3a1e6e, #0b0820)'; return; }
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.warn(gl.getShaderInfoLog(s)); return s; };
    const pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(pr); gl.useProgram(pr);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = (n) => gl.getUniformLocation(pr, n);
    const uR = U('R'), uT = U('T'), u1 = U('C1'), u2 = U('C2'), u3 = U('C3'), uI = U('I');
    BG.cur = JSON.parse(JSON.stringify(PALETTES.menu)); if (!BG.target) BG.target = PALETTES.menu;
    BG.ok = true;
    const scale = 0.5;
    function resize() {
      canvas.width = Math.floor(innerWidth * scale); canvas.height = Math.floor(innerHeight * scale);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    addEventListener('resize', resize); resize();
    const t0 = performance.now();
    let last = 0;
    function frame(now) {
      requestAnimationFrame(frame);
      if (now - last < 1000 / 40) return; // ~40fps é suficiente para o fundo
      last = now;
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) BG.cur[i][j] += (BG.target[i][j] - BG.cur[i][j]) * 0.03;
      BG.intensity += (BG.tInt - BG.intensity) * 0.04;
      gl.uniform2f(uR, canvas.width, canvas.height);
      gl.uniform1f(uT, (now - t0) / 1000 * (M.reduceMotion ? 0.3 : 1));
      gl.uniform3fv(u1, BG.cur[0]); gl.uniform3fv(u2, BG.cur[1]); gl.uniform3fv(u3, BG.cur[2]);
      gl.uniform1f(uI, BG.intensity);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    requestAnimationFrame(frame);
  };
})();
