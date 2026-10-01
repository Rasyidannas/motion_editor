export class BoxComponent {
  constructor() {
    this.state = { x: 80, rotation: 0 };
  }

  getTimelineParams() {
    return [
      this.state,
      { x: 530, rotation: 720, duration: 3000, ease: 'inOutCubic' },
      500
    ];
  }

  render(ctx, scale = 1) {
    const cx = this.state.x * scale;
    const cy = 250 * scale;
    const hw = 30 * scale;
    const hh = 30 * scale;
    const angle = this.state.rotation * Math.PI / 180;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.fillStyle = '#ffa502';
    ctx.fillRect(-hw, -hh, hw * 2, hh * 2);
    ctx.restore();
  }
}