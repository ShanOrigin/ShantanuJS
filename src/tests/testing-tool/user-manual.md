# **ShantanuJS Testing Tool — User Manual**

---

## 🔰 **Overview**

This testing framework allows you to:

- Define visual test cases for your graphics engine  
- Validate style, geometry, and error behavior  
- Execute tests in a controlled environment lifecycle  

---

## 🧠 **Core Execution Flow**

Create Test Instance ↓ Initialize Environment ↓ Run Tests ↓ Execute: setup → actions → expect

---

## 🚀 **Basic Usage Example**



# **you can use demo.ts as starter code and can modify.**

javascript
// Import testing tool
import shantanuJSTest from './shantanuJSTest.js';

// Entry function (user-defined)
export function runTests() {
  // Create test environment (MANDATORY: pass import.meta.url)
  const testEnv = new shantanuJSTest(import.meta.url);

  // Start environment
  testEnv.env({
    // --------------------------------------------------
    // INITIALIZE PHASE
    // --------------------------------------------------
    initialize(api, ctx) {
      // Create canvas
      const canvas = new api.Canvas('testing', 250, 400, 'svg');

      // Apply base styles        
      canvas.attrs({        
        fill: 'green',        
        stroke: 'red',        
        'stroke-width': 0        
      });        
        
      // Store in context (shared across phases)        
      ctx.canvas = canvas;        
    },        
        
    // --------------------------------------------------        
    // RUN PHASE (Test Execution Entry)        
    // --------------------------------------------------        
    run(ctx) {        
      testEnv.visualTest({        
        // --------------------------------------------------        
        // TEST METADATA (REQUIRED)        
        // --------------------------------------------------        
        testInfo: {        
          description: 'Update stroke color of a line',        
          module: 'shapes',        
          testType: 'unit',        
          element: 'line'        
        },        
        
        // --------------------------------------------------        
        // SETUP PHASE (Arrange)        
        // --------------------------------------------------        
        setup(api, ctx) {        
          const rectangle = new api.Rect(20, 40, 50, 80);        
          ctx.canvas.addTo(rectangle);        
        
          rectangle.attrs({        
            stroke: 'purple',        
            'stroke-width': 2        
          });        
        
          const line = new api.Line(20, 40, 50, 40);        
          ctx.canvas.addTo(line);        
        
          line.attrs({        
            stroke: 'red',        
            'stroke-width': 2        
          });        
        
          // Store shapes in context        
          ctx.shapes = {};        
          ctx.shapes.line = line;        
        },        
        
        // --------------------------------------------------        
        // ACTIONS PHASE (Act)        
        // --------------------------------------------------        
        actions(api, ctx) {        
          // Modify shape        
          ctx.shapes.line.attrs({        
            stroke: 'blue'        
          });        
        },        
        
        // --------------------------------------------------        
        // EXPECT PHASE (Assert)        
        // --------------------------------------------------        
        expect: {        
          // Target shapes (by key from ctx.shapes)        
          shapes: ['line'],        
        
          // -------- STYLE VALIDATION --------        
          style: {        
            strokeColor: 'blue'        
          },        
        
          // -------- GEOMETRY VALIDATION --------        
          geometry: {        
            equalTo: {        
              x1: 20        
            }        
          }        
        
          // -------- ERROR VALIDATION (optional) --------        
          // error: {        
          //   expected: new Error('Expected error')        
          // }        
        }        
      });        
    }

  });
}


---

## 📦 **Context ("ctx") Structure**

Shared across all phases:

ctx = {
  canvas: CanvasInstance,
  shapes: Record<string, Shape>
}


---

## 🧪 **"visualTest()" Structure**

visualTest({
  testInfo,
  setup,
  actions,
  expect
})


---

##🔹 **1. "testInfo" (REQUIRED)**

Defines identity of test.

testInfo: {
  description: string,
  module: string,
  testType: string,
  element: string
}

Used for:

logging

file persistence

grouping



---

##🔹 **2. "setup(api, ctx)"**

Purpose:

Create shapes

Add to canvas

Initialize state


Rules:

No assertions

Pure setup only



---

##🔹 **3. "actions(api, ctx)"**

Purpose:

Apply transformations

Modify state


Examples:

change attributes

apply transforms

trigger behavior



---

##🔹 **4. "expect" (ASSERTION BLOCK)**

This is the core validation layer.


---

## 🎯 **EXPECT BLOCK — FULL STRUCTURE**

expect: {
  shapes: string[],

  constraints?: {
    save?: boolean,
    oracle?: {
      browser?: boolean,
      library?: boolean
    },
    tolerance?: {
      geometry: number
    }
  },

  style?: { ... },

  geometry?: { ... },

  error?: {
    expected: Error
  }
}


---

## 🎨 **STYLE VALIDATION**

style: {
  fill?: string,
  strokeColor?: string,
  strokeWidth?: number,

  attrs?: {
    [key: string]: string | number | boolean
  }
}

What it does:

Compares style properties


Uses:

library values

browser computed values (optional)



---

## 📐 **GEOMETRY VALIDATION**

geometry: {
  attr?: { [key: string]: number },

  equalTo?: { [key: string]: number },

  greaterThan?: { [key: string]: number },

  lessThan?: { [key: string]: number },

  bbox?: boolean
}

What it does:

Validates spatial properties

Uses tolerance for floating comparisons



---

## ⚠️ **ERROR VALIDATION**

error: {
  expected: Error
}

What it does:

Checks if expected error is thrown

Validates error type/structure



---

## ⚙️ **CONSTRAINTS**

constraints: {
  save?: boolean,

  oracle?: {
    browser?: boolean,
    library?: boolean
  },

  tolerance?: {
    geometry: number
  }
}

Purpose:

Field	Meaning

save	persist result
oracle.browser	compare against browser
oracle.library	compare against library
tolerance.geometry	allowed numeric deviation



---

## 🧠 **Important Concepts**


---

1. Shapes Reference

shapes: ['line']

Maps to:

ctx.shapes.line


---

2. Dual Oracle System

Framework can compare:

Library Values   vs   Browser Values

Controlled via:

constraints.oracle


---

3. Tolerance-Based Comparison

Used in geometry:

tolerance: {
  geometry: 0.05
}

Prevents false failures due to floating precision.


---

## ⚠️ **Rules You Must Follow**

Always pass "import.meta.url" to constructor

Always define "testInfo"

Always register shapes in "ctx.shapes"

Do NOT mutate context inside "expect"

Do NOT rely on string equality for colors



---

## 🎯 **Summary**

This framework provides:

Deterministic visual testing system
with:

structured lifecycle

dual validation (library + browser)

extensible assertions

file persistence support




