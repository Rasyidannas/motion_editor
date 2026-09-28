function animateScene1() {
  const { animate, stagger, spring, createTimeline } = anime;
  const tl = createTimeline();
  tl.add('#scene_1 > div:not(#black-box)', {
    opacity: [0, 1],
    scale: [0, 1],
    duration: 400,
    delay: stagger(300),
    ease: spring({ bounce: 0.35, duration: 400 }),
  })
  .add('#black-box', {
    opacity: [0, 1],
    scale: [0, 1],
    duration: 400,
    ease: spring({ bounce: 0.35, duration: 400 }),
    onBegin: () => { document.querySelector('#black-box').style.display = ''; },
  });
}