# 🎨 SVGRenderer — High-Performance SVG Rendering Engine

---

## 🚀 Overview

**SVGRenderer** is a **low-level, performance-optimized rendering backend** responsible for translating shape state into **minimal SVG DOM updates**.

It is designed to work as part of the rendering pipeline:

Canvas → Engine → Renderer (SVGRenderer) → DOM

> ⚠️ SVGRenderer does NOT compute geometry  
> ⚠️ SVGRenderer does NOT manage state  
> ✔️ SVGRenderer only performs **diff-based DOM writes**

---

## 🧠 Core Philosophy

> **"Compute everything in JS → Write only minimal diff to DOM"**

This ensures:

- Zero redundant DOM updates
- High rendering performance
- Predictable rendering behavior

---

## ⚙️ Responsibilities

SVGRenderer is responsible for:

- Rendering shapes to SVG elements
- Applying **only changed attributes**
- Managing **per-element caches**
- Respecting dirty flags for performance
- Handling shape-specific geometry mapping

---

## ❌ Non-Responsibilities

SVGRenderer does NOT:

- Compute geometry
- Manage animations
- Handle transformations
- Maintain scene structure
- Validate business logic beyond rendering constraints

---

## 🏗️ Architecture

### Input

```ts
render(shapesStack: Array<GraphicsModel>)

Each shape must:

Be an instance of GraphicsModel

Provide internal accessors:

getIGeo()

getIStyle()

getIFig()




---

Internal Flow

For each shape:
  1. Validate shape
  2. Extract geometry + style + DOM node
  3. Skip if not dirty
  4. Compute attribute diffs
  5. Apply minimal DOM updates
  6. Update cache
  7. Mark clean


---

⚡ Performance Model

Feature	Strategy

Geometry updates	Diff-based
Style updates	Diff-based
Buffer handling	Reference equality
Rendering scope	Dirty-only
Cache storage	WeakMap



---

🧬 Internal Caching System

Geometry Cache

WeakMap<Element, Record<string, unknown>>

Stores last applied geometry values:

cx, cy, x, y

width, height

buffer reference

path string



---

Style Cache

WeakMap<Element, Record<string, string>>

Stores last applied style attributes:

fill

stroke

stroke-width

etc.



---

Why WeakMap?

Automatic garbage collection

No memory leaks

Per-element isolation



---

🔄 Dirty Flag Mechanism

Each shape has:

geoRef.dirty: boolean

Behavior:

true → shape will be rendered

false → skipped completely


Result:

Rendering Complexity = O(changed_shapes)


---

🧩 Supported Shape Types

Basic Shapes

dot → rendered as circle (clamped radius)

line

circle

ellipse

rect



---

Complex Shapes

polyline

polygon

curve

Uses buffer (Float32Array)

Optimized via reference comparison




---

Advanced Shapes

path → uses d attribute

text → uses textContent

image → uses href



---

🧠 Optimization Strategies

1. Diff-Based Rendering

if (cache[key] !== value) {
  setAttribute(...)
}


---

2. Buffer Reference Optimization

if (prevBuffer !== currentBuffer)

Avoids rebuilding points string unless needed.


---

3. No Prototype Objects

Object.create(null)

Faster lookups, no inherited keys.


---

4. Centralized String Conversion

#numToStr()

Single point for optimization.


---

⚠️ Error Handling

Renderer enforces strict correctness using custom errors:


---

InvalidRenderableShapeError

When shape is not GraphicsModel


---

InvalidInternalStateError

When geometry is missing or corrupted


---

OperationInProgressError

When rendering is attempted during transformation batching


---

🔒 Invariants

Renderer guarantees:

Only valid shapes are rendered

No redundant DOM updates occur

Cache always reflects last DOM state

Dirty flag strictly controls rendering

Buffer reference change = geometry change



---

📦 Example Usage

const renderer = new SVGRenderer();

renderer.render(shapesStack);


---

⚖️ Trade-offs

Advantage	Cost

High performance	More internal complexity
Minimal DOM writes	Requires strict invariants
Scalable rendering	No automatic ordering
Memory-safe caching	Requires disciplined usage



---

🔮 Future Extensions

Transform diffing (matrix caching)

Attribute batching

Partial DOM updates

GPU-backed rendering (WebGL)

Multi-layer rendering pipelines



---

🧠 Design Summary

SVGRenderer is:

a pure rendering layer

a diff-based DOM writer

a performance-critical component


It follows:

State → Diff → Minimal DOM Mutation


---


```
