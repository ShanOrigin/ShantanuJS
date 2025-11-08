//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++ ISOMETRIC PROJECTIONS +++++++++++++++
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
/*
      public isometric({
        axisAngle = 30,
        depthAngle = 45,
        depth = 1,
        type = 'r',
        px = 0,
        py = 0,
        isEffect,                                                                                                   callbacks,
        isVEffect
      }: IsometricProps): this | void {
        const m = new DOMMatrix([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

        const theta = (axisAngle * Math.PI) / 180;
        const phi = (depthAngle * Math.PI) / 180;

        const a = Math.cos(theta); // ≈ 0.866
        const b = Math.sin(theta); // ≈ 0.5
        const c = -Math.sin(theta); // ≈ -0.5
        const d = Math.cos(theta); // ≈ 0.866

        const p = depth * Math.cos(phi); // ≈ 0.7071
        const q = depth * Math.sin(phi); // ≈ 0.7071

        m.a = a;
        m.b = c;
        m.c = b;
        m.d = d;

        const mode = this.#typeCheck(type);

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
          callback: callbacks as Function,                                                                            m,
          transformation: 'isometric',
          Ttype: 'isometric',
          isEffect: isEffect ?? true,
          isVEffect: isVEffect ?? true,
          isProjections: this.#isProjection
        });
      }
*/
