#version 300 es
precision highp float;

#include "@motion-canvas/core/shaders/common.glsl"

uniform float u_scale;
uniform float u_intensity;
uniform float u_warp;
uniform float u_detail;
uniform float u_contrast;
uniform float u_brightness;
uniform float u_saturation;
uniform float u_vignette;
uniform float u_grain;
uniform float u_drift;

vec3 paletteColor(int i) {
  if (i == 0) return vec3(0.545, 0.361, 0.965);  // #8b5cf6 purple
  if (i == 1) return vec3(0.769, 0.710, 0.992);  // #c4b5fd lavender
  if (i == 2) return vec3(0.929, 0.914, 0.996);  // #ede9fe near-white
  if (i == 3) return vec3(1.0, 1.0, 1.0);        // white
  if (i == 4) return vec3(0.427, 0.157, 0.851);  // deep purple
  if (i == 5) return vec3(0.18, 0.063, 0.396);   // very dark purple
  if (i == 6) return vec3(0.655, 0.545, 0.980);  // #a78bfa
  return vec3(0.929, 0.914, 0.996);
}

float hash21(vec2 p) {
  p = mod(p, 31.0);
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
    u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(17.0, 9.2);
    a *= 0.5;
  }
  return v;
}

vec3 palette(float x) {
  float n = 7.0;
  float f = clamp(x, 0.0, 1.0) * n;
  vec3 col = paletteColor(0);
  for (int i = 0; i < 7; i++) {
    if (float(i) < n)
      col = mix(col, paletteColor(i + 1),
        smoothstep(0.0, 1.0, clamp(f - float(i), 0.0, 1.0)));
  }
  return col;
}

vec3 shade(vec2 uv, vec2 p, float t) {
  float y = uv.y
    + sin(uv.x * (3.0 + u_intensity * 9.0) + t * 0.8) * 0.08
    + (fbm(p * 2.0 + t * 0.1) - 0.5) * u_intensity * 0.6;
  return palette(y);
}

void main() {
  vec2 uvNorm = screenUV;
  vec2 p = (screenUV - 0.5) * resolution / min(resolution.x, resolution.y);
  p *= u_scale;
  if (u_drift > 0.0001)
    p += u_drift * vec2(sin(time * 0.31), cos(time * 0.23));
  if (u_warp > 0.0) {
    p += u_warp * (vec2(
      fbm(p * u_detail),
      fbm(p * u_detail + vec2(5.2, 1.3))) - 0.5);
  }

  vec3 col = shade(uvNorm, p, time);

  if (abs(u_contrast - 1.0) > 0.0001)
    col = (col - 0.5) * u_contrast + 0.5;
  if (abs(u_saturation - 1.0) > 0.0001) {
    float luma = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(vec3(luma), col, u_saturation);
  }
  if (abs(u_brightness) > 0.0001) col += u_brightness;
  if (u_vignette > 0.0001) {
    float vd = length(uvNorm - 0.5) * 1.41421356;
    col *= 1.0 - u_vignette * smoothstep(0.35, 1.0, vd);
  }
  if (u_grain > 0.0001)
    col += (hash21(p + vec2(1.7, 3.1)) - 0.5) * u_grain;
  outColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}