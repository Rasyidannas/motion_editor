import CCapture from 'ccapture.js';

export class RecordManager {
  constructor(fps = 30) {
    this.fps = fps;
    this.isRecording = false;
    this.capturer = null;
  }

  async start() {
    this.isRecording = true;
    this.capturer = new CCapture({
      format: 'mp4',
      framerate: this.fps,
      name: 'animation',
      verbose: false
    });
    await this.capturer.start();
  }

  async captureFrame(canvas) {
    if (this.isRecording && canvas) {
      await this.capturer.capture(canvas);
    }
  }

  async stopAndSave() {
    this.isRecording = false;
    if (this.capturer) {
      await this.capturer.stop();
      await this.capturer.save();
    }
  }
}