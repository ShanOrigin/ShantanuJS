import { type ShantanuTypes, Shantanu } from '../../index/index.js';
import { iShape } from '../../shapes/provider/shapesTypes';
import { ShantanuJSError } from '../../utils/errors/core/errors/ShantanuJSError.js';
import { DEV_INTERNAL_ACCESS } from '../../utils/internals/accessKeys.js';
import { getBrowserInfoLegacy } from './browserInfo.js';
import { getCurrentFileInfo, createFileIfNotExists } from './fileHandling.js';

import type {
  verifyParam,
  testInfo,
  constraintsParams,
  Terrors,
  env,
  metaData,
  GeometryCheckResult,
  StyleResult,
  Primitive,
  OracleResult
} from './types';
// ++++++ General export types +++++++
/*
export type infoParams = {
  module: string;
  element: string;
  testType: string;
  description: string;
};

export type Primitive = string | number | boolean;

export type AttrMap = Record<string, Primitive>;

export type NumMap = Record<string, number>;

export type constraintsParams = {
  save?: boolean;
  oracle?: {
    browser?: boolean;
    library?: boolean;
  };
  tolerance?: {
    geometry: number;
  };
};
*/

export type ctxParam = {
  shapes: Record<string, iShape>;
  canvas: Shantanu.Canvas;
};
/*
export type verifyParams = {
  shapes: iShape;
  constraints?: constraintsParams;
  style?: {
    fill?: string;
    strokeColor?: string;
    strokeWidth?: number;
    attrs?: AttrMap;
  };
  geometry?: {
    attr?: NumMap;
    equalTo?: NumMap;
    greaterThan?: NumMap;
    lessThan?: NumMap;
    bbox?: boolean;
  };

  error?: {
    expected: Error;
  };
};
*/
//export type testInfo = infoParams & { id: string };
export type fn = (api: ShantanuTypes, ctx: ctxParam) => void;
export type verifyParams = verifyParam & { shapes: iShape[] };
export type visualTestParams = {
  testInfo: testInfo;
  setup: fn;
  actions: fn;
  expect: verifyParams;
};

// +++++++++ Style export types +++++++++
/*
export type OracleResult = {
  status: 'pass' | 'fail';
  actual: Primitive;
  expected: Primitive;
};
export type StyleResult = {
  library?: Record<string, OracleResult>;
  browser?: Record<string, OracleResult>;
};

// ++++++++ Geometry export types +++++++++

export type GeometryCheckResult = {
  status: 'pass' | 'fail';
  actual: number;
  expected: number;
  delta?: number;
};

export type GeometryResult = {
  library?: Record<string, GeometryCheckResult>;
  browser?: Record<string, GeometryCheckResult>;
};

// +++++++ Error export types +++++++++

export type Terrors = {
  setupErrors: Error[];
  actionErrors: Error[];
  verifyErrors: Error[];
};

*/

// ++++++++ Actual Class ++++++++++

export default class ShantanuJSTestTool {
  #libVersion = '0.0.0';
  #filePath!: URL;

  #idNumber: number = 0; // it will increament per instance for total count test cases done
  #api: ShantanuTypes = Shantanu;
  #ctx = {} as ctxParam;
  #errors: Terrors = {
    setupErrors: [],
    actionErrors: [],
    verifyErrors: []
  };

  #constraints: constraintsParams = {
    save: false,
    oracle: {
      browser: true,
      library: true
    },
    tolerance: {
      geometry: 0.05
    }
  };

  constructor(path: string = import.meta.url) {
    const fileInfo = getCurrentFileInfo(new URL(path));
    const file = createFileIfNotExists(fileInfo);

    if (file == 'already_exists' && this.#idNumber != 0) {
      throw new Error('Only one Object of Test is allowed to create per file ');
    }
  }

  public env({
    initialize,
    run
  }: {
    initialize: (api: ShantanuTypes, ctx: ctxParam) => void;
    run: (ctx: ctxParam) => void;
  }) {
    try {
      initialize(this.#api, this.#ctx);
    } catch (e) {
      console.error('Error in env initialize callback \n...!');
      console.error(e);

      return;
    }

    run(this.#ctx);
  }

  public visualTest(testDef: visualTestParams) {
    // ---- flush previous context -----

    this.#ctx = {} as ctxParam;
    this.#errors = {} as Terrors;

    // ---- 1. Hard validation ----
    this.#validateTest(testDef);

    const { setupErrors, actionErrors, verifyErrors } = this.#errors;
    // ---- 3. Setup phase ----
    try {
      if (testDef.setup) {
        testDef.setup(this.#api, this.#ctx);
        this.#ctx?.canvas.flush();
      }
    } catch (e) {
      setupErrors.push(e as Error);
    }

    if (setupErrors.length > 0) {
      console.error('Error in visualTest setup callback \n...!');
      for (let i = 0; i < setupErrors.length; i++) {
        const err = setupErrors[i];
        console.error(err);
      }
      return;
    }
    // ---- 4. Actions phase ----
    try {
      if (testDef.actions) {
        testDef.actions(this.#api, this.#ctx);
        this.#ctx.canvas.flush();
      }
    } catch (e) {
      this.#errors.actionErrors.push(e as Error);
    }

    if (actionErrors.length > 0) {
      console.error('Error in visualTest action callback \n...!');
      for (let i = 0; i < actionErrors.length; i++) {
        const err = actionErrors[i];
        console.error(err);
      }
      return;
    }
    // ---- 5. Verify phase (READ-ONLY) ----
    try {
      this.#runVerify(testDef.expect, this.#ctx);
    } catch (e) {
      this.#errors.actionErrors.push(e as Error);
    }

    if (verifyErrors.length > 0) {
      console.error('Error in visualTest verify callback \n...!');
      for (let i = 0; i < verifyErrors.length; i++) {
        const err = verifyErrors[i];
        console.error(err);
      }
      return;
    }
    const { testType, element, module } = testDef.testInfo;
    const id = `${testType}-${module}-${element}-${this.#idNumber++}`;
    const canvasId = this.#ctx.canvas.attrs('id') as string;
    const browserInfo = getBrowserInfoLegacy() as env;

    const meta: metaData = {
      info: {
        module,
        testType,
        canvasId
      },
      environment: {
        libraryVersion: this.#libVersion,
        ...browserInfo
      }
    };
  }

  // ============================
  // ===== PRIVATE METHODS ======
  // ============================

  #validateTest(testDef: visualTestParams) {
    if (!testDef.testInfo) throw new Error('Missing test info');
    if (!testDef.setup) throw new Error('Missing setup()');
    if (!testDef.actions) throw new Error('Missing actions()');
    if (!testDef.expect) throw new Error('Missing verify()');
  }

  #runVerify(verifyBlock: verifyParams, ctx: ctxParam) {
    const snapshot = this.#freezeContext(ctx);
    //    const expect =   // read-only expect data given in verifyBlock

    const output = {};

    for (const key of Object.keys(verifyBlock)) {
      try {
        /*
        verifyBlock[key](expect, snapshot);
        output[key] = { status: 'pass' };
				*/
      } catch (err) {
        /* output[key] = {
          status: 'fail',
          message: err.message
        };
				*/
      }
    }

    return output;
  }

  #freezeContext(ctx: ctxParam) {
    // prevent mutation during verify
    Object.freeze(ctx.shapes);

    return Object.freeze(ctx);
  }

  // PRIVATE Helper Methods

  #compareNumber(
    actual: number,
    expected: number,
    tolerance: number,
    mode: 'eq' | 'gt' | 'lt'
  ): GeometryCheckResult {
    const delta = Math.abs(actual - expected);

    let pass = false;

    if (mode === 'eq') pass = delta <= tolerance;
    if (mode === 'gt') pass = actual > expected;
    if (mode === 'lt') pass = actual < expected;

    return {
      actual,
      expected,
      delta,
      status: pass ? 'pass' : 'fail'
    };
  }

  #getOracleFlags() {
    return (
      this.#constraints?.oracle ?? {
        library: true,
        browser: true
      }
    );
  }

  #compare(actual: Primitive, expected: Primitive): OracleResult {
    return {
      actual,
      expected,
      status: actual === expected ? 'pass' : 'fail'
    };
  }
}

// ++++++++ Orchistration ++++++++++

const t = new ShantanuJSTestTool(import.meta.url);

t.env({
  initialize(api, ctx) {
    ctx.canvas = new api.Canvas('tests', 200, 300);
  },
  run(ctx) {
    t.visualTest({
      testInfo: {
        module: '',
        element: '',
        testType: '',
        description: ''
      },
      setup(api, ctx) {
        // any setup required here
        ctx.shapes['line'] = new api.Shapes.Basic.Line(0, 0, 0, 0);

        ctx.canvas.addTo(ctx.shapes.line);
      },
      actions(api, ctx) {
        // any operation perform
        ctx.shapes['extrashape'] = new api.Shapes.Basic.Line(0, 0, 0, 0);
        ctx.canvas.addTo(ctx.shapes.extrashape);
        ctx.shapes.line.attrs({});
        (ctx.shapes.extrashape as iShape).toBack();
      },
      expect: {
        shapes: [ctx.shapes.line],
        constraints: {
          oracle: { browser: true, library: true },
          tolerance: { geometry: 0 },
          save: true
        },
        style: {
          fill: 'red'
        },
        geometry: {
          attr: { x: 5 }
        },
        error: {
          expected: new Error()
        }
      }
    });
  }
});

/*

  #expects: expectParams = {
    constaints: {
      save: false,
      oracle: {
        browser: true,
        library: true
      },
      tolerance: {
        geometry: 0.05
      }
    },
    style: (shape: iShape) => {
      const oracle = this.#getOracleFlags();
      const el = shape.getIFig(DEV_INTERNAL_ACCESS);
      const computed = window.getComputedStyle(el);

      const check = (prop: string, expected: Primitive): StyleResult => {
        const result: StyleResult = {};

        if (oracle.library) {
          const actual = shape.attrs(prop) as Primitive;
          result.library = {
            [prop]: this.#compare(actual, expected)
          };
        }

        if (oracle.browser) {
          const actual = (computed as any)[prop] as Primitive;
          result.browser = {
            [prop]: this.#compare(actual, expected)
          };
        }

        return result;
      };

      return {
        fill: (color: string) => check('fill', color),
        strokeColor: (color: string) => check('stroke', color),
        strokeWidth: (width: number) => check('strokeWidth', width),

        attrs: (attributes: AttrMap): StyleResult[] => {
          return Object.entries(attributes).map(([key, value]) =>
            check(key, value)
          );
        }
      };
    },

    geometry: (shape: iShape) => {
      const oracle = this.#expects.constaints?.oracle ?? {
        library: true,
        browser: true
      };

      const tolerance = this.#expects.constaints?.tolerance.geometry ?? 0.01;

      const el = shape.getIFig(DEV_INTERNAL_ACCESS) as SVGGraphicsElement;
      const browserBBox = el.getBBox();

      const libBBox = shape.getBBox(); // your engine truth

      const compareAttrs = (
        attrs: NumMap,
        mode: 'eq' | 'gt' | 'lt'
      ): GeometryResult => {
        const result: GeometryResult = {};

        if (oracle.library) {
          result.library = {};
          for (const [k, expected] of Object.entries(attrs)) {
            const actual = shape.attrs(k) as number;
            result.library[k] = this.#compareNumber(
              actual,
              expected,
              tolerance,
              mode
            );
          }
        }

        if (oracle.browser) {
          result.browser = {};
          for (const [k, expected] of Object.entries(attrs)) {
            const actual = (browserBBox as any)[k] ?? NaN;
            result.browser[k] = this.#compareNumber(
              actual,
              expected,
              tolerance,
              mode
            );
          }
        }

        return result;
      };

      return {
        // raw attribute equality
        attr: (attributes: NumMap): GeometryResult =>
          compareAttrs(attributes, 'eq'),

        equalTo: (attributes: NumMap): GeometryResult =>
          compareAttrs(attributes, 'eq'),

        greaterThan: (attributes: NumMap): GeometryResult =>
          compareAttrs(attributes, 'gt'),

        lessThan: (attributes: NumMap): GeometryResult =>
          compareAttrs(attributes, 'lt'),

        bbox: ({
          x,
          y,
          width,
          height
        }: {
          x: number;
          y: number;
          width: number;
          height: number;
        }): GeometryResult => {
          const expected = { x, y, width, height };

          const result: GeometryResult = {};

          if (oracle.library) {
            result.library = {
              x: this.#compareNumber(libBBox.x, x, tolerance, 'eq'),
              y: this.#compareNumber(libBBox.y, y, tolerance, 'eq'),
              width: this.#compareNumber(libBBox.width, width, tolerance, 'eq'),
              height: this.#compareNumber(
                libBBox.height,
                height,
                tolerance,
                'eq'
              )
            };
          }

          if (oracle.browser) {
            result.browser = {
              x: this.#compareNumber(browserBBox.x, x, tolerance, 'eq'),
              y: this.#compareNumber(browserBBox.y, y, tolerance, 'eq'),
              width: this.#compareNumber(
                browserBBox.width,
                width,
                tolerance,
                'eq'
              ),
              height: this.#compareNumber(
                browserBBox.height,
                height,
                tolerance,
                'eq'
              )
            };
          }

          return result;
        }
      };
    },

    errors: () => {
      return {
        throws: (
          action: () => void,
          expected: ErrorExpectation
        ): ErrorResult => {
          const result: ErrorResult = {};

          let thrown: Error | null = null;

          try {
            action();
          } catch (e) {
            thrown = e as Error;
          }

          if (!thrown) {
            result.library = {
              status: 'fail',
              expected,
              message: 'Expected error to be thrown, but none was thrown'
            };
            return result;
          }

          const check: ErrorCheckResult = {
            status: 'pass',
            expected,
            actual: {
              name: thrown.name
            }
          };

          if (expected.type && !(thrown instanceof expected.type)) {
            check.status = 'fail';
            check.message = 'Error type mismatch';
          }

          if (
            expected.code &&
            thrown instanceof ShantanuJSError &&
            thrown.code !== expected.code
          ) {
            check.status = 'fail';
            check.message = 'Error code mismatch';
          }

          if (
            expected.source &&
            thrown instanceof ShantanuJSError &&
            thrown.source !== expected.source
          ) {
            check.status = 'fail';
            check.message = 'Error source mismatch';
          }

          if (thrown instanceof ShantanuJSError) {
            check.actual!.code = thrown.code;
            check.actual!.source = thrown.source;
          }

          result.library = check;
          return result;
        }
      };
    }
  };

 */

/*
const rectTest = {
  info: {
    id: "shapes-rect-unit-001",
    module: "shapes",
    element: "rect",
    testType: "unit",
    description: "rect fill + bbox",
    save: true
  },

  setup(api, ctx) {
    ctx.shapes.r = new api.Rect(0, 0, 100, 50, { fill: "red" });
    api.canvas.add(ctx.shapes.r);
  },

  actions(api, ctx) {
    ctx.shapes.r.translate(10, 0);
  },

  verify: {
    style(expect, ctx) {
      expect.style(ctx.shapes.r).fill("rgb(255, 0, 0)");
    },
    geometry(expect, ctx) {
      expect.geometry(ctx.shapes.r).bbox({ x: 10, y: 0, w: 100, h: 50 });
    }
  }
};
*/
