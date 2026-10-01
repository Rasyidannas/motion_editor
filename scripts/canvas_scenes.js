// Deterministic canvas renderer for CCapture export.
// Re-implements content/scene_1..4 + scripts/animate.js as pure functions of
// time t (seconds). renderAt(ctx, t) draws the exact frame for t, so the
// exporter can step t += 1/fps and capture frame-perfect video (including the
// <video> element, which is seeked to the matching timestamp per frame).
//
// Layout targets 1920x1080. Element sizes use 1rem = 16px like the DOM source.
(function (global) {
  'use strict';

  var E = null; // ExportTL, bound on init
  var W = 1920, H = 1080;

  var assets = {
    video: null,
    globe: null,    // Image
    cursor: null,   // Image
    s3icons: [],    // Images[5]
    frames: null    // pre-decoded logo clip: { fps, list: [canvas...] }
  };
  // Timestamp of the logo clip needed by the frame currently being drawn.
  // Set by renderAt() from videoTimeFor(); -1 when no video is visible.
  var currentVt = -1;

  // Frame-accurate logo image for the current frame. Prefers the pre-decoded
  // store (used during CCapture export, where the live <video> element must
  // not be touched) and falls back to the live video element (preview mode).
  function videoFrame() {
    if (assets.frames && currentVt >= 0) {
      var idx = Math.max(0, Math.min(assets.frames.list.length - 1,
        Math.round(currentVt * assets.frames.fps)));
      return assets.frames.list[idx] || null;
    }
    if (assets.video && assets.video.readyState >= 2) return assets.video;
    return null;
  }
  function videoFrameSize(vf) {
    if (vf instanceof HTMLVideoElement) return [vf.videoWidth || 2160, vf.videoHeight || 2160];
    return [vf.width, vf.height];
  }

  var FONT = '"Inter", "Segoe UI", system-ui, -apple-system, sans-serif';

  // --- inline SVGs (copied from content/scene_*.html) -----------------------
  var SVG_GLOBE =
    '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>';
  var SVG_CURSOR =
    '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24"><path fill="#000000" d="M20.8,9.4,4.87,2.18A2,2,0,0,0,2.18,4.87h0L9.4,20.8A2,2,0,0,0,11.27,22h.25a2.26,2.26,0,0,0,2-1.8l1.13-5.58,5.58-1.13a2.26,2.26,0,0,0,1.8-2A2,2,0,0,0,20.8,9.4Z"/></svg>';
  var SVG_S3 = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 640 640"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#8b5cf6"/><stop offset="100%" stop-color="#7c3aed"/></linearGradient></defs><path fill="url(#g)" d="M246.9 82.3L271 67.8C292.6 54.8 317.3 48 342.5 48C379.3 48 414.7 62.6 440.7 88.7L504.6 152.6C519.6 167.6 528 188 528 209.2L528 240.1L547.7 259.8C563.3 244.2 588.6 244.2 604.3 259.8C620 275.4 619.9 300.7 604.3 316.4L540.3 380.4C524.7 396 499.4 396 483.7 380.4C468 364.8 468.1 339.5 483.7 323.8L464 304L433.1 304C411.9 304 391.5 295.6 376.5 280.6L327.4 231.5C312.4 216.5 304 196.1 304 174.9L304 162.2C304 151 298.1 140.5 288.5 134.8L246.9 109.8C236.5 103.6 236.5 88.6 246.9 82.4zM50.7 466.7L272.8 244.6L363.3 335.1L141.2 557.2C116.2 582.2 75.7 582.2 50.7 557.2C25.7 532.2 25.7 491.7 50.7 466.7z"/></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/><path d="M20 2v4"/><path d="M22 4h-4"/><circle cx="4" cy="20" r="2"/></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/><path d="m8 13 4-7 4 7"/><path d="M9.1 11h5.7"/></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15.536 11.293a1 1 0 0 0 0 1.414l2.376 2.377a1 1 0 0 0 1.414 0l2.377-2.377a1 1 0 0 0 0-1.414l-2.377-2.377a1 1 0 0 0-1.414 0z"/><path d="M2.297 11.293a1 1 0 0 0 0 1.414l2.377 2.377a1 1 0 0 0 1.414 0l2.377-2.377a1 1 0 0 0 0-1.414L6.088 8.916a1 1 0 0 0-1.414 0z"/><path d="M8.916 17.912a1 1 0 0 0 0 1.415l2.377 2.376a1 1 0 0 0 1.414 0l2.377-2.376a1 1 0 0 0 0-1.415l-2.377-2.376a1 1 0 0 0-1.414 0z"/><path d="M8.916 4.674a1 1 0 0 0 0 1.414l2.377 2.376a1 1 0 0 0 1.414 0l2.377-2.376a1 1 0 0 0 0-1.414l-2.377-2.377a1 1 0 0 0-1.414 0z"/></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z"/></svg>'
  ];
  var S3_LABELS = ['AI Onboarding', 'Localization', 'Design System', 'Integrated Tools'];

  function loadImage(svgText) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = reject;
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgText);
    });
  }

  // --- small canvas helpers -------------------------------------------------
  function rr(ctx, x, y, w, h, r) {
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); return; }
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function whiteGrad(ctx, y0, y1) {
    var g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, '#c3aef3');
    return g;
  }
  function purpleGrad(ctx, y0, y1) {
    var g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, '#8b5cf6');
    g.addColorStop(1, '#7c3aed');
    return g;
  }

  function text(ctx, str, cx, cy, px, fill, weight) {
    ctx.save();
    ctx.font = (weight || 800) + ' ' + px + 'px ' + FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = fill;
    ctx.fillText(str, cx, cy);
    ctx.restore();
    return ctx.measureText(str).width;
  }

  // drawImage cover-fit of a video/canvas into (dx,dy,dw,dh) with extra zoom.
  function drawCover(ctx, src, sw, sh, dx, dy, dw, dh, zoom) {
    var sScale = Math.max(dw / sw, dh / sh) * (zoom || 1);
    var cw = dw / sScale, ch = dh / sScale;
    var sx = (sw - cw) / 2, sy = (sh - cw) / 2;
    // keep vertical centering proportional (square logo video: center crop)
    sy = (sh - ch) / 2;
    ctx.drawImage(src, sx, sy, cw, ch, dx, dy, dw, dh);
  }

  // --- Scene 1: "One-Click [video] Publishing" -------------------------------
  function drawScene1(ctx, lt) {
    var e1 = E.spring(0.15)(E.prog(lt, 5.0, 0.4));
    var e2 = E.spring(0.15)(E.prog(lt, 5.3, 0.4));
    var eb = E.spring(0.35)(E.prog(lt, 5.7, 0.6));
    var tilt = E.outCubic(E.prog(lt, 6.8, 0.4)) * (Math.PI / 180) * 5;
    var fade = E.prog(lt, 8.0, 0.1);

    ctx.save();
    ctx.globalAlpha = 1 - fade;

    var FS = 96, gap = 32, boxFull = 96;
    ctx.font = '800 ' + FS + 'px ' + FONT;
    var w1 = ctx.measureText('One-Click').width;
    var w2 = ctx.measureText('Publishing').width;
    var boxW = Math.max(boxFull * E.clamp01(eb), 0.01);
    var total = w1 + gap + boxW + gap + w2;
    var x = W / 2 - total / 2, cy = H / 2;

    // word 1
    ctx.save();
    ctx.globalAlpha = E.clamp01(e1);
    ctx.translate(x + w1 / 2, cy);
    ctx.scale(Math.max(e1, 0.001), Math.max(e1, 0.001));
    ctx.font = '800 ' + FS + 'px ' + FONT;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = whiteGrad(ctx, -FS / 2, FS / 2);
    ctx.fillText('One-Click', 0, 0);
    ctx.restore();

    // video box
    var bx = x + w1 + gap, bw = boxW, bh = boxFull;
    ctx.save();
    ctx.globalAlpha = E.clamp01(eb);
    ctx.translate(bx + bw / 2, cy);
    ctx.rotate(tilt);
    ctx.scale(Math.max(eb, 0.001), Math.max(eb, 0.001));
    rr(ctx, -bw / 2, -bh / 2, bw, bh, 12);
    ctx.fillStyle = '#000';
    ctx.fill();
    if (bw > 4) {
      var vf1 = videoFrame();
      if (vf1) {
        var vs1 = videoFrameSize(vf1);
        ctx.save();
        rr(ctx, -bw / 2, -bh / 2, bw, bh, 12);
        ctx.clip();
        drawCover(ctx, vf1, vs1[0], vs1[1], -bw / 2, -bh / 2, bw, bh, 2.5);
        ctx.restore();
      }
    }
    ctx.restore();

    // word 2
    ctx.save();
    ctx.globalAlpha = E.clamp01(e2);
    ctx.translate(x + w1 + gap + boxW + gap + w2 / 2, cy);
    ctx.scale(Math.max(e2, 0.001), Math.max(e2, 0.001));
    ctx.font = '800 ' + FS + 'px ' + FONT;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = whiteGrad(ctx, -FS / 2, FS / 2);
    ctx.fillText('Publishing', 0, 0);
    ctx.restore();

    ctx.restore();
  }

  // --- Scene 2: "In [Publish] Minutes" + cursor + wipes -----------------------
  function drawScene2(ctx, lt) {
    var appear = E.outCubic(E.prog(lt, 0, 0.1));
    var slide = E.SLIDE_EASE(E.prog(lt, 0.1, 2.5));
    var snap = E.prog(lt, 2.6, 0.05);
    var scale = E.lerp(E.lerp(10, 10, 0), 1, 0); // placeholder, computed below
    scale = E.lerp(E.lerp(10, 10, slide) , 1, snap);
    var xOff = E.lerp(E.lerp(1.8 * W, 0.55 * W, slide), 0, snap);

    var btnE = E.spring(0.5)(E.prog(lt, 2.65, 0.7));
    var curP = E.inOutCubic(E.prog(lt, 3.35, 0.9));
    var clicked = lt >= 4.25;
    var clickPulse = lt >= 4.25 && lt <= 4.6
      ? 1 - 0.1 * Math.sin(Math.PI * E.prog(lt, 4.25, 0.35)) : 1;
    var outP = E.prog(lt, 5.8, 0.4);
    var outE = E.inCubic(outP);

    ctx.save();
    ctx.globalAlpha = appear * (1 - outE);
    ctx.translate(W / 2 + xOff, H / 2 - 80 * outE);
    ctx.scale(Math.max(scale, 0.01), Math.max(scale, 0.01));

    var FS = 96, gap = 32;
    ctx.font = '800 ' + FS + 'px ' + FONT;
    var wIn = ctx.measureText('In').width;
    var wMin = ctx.measureText('Minutes').width;
    // pill approximating px-6 py-3 + text-xl + icon
    var pillH = 56, pillW = 190;
    var total = wIn + gap + pillW + gap + wMin;
    var x0 = -total / 2;

    function wordGradientFill(str, cx, black) {
      ctx.save();
      ctx.font = '800 ' + FS + 'px ' + FONT;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = black ? '#000' : whiteGrad(ctx, -FS * 0.6, FS * 0.6);
      ctx.fillText(str, cx, 0);
      ctx.restore();
    }
    wordGradientFill('In', x0 + wIn / 2, clicked);
    wordGradientFill('Minutes', x0 + wIn + gap + pillW + gap + wMin / 2, clicked);

    // publish pill
    var pcx = x0 + wIn + gap + pillW / 2;
    ctx.save();
    ctx.translate(pcx, 0);
    ctx.scale(Math.max(btnE, 0.001) * clickPulse, Math.max(btnE, 0.001) * clickPulse);
    ctx.globalAlpha = E.clamp01(btnE);
    // ping rings (after:animate-ping approximation)
    if (!clicked) {
      for (var k = 0; k < 2; k++) {
        var ph = ((lt * 0.9) + k * 0.5) % 1;
        ctx.save();
        ctx.globalAlpha = (1 - ph) * 0.45 * E.clamp01(btnE);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        rr(ctx, -pillW / 2 - ph * 26, -pillH / 2 - ph * 18,
          pillW + ph * 52, pillH + ph * 36, 999);
        ctx.stroke();
        ctx.restore();
      }
    }
    ctx.fillStyle = '#ffffff';
    rr(ctx, -pillW / 2, -pillH / 2, pillW, pillH, 999);
    ctx.fill();
    if (assets.globe) ctx.drawImage(assets.globe, -pillW / 2 + 12, -17, 34, 34);
    ctx.font = '600 21px ' + FONT;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = clicked ? '#000' : purpleGrad(ctx, -12, 12);
    ctx.fillText('Publish', 22, 1);
    ctx.restore();

    // cursor (unscaled: counter-scale so it stays ~48px on screen)
    if (lt >= 3.35 && lt <= 5.8 && assets.cursor) {
      var fx = E.lerp(0.5 * W, 0.45 * W, curP) - (W / 2 + xOff);
      var fy = E.lerp(-0.1 * H, 0.5 * H, curP) - H / 2;
      var inv = 1 / Math.max(scale, 0.01);
      ctx.save();
      ctx.translate(fx, fy);
      ctx.scale(inv, inv);
      ctx.drawImage(assets.cursor, 0, 0, 48, 48);
      ctx.restore();
    }

    ctx.restore();
  }

  // --- Scene 3: icon + headline, then scrolling feature list -------------------
  function drawScene3(ctx, lt) {
    var iconE = E.spring(0.4)(E.prog(lt, 0, 0.7));
    var headE = E.spring(0.25)(E.prog(lt, 0, 0.6));
    var headY = E.lerp(40, 0, E.clamp01(headE));
    var sc = E.SLIDE_EASE(E.prog(lt, 0.9, 5.05));
    var fade = E.prog(lt, 6.15, 0.01);

    ctx.save();
    ctx.globalAlpha = 1 - fade;

    // page 1
    var p1y = H / 2 - sc * H;
    ctx.save();
    ctx.globalAlpha = E.clamp01(iconE);
    ctx.translate(W / 2, p1y - 120);
    ctx.scale(Math.max(iconE, 0.001), Math.max(iconE, 0.001));
    if (assets.s3icons[0]) ctx.drawImage(assets.s3icons[0], -48, -48, 96, 96);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = E.clamp01(headE);
    ctx.font = '800 60px ' + FONT;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000';
    ctx.fillText('Build Production-Ready', W / 2, p1y + 30 + headY);
    ctx.fillText('Sites in Minutes', W / 2, p1y + 105 + headY);
    ctx.restore();

    // page 2 (4 features)
    var p2y = (3 * H) / 2 - sc * H;
    ctx.save();
    ctx.font = '800 60px ' + FONT;
    ctx.textBaseline = 'middle';
    S3_LABELS.forEach(function (label, i) {
      var iy = p2y - 150 + i * 110;
      if (assets.s3icons[i + 1]) ctx.drawImage(assets.s3icons[i + 1], W / 2 - 320, iy - 32, 64, 64);
      ctx.textAlign = 'left';
      ctx.fillStyle = purpleGrad(ctx, iy - 36, iy + 36);
      ctx.fillText(label, W / 2 - 230, iy);
    });
    ctx.restore();

    ctx.restore();
  }

  // --- Scene 4: black box + "Mevin" --------------------------------------------
  function drawScene4(ctx, lt) {
    var bp = E.spring(0.35)(E.prog(lt, 0, 1.0));
    var tp = E.spring(0.25)(E.prog(lt, 0.3, 0.6));
    var css = E.lerp(384, 96, E.clamp01(bp));
    var scl = E.lerp(3.5, 2, E.clamp01(bp));
    var size = Math.max(css * scl, 1);
    var cy = H / 2 - 60;

    ctx.save();
    rr(ctx, W / 2 - size / 2, cy - size / 2, size, size, 12 * scl);
    ctx.fillStyle = '#000';
    ctx.fill();
    if (size > 8) {
      var vf4 = videoFrame();
      if (vf4) {
        var vs4 = videoFrameSize(vf4);
        ctx.save();
        rr(ctx, W / 2 - size / 2, cy - size / 2, size, size, 12 * scl);
        ctx.clip();
        drawCover(ctx, vf4, vs4[0], vs4[1],
          W / 2 - size / 2, cy - size / 2, size, size, 2.5);
        ctx.restore();
      }
    }
    ctx.save();
    ctx.globalAlpha = E.clamp01(tp);
    var ty = cy + size / 2 + 90 + E.lerp(40, 0, E.clamp01(tp));
    ctx.font = '800 60px ' + FONT;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = purpleGrad(ctx, ty - 36, ty + 36);
    ctx.fillText('Mevin', W / 2, ty);
    ctx.restore();
    ctx.restore();
  }

  // --- frame ------------------------------------------------------------------
  // bg: pre-rendered { purple1, purple2 } canvases at W x H.
  var bg = { purple1: null, purple2: null };

  function renderAt(ctx, t) {
    var TL = E.TL;
    t = Math.max(0, Math.min(t, TL.TOTAL));
    currentVt = videoTimeFor(t);

    // background stack
    if (bg.purple1) ctx.drawImage(bg.purple1, 0, 0, W, H);
    else { ctx.fillStyle = '#2e1065'; ctx.fillRect(0, 0, W, H); }

    var WIPE_AT = 12.35, WIPE_DUR = 0.1;
    var BG3_AT = 13.9, BG3_DUR = 0.9;
    if (t >= WIPE_AT) {
      var wp = E.inOutCubic(E.prog(t, WIPE_AT, WIPE_DUR));
      if (wp >= 1) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);
      } else if (wp > 0) {
        var diag = Math.sqrt(W * W + H * H);
        ctx.save();
        ctx.beginPath();
        ctx.arc(W / 2, H / 2, wp * diag * 0.75, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }
    }
    if (t < 8.1) drawScene1(ctx, t);
    else if (t < 14.8) drawScene2(ctx, t - 8.1);
    else if (t < 20.96) drawScene3(ctx, t - 14.8);
    else drawScene4(ctx, t - 20.96);

    // purple2 sweep over everything (transparent layer, like the iframe)
    if (t >= BG3_AT) {
      var b3 = E.inOutCubic(E.prog(t, BG3_AT, BG3_DUR));
      if (b3 < 1 && bg.purple2) {
        ctx.drawImage(bg.purple2, 0, -H + b3 * 2 * H, W, H);
      }
    }
  }

  // video timestamp needed for frame t, or -1 when no video is visible.
  function videoTimeFor(t) {
    if (t < 5.7) return -1;
    if (t < 8.1) return Math.min(t - 5.7, 2.43);
    if (t < 20.96) return -1;
    return Math.min(t - 20.96, 2.43);
  }

  global.CanvasScenes = {
    W: W, H: H,
    init: function (opts) {
      E = global.ExportTL;
      bg = opts.bg;
      assets.video = opts.video;
      return Promise.all([
        loadImage(SVG_GLOBE),
        loadImage(SVG_CURSOR)
      ].concat(SVG_S3.map(loadImage))).then(function (imgs) {
        assets.globe = imgs[0];
        assets.cursor = imgs[1];
        assets.s3icons = imgs.slice(2);
      });
    },
    renderAt: renderAt,
    videoTimeFor: videoTimeFor,
    setFrameStore: function (store) { assets.frames = store; }
  };
})(window);
