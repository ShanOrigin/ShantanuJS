Here is a production-grade README.md for your GraphicsModel class. This is structured, technical, and suitable for a real repository.


---

# GraphicsModel

> Core abstraction layer for managing graphical entities in a rendering system.

---

## 📌 Overview

`GraphicsModel` is an **abstract base class** that defines the internal architecture for graphical elements in the system. It acts as the **central state engine**, responsible for:

- Managing **geometry** (shape, transforms, structure)
- Managing **style** (visual properties)
- Enforcing **controlled mutation**
- Providing a **unified API (`attrs`)**
- Bridging logical model ↔ rendering backend (SVG, future Canvas/WebGL)

---

## 🧠 Architecture

User API ↓ attrs() ↓ Validation Layer (geo/style) ↓ Mutation Engine (#setAttrs) ↓ Internal State (#geometry / #style) ↓ Rendering Binding (#fig + context)

Additionally:

Z-Order Operations (toFront / toBack) ↓ Direct DOM Manipulation

---

## 🧩 Core Components

### 1. Geometry (`#geometry`)

Handles all structural and spatial properties.

**Includes:**
- Shape identity (immutable)
- Transformation stack
- Dirty flag (render trigger)
- Shape-specific properties
- Rendering context

**Invariants:**
- `shape` is immutable
- `transformStack` always initialized
- `dirty` reflects render state

---

### 2. Style (`#style`)

Handles all visual properties.

**Includes:**
- Stroke, fill, vector effects, etc.
- Immutable `id`

**Invariants:**
- `id` cannot be modified
- Style must pass validation before mutation

---

### 3. Rendering Binding (`#fig`)

Represents the actual rendered object.

**Current:**
- SVGElement

**Future:**
- Canvas objects
- WebGL buffers

---

## 🔐 Access Control Model

### Public Access (Safe)
- `geometry`
- `style`

> Exposed via **readonly proxies** → prevents mutation

---

### Privileged Access (Unsafe)
- `getIGeo(accessKey)`
- `getIStyle(accessKey)`
- `getIFig(accessKey)`

> Requires `Symbol` access key  
> Returns **mutable internal references**

⚠️ If accessKey leaks → full control over internal state

---

## ⚙️ Mutation Model

All controlled mutations follow:

attrs() → #setAttrs() → validation → mutation → dirty flag

### Validation Layers

- `#isGeometricProp()` → geometry rules
- `#isStyleProp()` → style rules

### Rules

- Invalid mutations → throw error
- Restricted properties → blocked
- All mutations → mark `dirty = true`

---

## 📖 Read Model

Access via:

```ts
attrs("x y fill")

Behavior

Style takes precedence over geometry

Some values are copied (e.g., buffers)

Others are returned directly


⚠️ Read-side immutability is not fully enforced


---

🎮 Public API

attrs(props)

Unified getter + setter.

Setter

attrs({ x: 10, fill: "red" })

Getter

attrs("x")            // → single value
attrs("x y fill")     // → array


---

hide() / show()

element.hide()
element.show()

Sets:

visibility: hidden

visibility: visible


---

🔄 Transformation System

Uses a stack-based matrix system:

transformStack = {
  stack: [
    {
      transformName: "composed",
      transformType: "all",
      transformMatrix: Float32Array(9)
    }
  ],
  skip: 0
}

Initialized with identity matrix

Supports compositional transformations



---

🧱 Design Principles

Encapsulation-first

Controlled mutation

Validation-driven updates

Context-aware rendering

Hybrid model (declarative + imperative)



---

⚠️ Limitations

1. Inconsistent Immutability

Write: controlled

Read: partially exposed



---

2. No Transaction Safety

attrs({ x: 10, invalid: 5, y: 20 })

→ partial mutation possible


---

3. Context Coupling

SVG logic embedded directly wherever required according to context



---

4. Domain Overlap Risk

Geometry vs style not strictly isolated



---

5. Performance Overhead

Proxy creation

Repeated validation



---

6. Silent Failures

Invalid keys → undefined


---

🧪 Failure Modes

Invalid property → error

Invalid accessKey → blocked

Context mismatch → runtime failure





---

🚀 Extensibility

Designed to support:

Multiple rendering backends

New shape types

Extended property systems


Required Improvements

Context abstraction layer

Central property registry

Transactional mutation system



---


