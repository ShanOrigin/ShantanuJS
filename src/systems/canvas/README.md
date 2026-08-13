# Canvas

## Overview

`Canvas` is the root orchestration container of the rendering system.

It acts as the central coordination layer responsible for:

- Scene graph ownership
- Rendering backend initialization
- Rendering engine lifecycle coordination
- Event dispatch integration
- Graphical entity management
- Structural scene synchronization

The class does **not directly manage rendering logic internally**.  
Instead, it coordinates specialized subsystems responsible for isolated domains.

---

# Architectural Role

`Canvas` sits at the top of the runtime rendering pipeline.

Canvas
├── SceneModel
├── Renderer
├── Engine
└── EventSystem

---

Core Responsibilities

1. Scene Management

The canvas owns the root scene graph structure through SceneModel.

Responsibilities include:

Adding graphical entities

Removing graphical entities

Structural membership management

Element lookup coordination

Z-order synchronization

---

2. Rendering Coordination

The canvas initializes and coordinates the rendering backend.

Supported rendering targets may include:

SVG

Canvas2D

Future rendering backends

The rendering backend itself is abstracted behind the Renderer layer.

---

3. Engine Lifecycle Integration

Canvas initializes and manages the rendering execution engine.

The engine is responsible for:

Render scheduling

Frame lifecycle management

Dirty state propagation

Render synchronization

---

4. Event Dispatch Integration

Canvas acts as the only DOM interaction boundary in the system.

Responsibilities include:

Native DOM event binding

Pointer event forwarding

Synthetic event dispatch delegation

Graphical entities themselves remain completely DOM-independent.

---

Internal Architecture

SceneModel

Responsible for:

Structural scene state

Element collections

Element lookup maps

Scene membership management

Z-order state

The SceneModel intentionally does not own:

Renderer

Engine

EventSystem

This separation preserves architectural isolation between:

Structural state

Runtime execution

Rendering logic

Interaction systems

---

Renderer

Responsible for converting logical graphical entities into backend-specific drawable primitives.

Examples:

SVG elements

Canvas draw operations

Future GPU primitives

---

Engine

Responsible for runtime rendering execution.

Responsibilities:

Render scheduling

Update propagation

Rendering lifecycle coordination

Render synchronization

---

EventSystem

Responsible for synthetic interaction dispatching.

Responsibilities:

Hit testing

Event target resolution

Propagation path construction

Capture/bubble execution

---

Internal Access Model

The canvas communicates with SceneModel through:

Symbol-keyed computed methods

Capability-token validation

Example:

sceneModel[GET_CANVAS_ELEMENTS_METHOD](SYSTEM_INTERNAL_ACCESS_KEY);

This architecture provides:

Strong encapsulation boundaries

Controlled privileged access

Internal subsystem isolation

Reduced accidental state corruption

---

Initialization Flow

Canvas
↓
SceneModel creation
↓
Renderer initialization
↓
Engine creation
↓
EventSystem creation
↓
DOM event binding
↓
Engine startup

---

Constructor

Signature

constructor(props: {
id: string;
width: number;
height: number;
x: number;
y: number;
context: GRAPHICS_CONTEXT;
})

---

Constructor Responsibilities

The constructor performs:

Structural Initialization

Creates internal SceneModel

Rendering Initialization

Resolves rendering backend

Initializes renderer instance

Engine Initialization

Creates runtime rendering engine

Connects scene collections and resolver systems

Event System Initialization

Creates centralized event dispatcher

DOM Integration

Binds native pointer/mouse events

Runtime Startup

Starts rendering engine lifecycle

---

Public API

---

add(...shapes)

Adds one or more graphical entities into the canvas scene graph.

Responsibilities

Registers entities

Enables rendering participation

Establishes scene ownership

Returns

this

---

remove(...targets)

Removes one or more graphical entities from the scene graph.

Responsibilities

Removes scene membership

Removes rendering participation

Clears ownership links

Returns

this

---

contains(shape)

Checks whether a graphical entity exists within the canvas scene graph.

Return Semantics

Value Meaning

0 Entity does not exist
1 Entity exists

Design Note

This method intentionally uses lightweight numeric containment semantics.

---

clear()

Removes all graphical entities from the scene graph.

Responsibilities

Clears scene membership

Clears rendering participation

Resets scene structure

Returns

this

---

getAllElements()

Returns all registered graphical entities.

Returns

GraphicsNode[]

---

attrs(props)

Unified attribute getter/setter interface delegated to SceneModel.

Supports:

Getter access

Setter access

Multi-property retrieval

---

Event Flow

DOM Event
↓
Canvas
↓
EventSystem
↓
Synthetic Event Dispatch
↓
Graphical Entity Handlers

---

Design Characteristics

Declarative Scene Interaction

Graphical entities interact through declarative APIs rather than direct renderer manipulation.

---

Strict Layer Separation

The architecture separates:

Layer Responsibility

Canvas Orchestration
SceneModel Structural State
Renderer Rendering Backend
Engine Runtime Execution
EventSystem Interaction Dispatch

---

Controlled Internal Access

Internal mutable state is protected through:

Capability-token validation

Symbol-keyed access methods

Encapsulation boundaries

---

DOM Independence

Graphical entities remain independent from DOM APIs.

Only Canvas interacts directly with native browser events.

---

Limitations

Runtime Coupling

Canvas still coordinates multiple subsystems directly.

Future architectures may introduce:

Dependency injection

Centralized runtime containers

Modular subsystem registration

---

Proxy/Access Overhead

Internal capability-based access introduces:

Additional indirection

Symbol-key resolution overhead

Runtime access validation

---

Single Root Ownership

Current architecture assumes:

One root scene container

One engine ownership chain per canvas

---

Final Characterization

Canvas represents:

> A root orchestration container coordinating scene state, rendering systems, runtime execution, and synthetic interaction flow.

It acts as the primary integration point between:

Structural scene management

Rendering execution

Runtime coordination

Interaction dispatch systems
