//++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++ PROJECTIONS NOT WORKABLE  +++++++++++++++
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++ PERSPECTIVE PROJECTIONS +++++++++++++++
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

/* 
public perspective({
        g,
        h,                                                                                                          type = 'r',
        px = 0,
        py = 0,
        isEffect,
        callbacks,
        isVEffect
      }: PerspectiveProps): this | void {
        const m = new DOMMatrix([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

        this.#isProjection = true;

        const mode = this.#typeCheck(type);

        switch (mode) {
          case 'absolute':
          case 'a': {
            [px, py] = this.#getCentre();
            m.translateSelf(-px, -py);
            [m.m31, m.m32] = [g, h];
            m.translateSelf(px, py);
            break;
          }

          case 'pivot':
          case 'p': {
            m.translateSelf(-px, -py);
            [m.m31, m.m32] = [g, h];
            m.translateSelf(px, py);
            break;
          }

          case 'relative':
          case 'r': {
            [m.m31, m.m32] = [g, h];

            break;
          }
        }

        if (this.#isBatching) {
          this.#batchTMatrix(m);
          return this;
        }

      // comented 
        if (this.#isProjection && this.geometry.TList?.[0]) {
          const CTM = (this.geometry.TList[0].TMatrix ??
            new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1])) as Float32Array;
          // cumulativ Transformation matrix [ a , b , 0 , c , d , 0 , e , f  ,1 ] Column major matrix

          const CNTM = m.multiplySelf(
            new DOMMatrix([CTM[0], CTM[1], CTM[3], CTM[4], CTM[6], CTM[7]])
          );
          this.geometry.TList[0].TMatrix = new Float32Array([
            CNTM.a,
            CNTM.b,
            CNTM.m31,
            CNTM.c,
            CNTM.d,
            CNTM.m32,
            CNTM.e,                                                                                                     CNTM.f,
            1
          ]);
        }
      // 

        console.error('in perspective method');
        console.log(JSON.stringify(m));

        this.#affect({
          callback: callbacks as Function,                                                                            m,
          transformation: 'perspective',
          Ttype: 'perspective',
          isEffect: isEffect ?? true,
          isVEffect: isVEffect ?? true,
          isProjections: this.#isProjection
        });
      }
*/
