//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++ STEREOGRAPHIC PROJECTIONS +++++++++++++++
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
/*
      public stereographic({
        z,
        type = 'r',
        px = 0,
        py = 0,
        isEffect,
        callbacks,
        isVEffect                                                                                                 }: StereographicProps): this | void {
        const factor = 1 / (1 + z); // Scaling factor derived from stereographic z-depth

        const m = new DOMMatrix([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

        const mode = this.#typeCheck(type);
        const [cx, cy] = this.#getCentre();

        switch (mode) {
          case 'absolute':
          case 'a': {
            [px, py] = [cx, cy];
            m.translateSelf(-px, -py);
            m.scaleSelf(factor, factor); // uniform scaling
            m.translateSelf(px, py);
            break;
          }

          case 'pivot':
          case 'p': {
            m.translateSelf(-px, -py);
            m.scaleSelf(factor, factor);
            m.translateSelf(px, py);
            break;
          }

          case 'relative':
          case 'r':
          default: {
            m.scaleSelf(factor, factor);
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
          transformation: 'stereographic',
          Ttype: 'stereographic',
          isEffect: isEffect ?? true,
          isVEffect: isVEffect ?? true,
          isProjections: this.#isProjection
        });
      }

			*/
