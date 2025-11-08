//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++ OBLIQUE PROJECTIONS +++++++++++++++
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

/*
      public oblique({
        depth,
        angle,
        type = 'r',
        px = 0,
        py = 0,
        isEffect,
        callbacks,
        isVEffect
      }: ObliqueProps): this | void {
        const m = new DOMMatrix([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

        const mode = this.#typeCheck(type);
        const theta = (angle * Math.PI) / 180;
        const [p, q] = [depth * Math.cos(theta), depth * Math.sin(theta)];

        switch (mode) {
          case 'absolute':
          case 'a': {
            [px, py] = this.#getCentre();
            m.translateSelf(-px, -py);
            [m.m31, m.m32] = [p, q];
            m.translateSelf(px, py);
            break;
          }

          case 'pivot':
          case 'p': {
            m.translateSelf(-px, -py);
            [m.m31, m.m32] = [p, q];
            m.translateSelf(px, py);
            break;
          }

          case 'relative':
          case 'r':
          default: {
            [m.m31, m.m32] = [p, q];

            break;
          }
        }

        if (!isEffect && !isVEffect) {
          this.#batchTMatrix(m);
          return this;
        }

        this.#affect({
          callback: callbacks as Function,
          m,
          transformation: 'oblique',
          Ttype: 'oblique',
          isEffect: isEffect ?? true,                                                                                 isVEffect: isVEffect ?? true,
          isProjections: this.#isProjection
        });
      }
*/
