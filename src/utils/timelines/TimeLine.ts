type sAnimation = () => void;

class TimelineController {
  private animations: sAnimation[];
  private currentIndex = 0;
  private loopTotal = 0;
  private loopCount = 0;
  private isCircular = false;
  private circularOrder: number[] = [];

  constructor(animations: sAnimation[]) {
    if (animations.length === 0) {
      throw new Error('Timeline must have at least one animation.');
    }
    this.animations = animations;
  }

  /** Instantly jump to n-th animation and play to end */
  seek(n: number) {
    if (n < 0 || n >= this.animations.length) {
      throw new Error('Invalid seek index.');
    }
    this.currentIndex = n;
    this.playFromCurrent();
  }

  /** Skip first n animations, optional steps-based repeated skip */
  skip(n: number, steps?: number) {
    if (n <= 0) return;
    if (n >= this.animations.length) {
      console.warn('Skipping more animations than exist. Timeline cleared.');
      this.animations = [];
      return;
    }

    if (steps) {
      const newList: sAnimation[] = [];
      for (let i = 0; i < this.animations.length; i++) {
        if (i % steps >= n) {
          newList.push(this.animations[i]);
        }
      }
      this.animations = newList;
    } else {
      this.animations = this.animations.slice(n);
    }

    this.currentIndex = 0;
    this.playFromCurrent();
  }

  /**
   * Start circular timeline from index n, loopCount times.
   * loopCount = 0 means infinite.
   */
  circle(n = 0, loopCount = 1) {
    if (n < 0 || n >= this.animations.length) {
      throw new Error('Invalid start index for circle.');
    }

    this.circularOrder = [
      ...this.range(n, this.animations.length),
      ...this.range(0, n)
    ];

    this.loopTotal = loopCount;
    this.loopCount = 0;
    this.isCircular = true;
    this.currentIndex = 0;
    this.playCircular();
  }

  /** Play normal linear timeline from currentIndex */
  private playFromCurrent() {
    if (this.currentIndex >= this.animations.length) return;

    const playNext = () => {
      if (this.currentIndex >= this.animations.length) return;
      this.animations[this.currentIndex]();
      this.currentIndex++;
      setTimeout(playNext, 1000); // Example delay
    };

    playNext();
  }

  /** Play circular timeline with looping */
  private playCircular() {
    if (this.circularOrder.length === 0) return;

    const playNext = () => {
      const animIndex = this.circularOrder[this.currentIndex];
      this.animations[animIndex]();
      this.currentIndex++;

      if (this.currentIndex >= this.circularOrder.length) {
        this.loopCount++;
        if (this.loopTotal === 0 || this.loopCount < this.loopTotal) {
          this.currentIndex = 0;
          setTimeout(playNext, 1000);
        }
      } else {
        setTimeout(playNext, 1000);
      }
    };

    playNext();
  }

  /** Helper: create range [start, end) */
  private range(start: number, end: number): number[] {
    return Array.from({ length: end - start }, (_, i) => start + i);
  }
}
