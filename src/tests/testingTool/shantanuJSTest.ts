import { type ShantanuTypes, Shantanu } from '../../index/index.js';
import { iShape } from '../../shapes/provider/shapesTypes';

/*
 format of data to store in file 

{
  "shapes-rect-unit-001": {
    "info": { },
    "environment": { },
    "intent": { },
    "conditions": { },
    "results": { },
    "artifacts": { }
  },

  "shapes-rect-combined-002": {
    "...": "..."
  }
 */

type infoParams = {
  module: string;
  element: string;
  testType: string;
  description: string;
  save: boolean;
  oracle: {
    browser: boolean;
    library: boolean;
  };
  tolerance: {
    geometry: number;
  };
};

type outputParam = {
  information: infoParams & { id: string };

  environment: {
    libraryVersion: string;
    browser: {
      name: string;
      version: string;
    };
    platform: string;
    timestamp: string;
    tolerance: {
      geometry: number;
    };
  };

  intent: {
    scope: string[];
    attributes: string[];
    userSimulation: boolean;
    negativeCases: boolean;
  };

  conditions: {
    setup: {
      shapesCreated: string[];
      initialAttributes: Record<string, any>;
    };
    actions: string[];
  };

  results: {
    style: {
      status: 'pass' | 'fail';
      checked: string[];
      expected: Record<string, any>;
      actual: Record<string, any>;
    };
    geometry: {
      status: 'pass' | 'fail';
      checked: string[];
      expected: Record<string, any>;
      actual: Record<string, any>;
      bbox: {
        expected: { x: number; y: number; width: number; height: number };
        actual: { x: number; y: number; width: number; height: number };
        delta: number;
      };
    };
    errors: {
      errorType: string;
      message: string;
    };
  };
};

type ctxParam = {
  canvas: Shantanu.Canvas;
  shapes: iShape[];
  data: {
    expect: Record<string, any>;
    initialValues: Record<string, any>;
    outputValues: Record<string, any>;
  };
} & Record<string, any>; // store all necessary things

type visualTestParams = {
  info: infoParams;
  setup: (api: ShantanuTypes, ctx: ctxParam) => void;
  actions: (api: ShantanuTypes, ctx: ctxParam) => void;
  verify: Record<string, any>;
};

class ShantanuJSTestTool {
  #api: ShantanuTypes = Shantanu;
  #ctx = {} as ctxParam;

  public env({
    initialize,
    run
  }: {
    initialize: (api: ShantanuTypes, ctx: ctxParam) => void;
    run: (api: ShantanuTypes, ctx: ctxParam) => void;
  }) {
    initialize(this.#api, this.#ctx);
    run(this.#api, this.#ctx);
  }

  public visualTest(testDef: visualTestParams) {
    // ---- 1. Hard validation ----
    this.#validateTest(testDef);

    // ---- 3. Setup phase ----
    if (testDef.setup) {
      testDef.setup(this.#api, this.#ctx);
      this.#ctx?.canvas.flush();
    }
    // ---- 4. Actions phase ----
    if (testDef.actions) {
      testDef.actions(this.#api, this.#ctx);
      this.#ctx.canvas.flush();
    }

    // ---- 5. Verify phase (READ-ONLY) ----
    const result = this.#runVerify(testDef.verify, this.#ctx);

    // ---- 6. Record result ----
    if (testDef.info.save === true) {
    }

    return result;
  }

  // ============================
  // ===== PRIVATE METHODS ======
  // ============================

  #validateTest(testDef: visualTestParams) {
    if (!testDef.info) throw new Error('Missing test info');
    if (!testDef.setup) throw new Error('Missing setup()');
    if (!testDef.actions) throw new Error('Missing actions()');
    if (!testDef.verify) throw new Error('Missing verify()');
  }

  #runVerify(verifyBlock: Record<string, any>, ctx: ctxParam) {
    const snapshot = this.#freezeContext(ctx);
    const expect = this.#ctx.data.expect; // read-only expect API

    const output = {};

    for (const key of Object.keys(verifyBlock)) {
      try {
        verifyBlock[key](expect, snapshot);
        output[key] = { status: 'pass' };
      } catch (err) {
        output[key] = {
          status: 'fail',
          message: err.message
        };
      }
    }

    return output;
  }

  #freezeContext(ctx: ctxParam) {
    // prevent mutation during verify
    Object.freeze(ctx.shapes);
    Object.freeze(ctx.data);
    return Object.freeze(ctx);
  }

  #buildRecord(testDef, result) {}
}

const t = new ShantanuJSTestTool();

t.env({
  initialize(api, ctx) {
    ctx.canvas = new api.Canvas('tests', 200, 300);
  },
  run() {
    t.visualTest({
      info: {
        module: '',
        element: '',
        testType: '',
        description: '',
        oracle: { browser: true, library: true },
        tolerance: { geometry: 0 },
        save: true
      },
      setup(api, ctx) {
        // any setup required here
        ctx.shapes[0] = new api.Shapes.Basic.Line(0, 0, 0, 0);

        ctx.canvas.addTo(ctx.shape);
      },
      actions(api, ctx) {
        // any operation perform
        ctx.extrashape = new api.Shapes.Basic.Line(0, 0, 0, 0);
        ctx.canvas.addTo(ctx.extrashape);
        ctx.shape[0].attrs({});
        (ctx.extrashape as iShape).toBack();
      },
      verify: {}
    });
  }
});
