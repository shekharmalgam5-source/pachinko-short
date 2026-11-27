// PREMIUM look layer (see review_premium/PREMIUM_REPORT.md). Two parts, both driven by values in look.ts (LOOK_PREM):
//  1. patchToon(material): world-space additions compiled into every MeshToon material of the look
//     - sun cookie: broken, soft sun patches (off-screen trees / clouds / roof edges) multiplied into the shadow-casting sun only
//     - macro albedo variation: low-frequency painted unevenness on big surfaces (walls, street, sidewalk) instead of one flat fill
//     - ground contact: surfaces darken toward the ground (painted "sky occlusion" at wall bases, car sills, posts)
//     - toon specular + fresnel sheen for glossy materials (userData.gloss): car paint, enamel, metal
//  2. AOPass: screen-space ambient occlusion (depth only, half res, depth-aware blur) + subject light pool and foreground
//     shade, composited before tone mapping. Corners, bases, under awnings and cars get contact darkness.
import * as THREE from 'three';
import {Pass, Effect, BlendFunction} from 'postprocessing';

// ---------------------------------------------------------------- tileable value-noise texture (R = fbm, G = blob mask)
const R = (s: number) => () => ((s = (s * 16807 + 11) % 2147483647) / 2147483647);
function noiseTex(): THREE.Texture | null {
  if (typeof document === 'undefined') return null;
  const N = 256, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d')!, img = g.createImageData(N, N);
  const rnd = R(77), lat = (p: number) => { const a = new Float32Array(p * p); for (let i = 0; i < a.length; i++) a[i] = rnd(); return a; };
  const oct = [4, 8, 16, 32].map((p) => ({p, v: lat(p)}));
  const blob = {p: 6, v: lat(6)}, blob2 = {p: 13, v: lat(13)};
  const s = (t: number) => t * t * (3 - 2 * t);
  const vn = (o: {p: number; v: Float32Array}, x: number, y: number) => { const fx = x * o.p, fy = y * o.p, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = s(fx - x0), ty = s(fy - y0);
    const q = (i: number, j: number) => o.v[((j % o.p) + o.p) % o.p * o.p + ((i % o.p) + o.p) % o.p];
    return (q(x0, y0) * (1 - tx) + q(x0 + 1, y0) * tx) * (1 - ty) + (q(x0, y0 + 1) * (1 - tx) + q(x0 + 1, y0 + 1) * tx) * ty; };
  const F = new Float32Array(N * N), B = new Float32Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const u = x / N, v = y / N; let f = 0, w = 0, a = 1; for (const o of oct) { f += vn(o, u, v) * a; w += a; a *= 0.55; }
    F[y * N + x] = f / w; B[y * N + x] = vn(blob, u, v) * 0.65 + vn(blob2, u, v) * 0.35;
  }
  // stretch both channels to the full 0..1 range (2nd..98th percentile) so amplitudes in LOOK_PREM mean what they say
  const st = (A: Float32Array) => { const s2 = Array.from(A).sort((p, q) => p - q), lo = s2[Math.floor(A.length * 0.02)], hi = s2[Math.floor(A.length * 0.98)]; for (let i = 0; i < A.length; i++) A[i] = Math.min(1, Math.max(0, (A[i] - lo) / (hi - lo))); };
  st(F); st(B);
  for (let i = 0; i < N * N; i++) { img.data[i * 4] = Math.round(F[i] * 255); img.data[i * 4 + 1] = Math.round(B[i] * 255); img.data[i * 4 + 2] = 0; img.data[i * 4 + 3] = 255; }
  g.putImageData(img, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.NoColorSpace; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; return t;
}

/** shared uniforms of the toon patch (values set every frame from look.ts / Cart.tsx) */
export const PREM = {
  premNoise: {value: noiseTex()},
  premSunDir: {value: new THREE.Vector3(0.5, 0.6, 0.6).normalize()},   // world, toward the sun
  premCookie: {value: new THREE.Vector4(0, 34, 0.42, 0.62)},              // x strength (0 = off), y tile size (m), z..w smoothstep edges of the blob mask
  premMacro: {value: new THREE.Vector4(0, 9, 3.2, 1.6)},                   // x amplitude (0 = off), y big tile (m), z small tile (m), w gain on horizontal surfaces (ground)
  premGround: {value: new THREE.Vector3(0, 0.0, 0.7)},                     // x darkness at y = y0 (0 = off), y y0 (m), z fade height (m)
  premSky: {value: new THREE.Color('#bcd2f0')},                            // fresnel sheen colour
};

const VERT_DECL = 'varying vec3 vPremW;\n';
const VERT_BODY = /* glsl */ `
  { vec4 pw = vec4(transformed, 1.0);
  #ifdef USE_BATCHING
    pw = batchingMatrix * pw;
  #endif
  #ifdef USE_INSTANCING
    pw = instanceMatrix * pw;
  #endif
    vPremW = (modelMatrix * pw).xyz; }
`;
const FRAG_DECL = /* glsl */ `
varying vec3 vPremW;
uniform sampler2D premNoise;
uniform vec3 premSunDir;
uniform vec4 premCookie;
uniform vec4 premMacro;
uniform vec3 premGround;
uniform vec3 premSky;
uniform float premGloss;
float premCookieAt(vec3 p) {
  if (premCookie.x <= 0.0) return 1.0;
  vec3 t1 = normalize(cross(premSunDir, vec3(0.0, 1.0, 0.0)));
  vec3 t2 = cross(t1, premSunDir);
  vec2 q = vec2(dot(p, t1), dot(p, t2)) / premCookie.y;
  float b = texture2D(premNoise, q).g * 0.75 + texture2D(premNoise, q * 2.7 + 0.31).r * 0.25;
  return 1.0 - premCookie.x * (1.0 - smoothstep(premCookie.z, premCookie.w, b));
}
`;

/** compile the premium world-space terms into a MeshToon material (idempotent). gloss: 0 matte .. 1 car paint .. 1.5 chrome */
export function patchToon<T extends THREE.Material>(m: T, gloss = 0): T {
  if ((m as any).userData.premium) return m;
  (m as any).userData.premium = true; (m as any).userData.gloss = gloss;
  const gU = {value: gloss};
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, PREM, {premGloss: gU});
    sh.vertexShader = VERT_DECL + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n' + VERT_BODY);
    sh.fragmentShader = FRAG_DECL + sh.fragmentShader
      // macro variation + ground contact on the albedo (after map + vertex colour)
      .replace('#include <color_fragment>', `#include <color_fragment>
  { vec3 wn = normalize((vec4(normalize(cross(dFdx(vPremW), dFdy(vPremW))), 0.0)).xyz);
    vec2 mq = abs(wn.y) > 0.7 ? vPremW.xz : vec2(vPremW.x + vPremW.z, vPremW.y);
    if (premMacro.x > 0.0) {
      float n = texture2D(premNoise, mq / premMacro.y).r * 0.65 + texture2D(premNoise, mq / premMacro.z + 0.5).r * 0.35;
      diffuseColor.rgb *= 1.0 + premMacro.x * (abs(wn.y) > 0.7 ? premMacro.w : 1.0) * (n - 0.5) * 2.0;
    }
    if (premGround.x > 0.0 && abs(wn.y) < 0.7) diffuseColor.rgb *= 1.0 - premGround.x * (1.0 - smoothstep(premGround.y, premGround.y + premGround.z, vPremW.y));
  }`)
      .replace('#include <lights_fragment_begin>', `vec3 premSpec = vec3(0.0); float premSunK = premCookieAt(vPremW);
#include <lights_fragment_begin>`)
      .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
  if (premGloss > 0.0) {
    float fr = pow(1.0 - saturate(dot(normal, normalize(vViewPosition))), 4.0);
    reflectedLight.directDiffuse += premSpec * premGloss + premSky * fr * 0.22 * premGloss;
  }`);
    // sun cookie + toon specular inside the shadowed directional light (index 0 = the sun)
    sh.fragmentShader = sh.fragmentShader.replace('#include <lights_fragment_begin>', THREE.ShaderChunk.lights_fragment_begin.replace(
      'vDirectionalShadowCoord[ i ] ) : 1.0;',
      `vDirectionalShadowCoord[ i ] ) : 1.0;
		directLight.color *= premSunK;
		if (premGloss > 0.0) { vec3 hh = normalize(directLight.direction + geometryViewDir); float sp = pow(saturate(dot(geometryNormal, hh)), 40.0); premSpec += directLight.color * smoothstep(0.35, 0.6, sp) * 0.55; }`));
  };
  m.customProgramCacheKey = () => 'prem1';
  m.needsUpdate = true;
  return m;
}

// ---------------------------------------------------------------- AO + light pool pass
const FS_VERT = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
const DEPTH_FNS = /* glsl */ `
#include <packing>
uniform sampler2D tDepth; uniform float cNear; uniform float cFar; uniform float p00; uniform float p11;
float zAt(vec2 uv) { return -perspectiveDepthToViewZ(textureLod(tDepth, uv, 0.0).x, cNear, cFar); }
vec3 vpos(vec2 uv, float z) { vec2 n = uv * 2.0 - 1.0; return vec3(n.x * z / p00, n.y * z / p11, -z); }
`;
const AO_FRAG = DEPTH_FNS + /* glsl */ `
uniform vec2 texel;   // of the depth texture (full res)
uniform vec2 resAO;   // AO target size
uniform float radius; uniform float bias; uniform float mode; uniform float gain;
varying vec2 vUv;
#define TAPS 14
void main() {
  float d = textureLod(tDepth, vUv, 0.0).x;
  if (d >= 0.9999) { gl_FragColor = vec4(1.0); return; }
  float z = zAt(vUv); vec3 P = vpos(vUv, z);
  vec2 dx = vec2(texel.x * 2.0, 0.0), dy = vec2(0.0, texel.y * 2.0);
  vec3 r1 = vpos(vUv + dx, zAt(vUv + dx)) - P, l1 = P - vpos(vUv - dx, zAt(vUv - dx));
  vec3 u1 = vpos(vUv + dy, zAt(vUv + dy)) - P, d1 = P - vpos(vUv - dy, zAt(vUv - dy));
  vec3 N = normalize(cross(dot(r1, r1) < dot(l1, l1) ? r1 : l1, dot(u1, u1) < dot(d1, d1) ? u1 : d1));
  if (dot(N, P) > 0.0) N = -N;
  if (mode > 1.5 && mode < 2.5) { gl_FragColor = vec4(vec3(fract(z / 4.0)), 1.0); return; }
  if (mode > 0.5 && mode < 1.5) { gl_FragColor = vec4(N * 0.5 + 0.5, 1.0); return; }
  float rpx = clamp(radius * p11 * 0.5 / z * resAO.y, 3.0, 90.0);   // screen radius in AO px
  float ign = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
  float occ = 0.0;
  for (int i = 0; i < TAPS; i++) {
    float rr = sqrt((float(i) + 0.5) / float(TAPS)) * rpx;
    float a = (float(i) + ign) * 2.39996323;
    vec2 suv = vUv + vec2(cos(a), sin(a)) * rr / resAO;
    float zs = zAt(suv); vec3 v = vpos(suv, zs) - P;
    float vv = dot(v, v), vn = dot(v, N);
    occ += max(0.0, vn - bias * z) * inversesqrt(vv + 1e-4) * max(0.0, 1.0 - vv / (radius * radius));
  }
  gl_FragColor = vec4(vec3(clamp(1.0 - occ / float(TAPS) * (mode > 2.5 ? 12.0 : gain), 0.0, 1.0)), 1.0);
}`;
const BLUR_FRAG = DEPTH_FNS + /* glsl */ `
uniform sampler2D tAO; uniform vec2 dir; varying vec2 vUv;
void main() {
  float z0 = zAt(vUv), s = 0.0, w = 0.0;
  for (int i = -4; i <= 4; i++) { vec2 uv = vUv + dir * float(i); float zz = zAt(uv);
    float k = exp(-float(i * i) / 10.0) * max(0.0, 1.0 - abs(zz - z0) / (0.04 * z0 + 0.02)); s += texture2D(tAO, uv).r * k; w += k; }
  gl_FragColor = vec4(vec3(s / max(w, 1e-4)), 1.0);
}`;
const COMP_FRAG = DEPTH_FNS + /* glsl */ `
uniform sampler2D inputBuffer; uniform sampler2D tAO;
uniform float aoK; uniform vec3 aoCol;
uniform vec2 subj; uniform vec3 pool;   // subject screen uv; pool: x gain at subject, y darkening far from subject, z radius (uv)
uniform vec3 fg; uniform mat3 v2w; uniform float aspect;   // fg: x darkness of ground near camera, y,z: distance band as fraction of focus
uniform float focus; uniform float dbg;
varying vec2 vUv;
void main() {
  vec4 c = texture2D(inputBuffer, vUv);
  if (dbg > 0.5) { gl_FragColor = vec4(vec3(texture2D(tAO, vUv).r), 1.0); return; }
  float d = textureLod(tDepth, vUv, 0.0).x;
  vec3 col = c.rgb;
  if (d < 0.9999) {
    float ao = texture2D(tAO, vUv).r;
    // v15: no AO on paper-white faces (cards standing close together made dark purple half-faces in crowds)
    float mxc = max(c.r, max(c.g, c.b)), mnc = min(c.r, min(c.g, c.b));
    ao = mix(ao, 1.0, smoothstep(0.72, 0.85, mxc) * (1.0 - smoothstep(0.08, 0.18, mxc - mnc)));
    col *= mix(aoCol, vec3(1.0), mix(1.0, ao, aoK));
    if (fg.x > 0.0) {
      float z = zAt(vUv); vec3 P = vpos(vUv, z);
      vec3 N = normalize(cross(dFdx(P), dFdy(P))); vec3 wn = v2w * N;
      float ground = smoothstep(0.75, 0.95, abs(wn.y));
      col *= 1.0 - fg.x * ground * (1.0 - smoothstep(fg.y * focus, fg.z * focus, z));
    }
  }
  vec2 q = (vUv - subj) * vec2(aspect, 1.0);
  float e = exp(-dot(q, q) / (pool.z * pool.z));
  col *= (1.0 - pool.y) + (pool.x + pool.y) * e;
  gl_FragColor = vec4(col, c.a);
}`;
const COPY_FRAG = 'uniform sampler2D tSrc; varying vec2 vUv; void main() { gl_FragColor = texture2D(tSrc, vUv); }';

export type AOOpts = {radius: number; strength: number; bias: number; color: string; scale: number; gain: number};
export class AOPass extends Pass {
  private cam: THREE.PerspectiveCamera;
  private aoRT: THREE.WebGLRenderTarget; private blurRT: THREE.WebGLRenderTarget; private tmpRT: THREE.WebGLRenderTarget;
  private aoMat: THREE.ShaderMaterial; private blurMat: THREE.ShaderMaterial; private compMat: THREE.ShaderMaterial; private copyMat: THREE.ShaderMaterial;
  private fsScene = new THREE.Scene(); private fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); private quad: THREE.Mesh;
  private scaleK: number;
  enabledAO = true;
  constructor(camera: THREE.PerspectiveCamera, o: AOOpts) {
    super('AOPass');
    this.cam = camera; this.needsSwap = false; this.needsDepthTexture = true; this.scaleK = o.scale;
    const rt = (lin: boolean) => new THREE.WebGLRenderTarget(1, 1, {type: THREE.HalfFloatType, minFilter: lin ? THREE.LinearFilter : THREE.NearestFilter, magFilter: lin ? THREE.LinearFilter : THREE.NearestFilter, depthBuffer: false, generateMipmaps: false});
    this.aoRT = rt(true); this.blurRT = rt(true); this.tmpRT = rt(true);
    const dU = () => ({tDepth: {value: null as THREE.Texture | null}, cNear: {value: 0.1}, cFar: {value: 100}, p00: {value: 1}, p11: {value: 1}});
    const fs = (frag: string, u: Record<string, THREE.IUniform>) => new THREE.ShaderMaterial({vertexShader: FS_VERT, fragmentShader: frag, uniforms: u, depthTest: false, depthWrite: false});
    this.aoMat = fs(AO_FRAG, {...dU(), texel: {value: new THREE.Vector2()}, resAO: {value: new THREE.Vector2()}, radius: {value: o.radius}, bias: {value: o.bias}, mode: {value: 0}, gain: {value: o.gain}});
    this.blurMat = fs(BLUR_FRAG, {...dU(), tAO: {value: null}, dir: {value: new THREE.Vector2()}});
    this.compMat = fs(COMP_FRAG, {...dU(), inputBuffer: {value: null}, tAO: {value: this.aoRT.texture}, aoK: {value: o.strength}, aoCol: {value: new THREE.Color(o.color)},
      subj: {value: new THREE.Vector2(0.5, 0.5)}, pool: {value: new THREE.Vector3(0, 0, 0.5)}, fg: {value: new THREE.Vector3(0, 0.3, 0.8)}, v2w: {value: new THREE.Matrix3()}, aspect: {value: 0.5625}, focus: {value: 5}, dbg: {value: 0}});
    this.copyMat = fs(COPY_FRAG, {tSrc: {value: this.tmpRT.texture}});
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.aoMat); this.quad.frustumCulled = false; this.fsScene.add(this.quad);
  }
  /** per frame: AO strength, subject light pool, foreground ground shade */
  set debug(v: number) { this.compMat.uniforms.dbg.value = v > 0 ? 1 : 0; this.aoMat.uniforms.mode.value = Math.max(0, v - 1); }
  set(o: {strength?: number; subj?: THREE.Vector2; pool?: [number, number, number]; fg?: [number, number, number]; focus?: number; radius?: number}) {
    const u = this.compMat.uniforms;
    if (o.strength !== undefined) u.aoK.value = o.strength;
    if (o.subj) (u.subj.value as THREE.Vector2).copy(o.subj);
    if (o.pool) (u.pool.value as THREE.Vector3).set(...o.pool);
    if (o.fg) (u.fg.value as THREE.Vector3).set(...o.fg);
    if (o.focus !== undefined) u.focus.value = o.focus;
    if (o.radius !== undefined) this.aoMat.uniforms.radius.value = o.radius;
  }
  override setDepthTexture(t: THREE.Texture) { for (const m of [this.aoMat, this.blurMat, this.compMat]) m.uniforms.tDepth.value = t; }
  override setSize(w: number, h: number) {
    const aw = Math.max(1, Math.round(w * this.scaleK)), ah = Math.max(1, Math.round(h * this.scaleK));
    this.aoRT.setSize(aw, ah); this.blurRT.setSize(aw, ah); this.tmpRT.setSize(w, h);
    (this.aoMat.uniforms.texel.value as THREE.Vector2).set(1 / w, 1 / h); (this.aoMat.uniforms.resAO.value as THREE.Vector2).set(aw, ah);
    this.compMat.uniforms.aspect.value = w / h;
  }
  override render(renderer: THREE.WebGLRenderer, inputBuffer: THREE.WebGLRenderTarget) {
    const cam = this.cam, e = cam.projectionMatrix.elements, ac = renderer.autoClear; renderer.autoClear = false;
    for (const m of [this.aoMat, this.blurMat, this.compMat]) { const u = m.uniforms; u.cNear.value = cam.near; u.cFar.value = cam.far; u.p00.value = e[0]; u.p11.value = e[5]; }
    (this.compMat.uniforms.v2w.value as THREE.Matrix3).setFromMatrix4(cam.matrixWorld);
    const draw = (m: THREE.ShaderMaterial, t: THREE.WebGLRenderTarget | null) => { this.quad.material = m; renderer.setRenderTarget(t); renderer.render(this.fsScene, this.fsCam); };
    if (this.enabledAO) {
      draw(this.aoMat, this.aoRT);
      if (this.aoMat.uniforms.mode.value > 0) { this.compMat.uniforms.inputBuffer.value = inputBuffer.texture; draw(this.compMat, this.tmpRT); draw(this.copyMat, inputBuffer); renderer.autoClear = ac; return; }
      const aw = this.aoRT.width, ah = this.aoRT.height;
      this.blurMat.uniforms.tAO.value = this.aoRT.texture; (this.blurMat.uniforms.dir.value as THREE.Vector2).set(1.5 / aw, 0); draw(this.blurMat, this.blurRT);
      this.blurMat.uniforms.tAO.value = this.blurRT.texture; (this.blurMat.uniforms.dir.value as THREE.Vector2).set(0, 1.5 / ah); draw(this.blurMat, this.aoRT);
    }
    const k = this.compMat.uniforms.aoK.value; if (!this.enabledAO) this.compMat.uniforms.aoK.value = 0;
    this.compMat.uniforms.inputBuffer.value = inputBuffer.texture;
    draw(this.compMat, this.tmpRT);
    draw(this.copyMat, this.renderToScreen ? null : inputBuffer);
    this.compMat.uniforms.aoK.value = k; renderer.autoClear = ac;
  }
  override dispose() { this.aoRT.dispose(); this.blurRT.dispose(); this.tmpRT.dispose(); for (const m of [this.aoMat, this.blurMat, this.compMat, this.copyMat]) m.dispose(); }
}

// ---------------------------------------------------------------- COLOUR v2 (review_colour/COLOUR_REPORT in LOOK_GUIDE.md)
// Display-referred colour shaping after tone mapping, before the grade. Works on BT.709 chroma (Cb, Cr) of the sRGB-encoded image:
//  - vibrance: saturation gain that peaks on mid-chroma colours (painted walls, awnings, cars) and fades to 0 on near-neutrals
//    (white heads, sidewalk, creams stay clean, no tint pumping) and on already dense colours (no clipping)
//  - hue gains: separate saturation for cool (teal..blue), warm (orange..yellow), red, pink/magenta and green families, so the
//    palette gets an orange-vs-teal structure instead of uniformly louder candy colours
//  - highlight protection: gains fade out above luma `hi` so whites stay white
// Uniforms (look.ts LOOK_COLOUR): vib = [amount, chroma full-gain from, chroma fade start, chroma fade end],
// hue = [cool, warm, red, pink], hue2 = [green, highlight fade start, -, -]
const COLOUR_FRAG = /* glsl */ `
uniform vec4 cvVib;
uniform vec4 cvHue;
uniform vec4 cvHue2;
vec3 cvEnc(vec3 c) { c = clamp(c, 0.0, 1.0); return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c)); }
vec3 cvDec(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), c)); }
float cvWin(float h, float c, float w) { float d = abs(mod(h - c + 540.0, 360.0) - 180.0); return 1.0 - smoothstep(0.0, w, d); }
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec3 s = cvEnc(inputColor.rgb);
  float y = dot(s, vec3(0.2126, 0.7152, 0.0722));
  float cb = (s.b - y) / 1.8556, cr = (s.r - y) / 1.5748;
  float ch = length(vec2(cb, cr));
  float h = mod(degrees(atan(cr, cb)) + 360.0, 360.0);   // 0 blue, ~50 magenta, ~103 red, ~138 orange, ~175 yellow, ~230 green, ~283 cyan, ~325 sky blue
  float wc = smoothstep(0.012, cvVib.y, ch) * (1.0 - smoothstep(cvVib.z, cvVib.w, ch));   // 0 on neutrals and dense colours
  float hl = 1.0 - smoothstep(cvHue2.y, 1.0, y);
  float g = cvVib.x;
  g += cvHue.x * cvWin(h, 318.0, 62.0);   // cool: cyan .. sky .. blue
  g += cvHue.y * cvWin(h, 148.0, 40.0);   // warm: orange .. golden yellow
  g += cvHue.z * cvWin(h, 104.0, 26.0);   // red
  g += cvHue.w * cvWin(h, 50.0, 38.0);    // pink / magenta / violet
  g += cvHue2.x * cvWin(h, 228.0, 40.0);  // green
  vec3 o = vec3(y) + (s - vec3(y)) * (1.0 + g * wc * hl);
  outputColor = vec4(cvDec(clamp(o, 0.0, 1.0)), inputColor.a);
}`;
export type ColourOpts = {vib: [number, number, number, number]; hue: [number, number, number, number]; hue2: [number, number]};
export class ColourEffect extends Effect {
  constructor(o: ColourOpts) {
    super('ColourEffect', COLOUR_FRAG, {blendFunction: BlendFunction.NORMAL, uniforms: new Map<string, THREE.Uniform>([
      ['cvVib', new THREE.Uniform(new THREE.Vector4(...o.vib))], ['cvHue', new THREE.Uniform(new THREE.Vector4(...o.hue))], ['cvHue2', new THREE.Uniform(new THREE.Vector4(o.hue2[0], o.hue2[1], 0, 0))]])});
  }
  set(o: ColourOpts) {
    (this.uniforms.get('cvVib')!.value as THREE.Vector4).set(...o.vib); (this.uniforms.get('cvHue')!.value as THREE.Vector4).set(...o.hue);
    (this.uniforms.get('cvHue2')!.value as THREE.Vector4).set(o.hue2[0], o.hue2[1], 0, 0);
  }
}
