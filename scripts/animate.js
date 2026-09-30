function animateScene1() {
  const { animate, stagger, spring, createTimeline } = anime;
  const tl = createTimeline();
  tl.add('#word-first, #word-second', {
    opacity: [0, 1],
    scale: [0, 1],
    duration: 400,
    delay: stagger(300),
    ease: spring({ bounce: 0.15, duration: 400 }),
  }, 3000)
  .add('#black-box', {
    width: [0, '6rem'],
    opacity: [0, 1],
    scale: [0, 1],
    duration: 600,
    ease: spring({ bounce: 0.35, duration: 600 }),
    onBegin: () => document.querySelector('#black-box video')?.play(),
  })
  .add('#black-box', {
    rotate: 5,
    duration: 400,
    delay: 500,
    ease: 'outCubic',
  }).add('#word-first, #word-second, #black-box', {
    opacity:[1, 0],
    delay: 800,
    duration: 100,
    ease: 'outCubic',
    onComplete: () => {
      fetch('content/scene_2.html')
        .then(r => r.text())
        .then(html => {
          document.getElementById('scene-container').innerHTML = html;
          animateScene2();
        });
    }
  });
}

function animateScene2() {
  const { animate, stagger, spring, cubicBezier, createTimeline } = anime;
  const tl = createTimeline();
  tl.add('#scene_2', {
    opacity: [0, 1],
    duration: 100,
    delay: stagger(300),
    ease: 'outCubic',
  }).add('#scene_2', {
    left: ['200rem', '60rem'],
    duration: 2500,
    ease: cubicBezier(0.341,0.362,0.659,0.665),
  }).add('#scene_2', {
    scale: [10, 1],
    left: ['60rem', '0rem'],
    duration: 1,
    ease: 'linear'
  }).add('#btn-publish', {
    opacity: [0, 1],
    scale: [1.25, 1],
    duration: 700,
    ease: spring({ bounce: 0.5, duration: 700 }),
    onBegin: () => {
      document.querySelector('#btn-publish').style.display = '';
      const parts = document.querySelectorAll('#btn-publish svg circle, #btn-publish svg path');
      parts.forEach(el => {
        const len = el.getTotalLength();
        el.style.strokeDasharray = len;
        el.style.strokeDashoffset = len;
      });
      animate(parts, {
        strokeDashoffset: 0,
        duration: 900,
        delay: stagger(120),
        ease: 'inOutCirc',
      });
    },
  }).add('#cursor', {
    translate: ['50vw -10vh', '45vw 50vh'],
    duration: 900,
    ease: 'inOutCubic',
    onBegin: () => { document.querySelector('#cursor').style.display = ''; },
  }).add('#btn-publish', {
    scale: [1, 0.9, 1],
    duration: 350,
    ease: 'inOutQuad',
    onBegin: () => {
      // Cursor "click": turn all scene_2 text black
      document.querySelectorAll('#in, #minutes, #btn-publish a').forEach((el) => {
        el.classList.remove('bg-clip-text', 'text-transparent');
        el.style.backgroundImage = 'none';
        el.style.color = '#000';
      });
    },
  }).add('#bg-frame-2', {
    clipPath: ['circle(0% at 50% 50%)', 'circle(150% at 50% 50%)'],
    duration: 100,
    ease: 'inOutCubic',
  }, '<<')
  .add('#scene_2', {
    opacity: [1, 0],
    y: [0, -80],
    duration: 400,
    delay: 1200,
    ease: 'inCubic',
    onComplete: () => {
      fetch('content/scene_3.html')
        .then(r => r.text())
        .then(html => {
          document.getElementById('scene-container').innerHTML = html;
          animateScene3();
        });
    },
  })
  .add('#bg-frame-3', {
    translateY: ['-100%', '100%'],
    duration: 900,
    ease: 'inOutCubic',
  }, '<<');
}

function animateScene3() {
  const { spring, cubicBezier, createTimeline } = anime;
  const tl = createTimeline();
  tl.add('#scene-container svg', {
    opacity: [0, 1],
    scale: [0.6, 1],
    duration: 700,
    ease: spring({ bounce: 0.4, duration: 700 }),
  })
  .add('#built', {
    opacity: [0, 1],
    y: [40, 0],
    duration: 600,
    ease: spring({ bounce: 0.25, duration: 600 }),
  }, '<-=700')
  .add('#scene_3', {
    y: ['0%', '-50%'],
    duration: 4050,
    delay: 800,
    ease: cubicBezier(0.341,0.362,0.659,0.665),
  })
}
