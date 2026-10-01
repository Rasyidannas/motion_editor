// Background pre-renderer for CCapture export.
// Extracted from components/bg_purple_style_1.html and bg_purple_style_2.html.
// Originals render a single static frame (u_time frozen at 0.0); we do the same
// once at startup into offscreen canvases so the export compositor can
// drawImage() them every frame without per-frame WebGL cost.
//
// Exports:
//   BGLayers.prerender(width, height) -> Promise<{ purple1: canvas, purple2: canvas }>
//   (white layer is a solid fill, no prerender needed)

(function (global) {
  'use strict';

  var VERT_SRC = [
    'attribute vec2 a_position;',
    'void main() {',
    '  gl_Position = vec4(a_position, 0.0, 1.0);',
    '}'
  ].join('\n');

  var FRAG_COMMON = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH',
    'precision highp float;',
    '#else',
    'precision mediump float;',
    '#endif',
    '',
    'uniform vec3 u_colors[8];',
    'uniform vec4 u_scene;',
    'uniform vec4 u_shape;',
    'uniform vec4 u_surface;',
    'uniform vec4 u_finish;',
    'uniform vec4 u_transform;',
    'uniform vec4 u_space;',
    'uniform vec4 u_cursor;',
    '',
    '#define u_resolution u_scene.xy',
    '#define u_time u_scene.z',
    '#define u_colorCount u_scene.w',
    '#define u_scale u_shape.x',
    '#define u_intensity u_shape.y',
    '#define u_paramA u_shape.z',
    '#define u_warp u_shape.w',
    '#define u_detail u_surface.x',
    '#define u_contrast u_surface.y',
    '#define u_brightness u_surface.z',
    '#define u_saturation u_surface.w',
    '#define u_hue u_finish.x',
    '#define u_vignette u_finish.y',
    '#define u_blur u_finish.z',
    '#define u_grain u_finish.w',
    '#define u_seed mod(u_transform.x, 31.0)',
    '#define u_rotate u_transform.y',
    '#define u_drift u_transform.z',
    '#define u_oklab u_transform.w',
    '#define u_offset u_space.xy',
    '#define u_mouse u_space.zw',
    '#define u_cursorPresence u_cursor.x',
    '#define u_cursorEffect u_cursor.y',
    '#define u_cursorStrength u_cursor.z',
    '#define u_cursorRadius u_cursor.w',
    '',
    'float hash21(vec2 p) {',
    '  p = mod(p, 31.0);',
    '  p = fract(p * vec2(234.34, 435.345));',
    '  p += dot(p, p + 34.23);',
    '  return fract(p.x * p.y);',
    '}',
    '',
    'float grainHash(vec2 p) {',
    '  vec3 p3 = fract(vec3(p.xyx) * 0.1031);',
    '  p3 += dot(p3, p3.yzx + 33.33);',
    '  return fract((p3.x + p3.y) * p3.z);',
    '}',
    '',
    'vec2 hash22(vec2 p) {',
    '  p = mod(p, 31.0);',
    '  float n = sin(dot(p, vec2(41.0, 289.0)));',
    '  return fract(vec2(15731.743, 7892.321) * n);',
    '}',
    '',
    'float noise(vec2 p) {',
    '  vec2 i = floor(p);',
    '  vec2 f = fract(p);',
    '  vec2 u = f * f * (3.0 - 2.0 * f);',
    '  return mix(',
    '    mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),',
    '    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),',
    '    u.y);',
    '}',
    '',
    'float fbm(vec2 p) {',
    '  float v = 0.0;',
    '  float a = 0.5;',
    '  for (int i = 0; i < 5; i++) {',
    '    v += a * noise(p);',
    '    p = p * 2.03 + vec2(17.0, 9.2);',
    '    a *= 0.5;',
    '  }',
    '  return v;',
    '}',
    '',
    'vec3 srgbToLinear(vec3 c) {',
    '  return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)),',
    '    step(0.04045, c));',
    '}',
    'vec3 linearToSrgb(vec3 c) {',
    '  return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055,',
    '    step(0.0031308, c));',
    '}',
    'vec3 linToOklab(vec3 c) {',
    '  float l = 0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b;',
    '  float m = 0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b;',
    '  float s = 0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b;',
    '  l = pow(max(l, 0.0), 1.0 / 3.0);',
    '  m = pow(max(m, 0.0), 1.0 / 3.0);',
    '  s = pow(max(s, 0.0), 1.0 / 3.0);',
    '  return vec3(',
    '    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,',
    '    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,',
    '    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s);',
    '}',
    'vec3 oklabToLin(vec3 c) {',
    '  float l = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;',
    '  float m = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;',
    '  float s = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;',
    '  l = l * l * l; m = m * m * m; s = s * s * s;',
    '  return vec3(',
    '    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,',
    '    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,',
    '    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s);',
    '}',
    'vec3 mixColour(vec3 a, vec3 b, float t) {',
    '  if (u_oklab > 0.5) {',
    '    vec3 la = linToOklab(srgbToLinear(a));',
    '    vec3 lb = linToOklab(srgbToLinear(b));',
    '    return clamp(linearToSrgb(oklabToLin(mix(la, lb, t))), 0.0, 1.0);',
    '  }',
    '  return mix(a, b, t);',
    '}',
    '',
    'vec3 palette(float x) {',
    '  float n = max(u_colorCount - 1.0, 1.0);',
    '  float f = clamp(x, 0.0, 1.0) * n;',
    '  vec3 col = u_colors[0];',
    '  for (int i = 0; i < 7; i++) {',
    '    if (float(i) < n)',
    '      col = mixColour(col, u_colors[i + 1],',
    '        smoothstep(0.0, 1.0, clamp(f - float(i), 0.0, 1.0)));',
    '  }',
    '  return col;',
    '}',
    '',
    'vec3 hueRotate(vec3 col, float a) {',
    '  const mat3 toYIQ = mat3(0.299, 0.596, 0.211,',
    '                          0.587, -0.274, -0.523,',
    '                          0.114, -0.322, 0.312);',
    '  const mat3 toRGB = mat3(1.0, 1.0, 1.0,',
    '                          0.956, -0.272, -1.106,',
    '                          0.621, -0.647, 1.703);',
    '  vec3 yiq = toYIQ * col;',
    '  float ca = cos(a), sa = sin(a);',
    '  yiq = vec3(yiq.x, yiq.y * ca - yiq.z * sa, yiq.y * sa + yiq.z * ca);',
    '  return toRGB * yiq;',
    '}',
    ''
  ].join('\n');

  // Style 1: domain-warped violet field, opaque.
  var SHADE_1 = [
    'vec3 shade(vec2 uv, vec2 p, float t) {',
    '  vec3 acc = u_colors[0] * 0.15;',
    '  float total = 0.15;',
    '  for (int i = 0; i < 8; i++) {',
    '    if (float(i) >= u_colorCount) break;',
    '    float fi = float(i);',
    '    vec2 c = vec2(',
    '      sin(t * (0.21 + fi * 0.071) + fi * 2.4 + u_seed),',
    '      cos(t * (0.17 + fi * 0.093) + fi * 1.7)) * (0.45 + u_intensity * 0.35);',
    '    float w = exp(-dot(p - c, p - c) * 6.0);',
    '    acc += u_colors[i] * w;',
    '    total += w;',
    '  }',
    '  return acc / total;',
    '}',
    ''
  ].join('\n');

  var MAIN_OPAQUE = [
    'void main() {',
    '  vec2 uv = gl_FragCoord.xy / u_resolution.xy;',
    '  vec2 screenUv = uv;',
    '  vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy)',
    '    / min(u_resolution.x, u_resolution.y);',
    '  uv = p * min(u_resolution.x, u_resolution.y) / u_resolution.xy + 0.5;',
    '  p *= u_scale;',
    '  if (abs(u_rotate) > 0.0001) {',
    '    float cr = cos(u_rotate), sr = sin(u_rotate);',
    '    p = mat2(cr, -sr, sr, cr) * p;',
    '  }',
    '  p += u_offset;',
    '  if (u_drift > 0.0001)',
    '    p += u_drift * vec2(sin(u_time * 0.31), cos(u_time * 0.23));',
    '  if (u_warp > 0.0) {',
    '    p += u_warp * (vec2(',
    '      fbm(p * u_detail + u_seed),',
    '      fbm(p * u_detail + vec2(5.2, 1.3))) - 0.5);',
    '  }',
    '  vec3 col = shade(uv, p, u_time);',
    '  if (abs(u_contrast - 1.0) > 0.0001)',
    '    col = (col - 0.5) * u_contrast + 0.5;',
    '  if (abs(u_saturation - 1.0) > 0.0001) {',
    '    float luma = dot(col, vec3(0.299, 0.587, 0.114));',
    '    col = mix(vec3(luma), col, u_saturation);',
    '  }',
    '  if (abs(u_hue) > 0.0001)',
    '    col = hueRotate(col, u_hue);',
    '  if (abs(u_brightness) > 0.0001)',
    '    col += u_brightness;',
    '  if (u_vignette > 0.0001) {',
    '    float vd = length(screenUv - 0.5) * 1.41421356;',
    '    col *= 1.0 - u_vignette * smoothstep(0.35, 1.0, vd);',
    '  }',
    '  if (u_grain > 0.0001)',
    '    col += (grainHash(',
    '      gl_FragCoord.xy + vec2(u_seed * 17.0, u_seed * 31.0)) - 0.5) * u_grain;',
    '  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);',
    '}'
  ].join('\n');

  // Style 2: palette-band field, transparent where near-white.
  var SHADE_2 = [
    'vec3 shade(vec2 uv, vec2 p, float t) {',
    '  float y = uv.y',
    '    + sin(uv.x * (3.0 + u_intensity * 9.0) + t * 0.8) * 0.08',
    '    + (fbm(p * 2.0 + t * 0.1) - 0.5) * u_intensity * 0.6;',
    '  return palette(y);',
    '}',
    ''
  ].join('\n');

  var MAIN_ALPHA = [
    'void main() {',
    '  vec2 uv = gl_FragCoord.xy / u_resolution.xy;',
    '  vec2 screenUv = uv;',
    '  vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy)',
    '    / min(u_resolution.x, u_resolution.y);',
    '  uv = p * min(u_resolution.x, u_resolution.y) / u_resolution.xy + 0.5;',
    '  p *= u_scale;',
    '  if (abs(u_rotate) > 0.0001) {',
    '    float cr = cos(u_rotate), sr = sin(u_rotate);',
    '    p = mat2(cr, -sr, sr, cr) * p;',
    '  }',
    '  p += u_offset;',
    '  if (u_drift > 0.0001)',
    '    p += u_drift * vec2(sin(u_time * 0.31), cos(u_time * 0.23));',
    '  if (u_warp > 0.0) {',
    '    p += u_warp * (vec2(',
    '      fbm(p * u_detail + u_seed),',
    '      fbm(p * u_detail + vec2(5.2, 1.3))) - 0.5);',
    '  }',
    '  vec3 col = shade(uv, p, u_time);',
    '  if (abs(u_contrast - 1.0) > 0.0001)',
    '    col = (col - 0.5) * u_contrast + 0.5;',
    '  if (abs(u_saturation - 1.0) > 0.0001) {',
    '    float luma = dot(col, vec3(0.299, 0.587, 0.114));',
    '    col = mix(vec3(luma), col, u_saturation);',
    '  }',
    '  if (abs(u_hue) > 0.0001)',
    '    col = hueRotate(col, u_hue);',
    '  if (abs(u_brightness) > 0.0001)',
    '    col += u_brightness;',
    '  if (u_vignette > 0.0001) {',
    '    float vd = length(screenUv - 0.5) * 1.41421356;',
    '    col *= 1.0 - u_vignette * smoothstep(0.35, 1.0, vd);',
    '  }',
    '  if (u_grain > 0.0001)',
    '    col += (grainHash(',
    '      gl_FragCoord.xy + vec2(u_seed * 17.0, u_seed * 31.0)) - 0.5) * u_grain;',
    '  col = clamp(col, 0.0, 1.0);',
    '  float whiteDist = distance(col, vec3(1.0));',
    '  float alpha = smoothstep(0.0, 0.35, whiteDist);',
    '  gl_FragColor = vec4(col, alpha);',
    '}'
  ].join('\n');

  var PARAMS_1 = {
    colors: [
      [1.0, 1.0, 1.0],
      [0.18, 0.063, 0.396],
      [0.427, 0.157, 0.851],
      [0.545, 0.361, 0.965],
      [0.655, 0.545, 0.98],
      [0.769, 0.71, 0.992],
      [0.929, 0.914, 0.996],
      [0.929, 0.914, 0.996]
    ],
    colorCount: 6, scale: 1.4, intensity: 0.72, paramA: 0.55, warp: 0.35,
    detail: 3.4, contrast: 0.95, brightness: -0.04, saturation: 1.15,
    hue: 0.0, vignette: 0.75, blur: 0, grain: 0.12, seed: 7280,
    rotate: 0.0, offsetX: 0.0, offsetY: 0.0, drift: 0.08, oklab: 0,
    alpha: false
  };

  var PARAMS_2 = {
    colors: [
      [1.0, 1.0, 1.0],
      [0.545, 0.361, 0.965],
      [0.769, 0.71, 0.992],
      [0.929, 0.914, 0.996],
      [0.929, 0.914, 0.996],
      [0.929, 0.914, 0.996],
      [0.929, 0.914, 0.996],
      [0.929, 0.914, 0.996]
    ],
    colorCount: 4, scale: 1.08, intensity: 0.62, paramA: 0.5, warp: 0.24,
    detail: 2.912, contrast: 1.158, brightness: 0, saturation: 1.0,
    hue: 0.0, vignette: 0, blur: 0, grain: 0.042, seed: 1,
    rotate: 4.0841, offsetX: 0.0, offsetY: 0.0, drift: 0, oklab: 0,
    alpha: true
  };

  function renderOne(width, height, params, shadeSrc, mainSrc) {
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var gl = canvas.getContext('webgl', params.alpha
      ? { antialias: false, alpha: true, premultipliedAlpha: false }
      : { antialias: false });
    if (!gl) {
      // No WebGL: fall back to a flat fill approximating the palette.
      var c2 = canvas.getContext('2d');
      c2.fillStyle = params.alpha ? 'rgba(139,92,246,0.55)' : '#2e1065';
      c2.fillRect(0, 0, width, height);
      return canvas;
    }
    if (params.alpha) gl.clearColor(0, 0, 0, 0);

    function compile(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        throw new Error('BG shader compile failed: ' + gl.getShaderInfoLog(s));
      }
      return s;
    }
    var prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT_SRC));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG_COMMON + shadeSrc + mainSrc));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error('BG shader link failed: ' + gl.getProgramInfoLog(prog));
    }
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var aPos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    var flat = [];
    for (var i = 0; i < 8; i++) {
      flat.push(params.colors[i][0], params.colors[i][1], params.colors[i][2]);
    }
    gl.uniform3fv(gl.getUniformLocation(prog, 'u_colors'), new Float32Array(flat));
    // Frozen time, like the originals (renderOnce with t = 0), cursor off.
    gl.uniform4f(gl.getUniformLocation(prog, 'u_scene'), width, height, 0.0, params.colorCount);
    gl.uniform4f(gl.getUniformLocation(prog, 'u_shape'), params.scale, params.intensity, params.paramA, params.warp);
    gl.uniform4f(gl.getUniformLocation(prog, 'u_surface'), params.detail, params.contrast, params.brightness, params.saturation);
    gl.uniform4f(gl.getUniformLocation(prog, 'u_finish'), params.hue, params.vignette, params.blur, params.grain);
    gl.uniform4f(gl.getUniformLocation(prog, 'u_transform'), params.seed, params.rotate, params.drift, params.oklab);
    gl.uniform4f(gl.getUniformLocation(prog, 'u_space'), params.offsetX, params.offsetY, 0, 0);
    gl.uniform4f(gl.getUniformLocation(prog, 'u_cursor'), 0, 2, 0.65, 0.46);
    gl.viewport(0, 0, width, height);
    if (params.alpha) gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    return canvas;
  }

  var BGLayers = {
    prerender: function (width, height) {
      return {
        purple1: renderOne(width, height, PARAMS_1, SHADE_1, MAIN_OPAQUE),
        purple2: renderOne(width, height, PARAMS_2, SHADE_2, MAIN_ALPHA)
      };
    }
  };

  global.BGLayers = BGLayers;
})(window);
