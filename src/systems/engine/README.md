# ⚙️ Engine — Rendering Lifecycle Orchestrator

---

## 🔥 OVERVIEW

**Engine** is the **temporal backbone** of the rendering system.

It is responsible for:

- Managing the **global animation loop**
- Updating animations across all shapes
- Delegating rendering to a **Renderer**
- Enforcing strict **execution lifecycle control**

> ⚠️ Engine does NOT render.  
> ⚠️ Engine does NOT animate.  
> ⚠️ Engine only **coordinates execution**.

---

## 🧠 CORE PURPOSE

Engine exists to ensure:

- Everything happens in the **correct order**
- Everything happens at the **correct time**
- Execution remains **controlled and predictable**

---

## 🏗️ ARCHITECTURE

Engine operates with two primary components:

### 🧩 Shapes Collection

```ts
#shapes: iShape[]

Reference to all renderable shapes

Acts as update + render pipeline input

Order defines render/update order



---

🎨 Renderer

#renderer: Renderer

Abstract rendering backend

Responsible for:

drawing

clearing

frame output



> Engine NEVER draws directly




---

🔁 EXECUTION FLOW

requestAnimationFrame
        ↓
     #loop()
        ↓
     #frame()
        ↓
[ update animations ]
        ↓
[ renderer.render() ]
        ↓
schedule next frame


---

⚙️ LIFECYCLE

Engine exposes a strict execution lifecycle:


---

▶️ start()

Starts the engine loop.

✔ Behavior:

Sets running state → true

Schedules first animation frame

Prevents duplicate loops


⚠️ Notes:

No-op if already running

Does NOT reset state



---

⏹️ stop()

Stops the engine loop.

✔ Behavior:

Sets running state → false

Cancels scheduled frame

Clears RAF identifier


⚠️ Notes:

Safe to call multiple times

Engine remains reusable



---

⚡ flush(time?)

Forces a single immediate render frame

✔ Behavior:

Marks all shapes as dirty

Executes one frame manually

Bypasses animation loop


⚠️ Notes:

Does NOT start engine

Does NOT affect timing loop



---

🔬 INTERNAL METHODS


---

🧠 #frame(time)

Executes one frame.

✔ Steps:

1. Update animations for all shapes


2. Delegate rendering to renderer



⚠️ Invariant:

All shapes MUST be renderable (GraphicsModel)


❌ Error:

Throws:

InvalidInternalStateError

If a non-renderable shape is encountered.


---

🔁 #loop(time)

Main RAF loop handler.

✔ Steps:

1. Check if engine is running


2. Execute frame


3. Schedule next frame



⚠️ Notes:

Self-sustaining loop

Stops immediately if engine is stopped



---

⚡ PERFORMANCE CHARACTERISTICS

Operation	Complexity

Frame Execution	O(n)
Animation Update	O(n)
Rendering	O(n)


Where:

n = number of shapes


---

🧬 DESIGN INVARIANTS

Engine enforces:


---

✅ Single Loop Guarantee

Only one RAF loop can exist at a time



---

✅ Update Before Render

animation → rendering


---

✅ Renderer Delegation

Engine never performs drawing

Renderer handles all visual output



---

✅ Shape Validity

All shapes must be instances of GraphicsModel



---

✅ Controlled Lifecycle

Explicit start/stop/flush

No implicit execution



---

❌ NON-RESPONSIBILITIES

Engine does NOT:

❌ draw graphics

❌ implement rendering logic

❌ define animation behavior

❌ mutate geometry directly

❌ manage DOM elements



---

⚠️ ERROR HANDLING

Engine enforces strict internal correctness.

Throws:

InvalidInternalStateError

When:

A shape is not renderable

Engine invariants are violated



---

🧠 USAGE MODEL

const engine = new Engine(shapes, renderer);

// Start loop
engine.start();

// Stop loop
engine.stop();

// Force render
engine.flush();


---

🔒 INTERNAL STATE

#shapes   → shape collection
#renderer → rendering backend
#running  → loop state
#rafId    → animation frame id


---

🔥 DESIGN PHILOSOPHY

Engine follows:

Separation of concerns

Strict control over execution

Minimal responsibility

High predictability



---

⚖️ TRADE-OFFS

Gain	Cost

Deterministic execution	No implicit behavior
Strict control	Requires correct usage
Clear architecture	Less convenience


---

🧠 SUMMARY

Engine is the execution controller, not the executor.

It ensures:

correct timing

correct ordering

correct delegation


> 💣 Rule:
Engine controls WHEN, not WHAT or HOW.


---
```
