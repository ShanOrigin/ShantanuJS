//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++ ORTHOGRAPHIC PROJECTIONS +++++++++++++++
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
/*
      public orthographic({
        left,
        right,
        top,
        bottom,
        type = 'r',
        px = 0,                                                                                                     py = 0,
        isEffect,
        callbacks,
        isVEffect
      }: OrthographicProps): this | void {
        const a = 2 / (right - left);
        const d = 2 / (top - bottom);
        const e = -(right + left) / (right - left);
        const f = -(top + bottom) / (top - bottom);

        const m = new DOMMatrix([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

        const mode = this.#typeCheck(type);

        switch (mode) {
          case 'absolute':
          case 'a': {
            [px, py] = this.#getCentre();
            m.translateSelf(-px, -py);
            [m.a, m.d, m.e, m.f, m.m31, m.m32] = [a, d, e, f, e, f];

            m.translateSelf(px, py);

            break;
          }

          case 'pivot':
          case 'p': {
            m.translateSelf(-px, -py);

            [m.a, m.d, m.e, m.f, m.m31, m.m32] = [a, d, e, f, e, f];

            m.translateSelf(px, py);
            break;
          }

          case 'relative':
          case 'r': {
            [m.a, m.d, m.e, m.f, m.m31, m.m32] = [a, d, e, f, e, f];

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
          transformation: 'orthographic',
          Ttype: 'orthographic',
          isEffect: isEffect ?? true,
          isVEffect: isVEffect ?? true,
          isProjections: this.#isProjection
        });
      }
			*/
