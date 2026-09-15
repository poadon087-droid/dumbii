/**
 * WebGL post-processing shader pass.
 * Designed for both high-performance 120 FPS execution and visual clarity.
 * Three distinct looks:
 * - "crystal" (FULL CLEAR / CRYSTAL HD): razor-sharp unsharp-mask on ink outlines, zero muddying, pure vibrant cartoon colors.
 * - "crt": aperture grille scanlines, soft glow, subtle aberration, punchy arcade monitor feel.
 * - "vintage": 1930s film sepia, authentic projector flicker and scratches.
 */
export type PostLook = "crystal" | "crt" | "vintage" | "noir";
export type PostUniforms = {
  time: number; flash: number; hurt: number; fog: number; pink: number; slow: number;
  intensity: number; shake: number; grade: [number, number, number]; lookMode: number; low: number;
  /** 0 ink · 1 cel · 2 noir · 3 riso · 4 pixel — see src/game/styles.ts */
  styleMode: number;
  /** low-health heartbeat vignette (pre-pulsed on the CPU) */
  danger: number;
};

const VERT = `attribute vec2 p; varying vec2 v; void main(){ v = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }`;
const FRAG = `precision mediump float;
varying vec2 v; uniform sampler2D tex; uniform vec2 res; uniform vec3 grade;
uniform float time, flash, hurt, fog, pink, slow, intensity, lookMode, low, shake, danger, styleMode;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

vec2 curve(vec2 uv, float amt){
  uv = uv * 2. - 1.;
  vec2 off = abs(uv.yx) * amt;
  uv = uv + uv * off * off;
  return uv * .5 + .5;
}

void main(){
  // lookMode: 0.0 = crystal (full clear), 1.0 = crt, 2.0 = vintage
  float isCrystal = step(lookMode, 0.5);
  float isCrt = step(0.5, lookMode) * step(lookMode, 1.5);
  float isVintage = step(1.5, lookMode) * step(lookMode, 2.5);
  float isNoir = step(2.5, lookMode);

  vec2 uv = curve(v, isCrt * 0.025 + isVintage * 0.015);
  vec2 px = 1.0 / res;
  vec2 dir = uv - 0.5;

  // Chromatic aberration: edge fringe on CRT/Vintage, and on player damage
  float ab = (isCrt * 0.0016 + isVintage * 0.001 + isNoir * 0.0012 + hurt * 0.004 + flash * 0.0015) * intensity;
  vec3 col;
  if (ab > 0.0001 && low < 0.5) {
    col = vec3(
      texture2D(tex, uv + dir * ab).r,
      texture2D(tex, uv).g,
      texture2D(tex, uv - dir * ab).b
    );
  } else {
    col = texture2D(tex, uv).rgb;
  }

  // Crystal mode: unsharp mask to make hand-inked line work razor-sharp!
  if (isCrystal > 0.5 && low < 0.5) {
    vec3 blur = (
      texture2D(tex, uv + vec2(px.x * 1.2, 0.0)).rgb +
      texture2D(tex, uv - vec2(px.x * 1.2, 0.0)).rgb +
      texture2D(tex, uv + vec2(0.0, px.y * 1.2)).rgb +
      texture2D(tex, uv - vec2(0.0, px.y * 1.2)).rgb
    ) * 0.25;
    col = col + (col - blur) * 0.65;
  }

  // CRT & Vintage bloom on bright sparks
  if (low < 0.5 && isCrystal < 0.5) {
    vec3 bl = (
      texture2D(tex, uv + vec2(px.x * 2.5, 0.0)).rgb +
      texture2D(tex, uv - vec2(px.x * 2.5, 0.0)).rgb +
      texture2D(tex, uv + vec2(0.0, px.y * 2.5)).rgb +
      texture2D(tex, uv - vec2(0.0, px.y * 2.5)).rgb
    ) * 0.25;
    float lum = dot(bl, vec3(0.3, 0.59, 0.11));
    col += bl * smoothstep(0.6, 1.0, lum) * 0.45 * intensity;
  }

  // Color grading: crystal stays vibrant; vintage applies sepia blend
  if (isVintage > 0.5) {
    vec3 sep = vec3(
      dot(col, vec3(0.393, 0.769, 0.189)),
      dot(col, vec3(0.349, 0.686, 0.168)),
      dot(col, vec3(0.272, 0.534, 0.131))
    );
    col = mix(col, sep, 0.28 * intensity);
  } else if (isCrt > 0.5) {
    col *= mix(vec3(1.0), grade, 0.15 * intensity);
  }

  // NOIR: hard-contrast silver gelatin — ink becomes truly black, highlights chalk-white
  if (isNoir > 0.5) {
    float l = dot(col, vec3(0.3, 0.59, 0.11));
    float hc = smoothstep(0.22, 0.78, l);
    float bw = mix(l * 0.72, hc, 0.78);
    col = vec3(bw * 0.97, bw, bw * 1.05);
    col *= 0.9 + 0.1 * hash(vec2(floor(time * 16.0), 3.0)); // projector flicker
  }

  // Gameplay feedback washes
  col = mix(col, vec3(0.9, 0.86, 0.8), fog * 0.4 * (0.6 + 0.4 * hash(floor(uv * 7.0) + floor(time * 2.0))));
  col = mix(col, vec3(1.0, 0.55, 0.85), pink * 0.08);
  col = mix(col, vec3(0.35, 0.22, 0.45), slow * 0.22);
  float edgeDist = length(dir);
  col = mix(col, vec3(0.9, 0.15, 0.15), hurt * smoothstep(0.2, 0.75, edgeDist) * 0.85);
  col = mix(col, vec3(0.45, 0.04, 0.08), danger * smoothstep(0.22, 0.8, edgeDist));
  col += flash * 0.6;

  // Scanlines & grain (CRT / Vintage only)
  if (isCrystal < 0.5) {
    float sl = sin(uv.y * res.y * 1.6) * 0.5 + 0.5;
    col *= 1.0 - sl * (isCrt * 0.08 + isVintage * 0.12) * intensity;
    float grain = hash(uv * res + fract(time * 13.7) * 100.0) - 0.5;
    col += grain * (isCrt * 0.03 + isVintage * 0.08 + isNoir * 0.09) * intensity;
    if (isNoir > 0.5) { // vertical film scratches
      float sx = hash(vec2(floor(uv.x * 90.0), floor(time * 7.0)));
      col += sx > 0.996 ? 0.22 : 0.0;
      col -= sx < 0.006 ? 0.18 : 0.0;
    }
  }

  // Vignette
  float vigAmt = isCrystal > 0.5 ? 0.35 : (isNoir > 0.5 ? 0.92 : 0.75);
  float vig = 1.0 - dot(dir * 1.25, dir * 1.25);
  col *= mix(1.0, clamp(vig * 1.3, 0.0, 1.0), vigAmt * intensity);

  // Border mask for curved CRT
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    col = vec3(0.04, 0.03, 0.04);
  }

  // ---- art style. These are not tints: each one changes how the picture is built.
  if (styleMode > 0.5) {
    vec2 px = vec2(1.0) / res;
    if (styleMode < 1.5) {                       // FLAT CEL — hard posterise, no soft anything
      col = clamp((col - 0.5) * 1.22 + 0.5, 0.0, 1.0);      // snap the tones apart first
      float lv = 4.0;
      col = floor(col * lv + 0.5) / lv;
      float lum = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(col, vec3(0.05, 0.04, 0.06), smoothstep(0.15, 0.04, lum) * 0.72);
      col = mix(col, vec3(1.0, 0.97, 0.87), smoothstep(0.78, 0.95, lum) * 0.66);
    } else if (styleMode < 2.5) {                // SILVER NOIR — the bleach keeps one colour
      float lo = min(col.r, min(col.g, col.b)), hi = max(col.r, max(col.g, col.b));
      float lum = dot(col, vec3(0.299, 0.587, 0.114));
      float sat = hi - lo;
      // only a *saturated, dominant* red survives — a warm palette on its own must still bleach,
      // otherwise the whole frame stays red and the look is just a tint
      float keep = clamp((sat - 0.34) * 3.2, 0.0, 1.0) * clamp((col.r - (col.g + col.b) * 0.5) * 4.0, 0.0, 1.0);
      vec3 mono = vec3(clamp((lum - 0.5) * 1.42 + 0.5, 0.0, 1.0));
      col = mix(mono, col * vec3(1.15, 0.2, 0.18), keep);
      col += (hash(uv * res * 0.7 + fract(time * 3.1)) - 0.5) * 0.16;
      // rain: thin diagonal streaks that only exist in this look
      float r = hash(vec2(floor(uv.x * 160.0), floor((uv.y + time * 1.6) * 42.0)));
      col += r > 0.986 ? 0.16 : 0.0;
    } else if (styleMode < 3.5) {                // RISOGRAPH — two inks, printed out of register
      float lv = 3.0;
      float l1 = dot(texture2D(tex, v + px * 1.6).rgb, vec3(0.299, 0.587, 0.114));
      float l2 = dot(texture2D(tex, v - px * 1.6).rgb, vec3(0.299, 0.587, 0.114));
      float l0 = dot(col, vec3(0.299, 0.587, 0.114));
      vec3 mag = vec3(1.0, 0.18, 0.69), cyn = vec3(0.0, 0.78, 0.84), pap = vec3(0.97, 0.92, 0.85);
      float dotScreen = step(0.5, fract((gl_FragCoord.x + gl_FragCoord.y) * 0.25 + l0 * 0.5));
      vec3 a = mix(pap, mag, 1.0 - clamp(l1, 0.0, 1.0));
      vec3 b = mix(pap, cyn, 1.0 - clamp(l2, 0.0, 1.0));
      col = floor(mix(a * b, a + b - pap, dotScreen * 0.35) * lv + 0.5) / lv;
      col += (hash(gl_FragCoord.xy * 0.5 + fract(time * 2.3)) - 0.5) * 0.09;
    } else {                                     // 8-BIT — four shades, ordered dither, no filtering
      vec2 grid = vec2(240.0, 135.0);
      vec2 cq = floor(uv * grid) / (grid - 1.0);
      col = texture2D(tex, clamp(cq, vec2(0.0), vec2(1.0)) ).rgb;
      float lv = 3.0;
      float bayer = mod(gl_FragCoord.x + gl_FragCoord.y * 2.0, 4.0) / 4.0;
      col = floor(col * lv + bayer) / lv;
    }
  }

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

export class PostFX {
  gl: WebGLRenderingContext | null = null;
  /** the pixel look wants hard texel edges, not a smooth blur */
  nearest = false;
  setNearest(on: boolean) {
    if (this.nearest === on) return;
    this.nearest = on;
    const gl = this.gl;
    if (!gl) return;
    const f = on ? gl.NEAREST : gl.LINEAR;
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, f);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, f);
    this.w = 0;   // force the next draw to re-upload at the new size
  }
  private tex: WebGLTexture | null = null;
  private uni: Record<string, WebGLUniformLocation | null> = {};
  private w = 0; private h = 0;
  ok = false;
  /** true while the driver has taken the context away (mobile backgrounding, GPU reset). */
  lost = false;
  onLost?: () => void;
  onRestored?: () => void;

  constructor(private canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl", {
      antialias: false, alpha: false, premultipliedAlpha: false,
      preserveDrawingBuffer: false, powerPreference: "high-performance",
      desynchronized: true
    } as WebGLContextAttributes);
    if (!gl) return;
    this.gl = gl;
    // A lost context that is never handled means a black canvas for the rest of the session.
    // preventDefault() is what lets the browser hand one back, and every resource below is
    // rebuilt from scratch on restore because the driver threw all of them away.
    canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); this.lost = true; this.ok = false; this.onLost?.(); });
    canvas.addEventListener("webglcontextrestored", () => {
      if (!this.gl) return;
      this.w = 0; this.h = 0;
      if (this.init()) { this.lost = false; this.ok = true; this.onRestored?.(); }
    });
    if (this.init()) this.ok = true;
  }

  private init(): boolean {
    const gl = this.gl;
    if (!gl) return false;
    try {
      const sh = (type: number, src: string) => {
        const s = gl.createShader(type)!;
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader");
        return s;
      };
      const prog = gl.createProgram()!;
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error("link");
      gl.useProgram(prog);

      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, "p");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

      this.tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

      for (const n of ["tex", "res", "time", "flash", "hurt", "fog", "pink", "slow", "intensity", "grade", "lookMode", "low", "shake", "danger", "styleMode"]) {
        this.uni[n] = gl.getUniformLocation(prog, n);
      }
      gl.uniform1i(this.uni.tex, 0);
      return true;
    } catch {
      return false;
    }
  }

  draw(src: HTMLCanvasElement, u: PostUniforms) {
    const gl = this.gl;
    if (!gl || !this.ok || gl.isContextLost()) return false;
    if (this.w !== src.width || this.h !== src.height) {
      this.w = src.width;
      this.h = src.height;
      this.canvas.width = src.width;
      this.canvas.height = src.height;
      gl.viewport(0, 0, src.width, src.height);
      gl.uniform2f(this.uni.res, src.width, src.height);
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, src);
    } else {
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGB, gl.UNSIGNED_BYTE, src);
    }
    gl.uniform1f(this.uni.time, u.time);
    gl.uniform1f(this.uni.flash, u.flash);
    gl.uniform1f(this.uni.hurt, u.hurt);
    gl.uniform1f(this.uni.fog, u.fog);
    gl.uniform1f(this.uni.pink, u.pink);
    gl.uniform1f(this.uni.slow, u.slow);
    gl.uniform1f(this.uni.intensity, u.intensity);
    gl.uniform3f(this.uni.grade, u.grade[0], u.grade[1], u.grade[2]);
    gl.uniform1f(this.uni.lookMode, u.lookMode);
    gl.uniform1f(this.uni.low, u.low);
    gl.uniform1f(this.uni.shake, u.shake);
    gl.uniform1f(this.uni.danger, u.danger);
    gl.uniform1f(this.uni.styleMode, u.styleMode ?? 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    return true;
  }
}
