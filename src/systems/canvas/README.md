

# 🚀 Canvas — Core Rendering Container

---

## 🔥 Overview

**Canvas** is the **root scene container** and **execution controller** of the rendering system.

It is responsible for:

- Managing all shapes (`iShape`)
- Maintaining **O(1)** structural operations
- Synchronizing **data → DOM → rendering**
- Driving the **rendering engine lifecycle**
- Enforcing strict **state invariants**

> ⚠️ This is **NOT** a simple wrapper.  
> It is a **low-level rendering core** designed for performance and control.

---

## 🧠 Architecture

Canvas operates on **three layers of truth**:

### 1. 🧱 Structural Layer (**Authoritative**)
- `#canvasElements: iShape[]`
- `#elementIndexMap: Map<iShape, number>`

> This is the **ONLY trusted source of truth**

---

### 2. 🧩 Semantic Layer (**Derived**)
- `shape.style`
- `shape.geometry`

---

### 3. 🎨 Rendering Layer (**Projection**)
- DOM / SVG nodes
- `#fig` (root element)

---

### 🔁 Flow

Mutation → Structure → Semantic Sync → DOM Projection → Engine Render

---

## ⚡ Performance Model

| Operation | Complexity |
|----------|-----------|
| `addTo()` | O(1) |
| `remove()` | O(1) |
| `contain()` | O(1) |
| `clear()` | O(n) |

> ⚠️ **Trade-off:**  
> Removal uses **swap-pop** → **order is NOT preserved**

---

## 🏗️ Core Features

- ⚡ **O(1) insertion & removal**
- 🧠 **Index map-based lookup**
- 🔄 **Automatic DOM synchronization**
- 🎯 **Strict invariant enforcement**
- 🧩 **Renderer abstraction**
- ⚙️ **Engine-driven execution**

---

## 🧪 Initialization

```ts
const canvas = new Canvas(
  'container-id', // DOM element id
  800,            // width
  600             // height
);


---

📦 Core Methods


---

➕ addTo(...shapes: iShape[]): this

Adds shapes to the canvas.

✔ Behavior:

Validates shape is not already attached

Creates DOM node (SVG)

Updates structure (array + map)

Assigns ownership + context


⚠️ Notes:

Skips invalid or duplicate shapes

O(1) insertion



---

➖ remove(...shapes: iShape[]): this

Removes shapes using swap-pop strategy

✔ Behavior:

Removes DOM node

Updates structure in O(1)

Cleans ownership and context


⚠️ Notes:

Order is NOT preserved

Safe against duplicate removals

Handles group recursion



---

🧹 clear(): this

Removes all shapes efficiently

✔ Behavior:

Bulk DOM cleanup

Clears array + map in O(1)

Avoids repeated remove() overhead



---

🔍 contain(shape: iShape): number

Checks if shape exists in canvas.

✔ Returns:

index + 1 → if present

0 → if not present


⚡ Complexity:

O(1)



---

📄 getAllElements(): iShape[]

Returns a safe snapshot of all shapes.

✔ Behavior:

Returns a shallow copy

Prevents external mutation



---

🎛️ attrs(props)

Sets or retrieves canvas attributes.

✔ Supports:

Object → set attributes

String → get attributes


✔ Updates:

Geometry (width, height, x, y)

Style (stroke, fill, etc.)

DOM synchronization



---

▶️ start()

Starts the rendering engine.


---

⏹️ stop()

Stops the rendering engine.


---

⚡ flush()

Forces immediate rendering cycle.


---

🎨 Rendering Context

Currently supported:

✅ SVG


Planned:

⏳ HTML Canvas



> ⚠️ Context is immutable after initialization




---

🧬 Internal Invariants

Canvas enforces strict guarantees:

✅ Structural Integrity

elements[index] === shape
indexMap.get(shape) === index


---

✅ Single Ownership

A shape belongs to only ONE container



---

✅ No Partial Mutation

All operations are atomic



---

✅ DOM Sync

No orphan DOM nodes

No detached shapes with active DOM



---

🧪 DEV Mode (__DEV__)

Canvas uses:

if (__DEV__) { ... }

✔ Purpose:

Invariant validation

Debug warnings


⚠️ Requirements:

Must be initialized via env.global.ts


---

🧠 Design Philosophy

Canvas is built for:

Performance first

Deterministic behavior

Explicit control

Minimal abstraction overhead



---

⚖️ Trade-offs

Gain	Cost

O(1) operations	No stable order
High performance	Less safety abstraction
Direct control	More responsibility



---

🧪 Example Usage

const canvas = new Canvas('root', 800, 600);

canvas.addTo(shape1, shape2);

canvas.remove(shape1);

canvas.start();
canvas.flush();
canvas.stop();

canvas.clear();


---

🚀 Final Thought

If you misuse Canvas as a simple container,
you lose its power.

If you respect its invariants,
you get a rendering engine-level system.


---
