  /$$$$$$  /$$                             /$$                                      /$$$$$  /$$$$$$ 
 /$$__  $$| $$                            | $$                                     |__  $$ /$$__  $$
| $$  \__/| $$$$$$$   /$$$$$$  /$$$$$$$  /$$$$$$    /$$$$$$  /$$$$$$$  /$$   /$$      | $$| $$  \__/
|  $$$$$$ | $$__  $$ |____  $$| $$__  $$|_  $$_/   |____  $$| $$__  $$| $$  | $$      | $$|  $$$$$$ 
 \____  $$| $$  \ $$  /$$$$$$$| $$  \ $$  | $$      /$$$$$$$| $$  \ $$| $$  | $$ /$$  | $$ \____  $$
 /$$  \ $$| $$  | $$ /$$__  $$| $$  | $$  | $$ /$$ /$$__  $$| $$  | $$| $$  | $$| $$  | $$ /$$  \ $$
|  $$$$$$/| $$  | $$|  $$$$$$$| $$  | $$  |  $$$$/|  $$$$$$$| $$  | $$|  $$$$$$/|  $$$$$$/|  $$$$$$/
 \______/ |__/  |__/ \_______/|__/  |__/   \___/   \_______/|__/  |__/ \______/  \______/  \______/ 
                                                                                                    
                                                                                                    
                                                                                                    

### **Lightweight 2D Graphics & Animation Engine**

*A zero-dependency, math-first, matrix-driven 2D graphics and animation library written in TypeScript.*

---

**« Math First · Matrix Driven · Zero Dependency · Renderer Agnostic »**

---

## 📌 **Overview**

**ShantanuJS** is built from the ground up around linear algebra, matrix theory, computational geometry, and explicit rendering pipelines.

* **Mathematical Foundation:** The engine treats transformations and animated state as mathematical data rather than renderer-specific operations.
* **Scene-Oriented Architecture:** Strictly separates graphics state, transformations, animation, and rendering responsibilities.
* **Affine Transformation System:** Driven by 3x3/2D affine matrices, supporting composition, hierarchical propagation, relative & absolute operations, and pivot-based transformations.
* **Programmable Motion:** The animation system builds on interpolation, easing, parametric curves, and mathematical functions to produce smooth, deterministic motion.
* **Backend Agnostic:** Designed to remain independent of any specific rendering target.
* **SVG Renderer:** Currently implemented as the primary backend.
* *Future Backends:* Architecture is structured to support Canvas2D natively.



---

## 🚀 **Key Features**

* ⚡ **Zero Dependencies** — Built completely from scratch without external runtime graphics, math, or utility libraries.
* 📐 **Math-First Architecture** — All graphics operations are strictly grounded in linear algebra and computational geometry.
* 🔢 **Matrix-Driven Transformations** — Affine transformation matrices form the foundation of local, world, and hierarchical transformations.
* 🔄 **Advanced Transformation Controls** — Comprehensive support for relative, absolute, and pivot-point relative transformations.
* 🌲 **Hierarchical Scene Management** — Efficient parent-child scene nodes with automatic transform propagation and visual graph hierarchy.
* 🎬 **Robust Animation Engine** — Keyframe interpolation, custom easing curves, and mathematically parameterized continuous paths.
* 🎨 **Extensible Rendering Pipeline** — Decoupled scene processing from backend-specific DOM/canvas draw calls.
* 🖌️ **Native SVG Rendering Backend** — Vector-precise SVG element generation and differential scene rendering.
* 🎛️ **Graphics Filters** — Built-in filter graph support for blur, contrast, saturation, grayscale, hue rotation, glow, and drop shadows.
* 🔷 **TypeScript First** — Strong typing, complete interface definitions, and full Intellisense support throughout.
* 🧩 **Modular Architecture** — Decoupled core systems designed for high maintainability, testing, and extension.

---

## 📦 **Installation**

> ⚠️ **Note:** ShantanuJS is currently under active development and pre-release testing before its official npm package publication.

> [!WARNING]
> **Pre-Release Status:** `ShantanuJS` is under active development. The public API may evolve prior to the official `v1.0.0` npm release.

<br>

### 🌐 **Via Package Manager** *(Upcoming)*

Once published to the registry, install using your package manager of choice:


# 📦 npm

```bash
npm install shantanujs
```

# 🚀 pnpm
```bash
pnpm add shantanujs
```

# 🧶 yarn
```bash
yarn add shantanujs
```

### **Local Development Setup**

To build, experiment, or contribute to ShantanuJS directly from source:

```bash
# 1️⃣ Clone the repository
git clone [https://github.com/ShanOrigin/ShantanuJS.git](https://github.com/ShanOrigin/ShantanuJS.git)

# 2️⃣ Navigate to the project root
cd ShantanuJS

# 3️⃣ Install development dependencies
npm install

# 4️⃣ Build the library bundle
npm run build
```
---

## 📚 **Documentation**

The repository documentation is divided by major areas of the library:

* 🏁 **[Getting Started](./docs/README.md)** — Introduction and first steps.
* 🎨 **[Graphics](./docs/graphics/README.md)** — Graphics primitives and core graphics concepts.
* 📐 **[Transformations](./docs/transformation/README.md)** — Matrix-driven transformations and coordinate systems.
* ⏱️ **[Animation](./docs/animation/README.md)** — Animation systems, interpolation, curves, and easing.
* 🖼️ **[Rendering](./docs/rendering/README.md)** — Rendering architecture and rendering pipeline.
* 🌳 **[Scene Management](./docs/scene/README.md)** — Scene organization and graphics hierarchy.
* 📐 **[Geometry](./docs/geometry/README.md)** — Geometric operations and mathematical utilities.
* 🎛️ **[Filters](./docs/filters/README.md)** — Visual filters and effects.
* 🧪 **[Testing](./docs/testing/README.md)** — Testing architecture and validation.
* 💡 **[Examples & Demos](./demos/README.md)** — Practical demonstrations built with ShantanuJS.



---

## 🚦 **Project Status**

ShantanuJS is in **Active Pre-Release Development**.

* Core modules (Math Engine, Scene Tree, Affine Transforms, Animation Driver, SVG Renderer, and Filter Pipelines) are implemented and undergoing continuous refinement and performance tuning.
* Public APIs and internal structures may evolve prior to the **v1.0.0** public npm release.
* Long-term development roadmap includes adding **Canvas2D** rendering pipelines while maintaining the strict math-first, renderer-agnostic architecture.

---

## 🤝 **Contributing**

Contributions of all sizes are welcome! Whether you are interested in mathematical optimization, graphics rendering, documentation, or testing:

1. **Bug Reports & Feature Requests:** Open an issue describing the bug or feature proposal.
2. **Architectural Discussion:** For major API or pipeline updates, open a proposal issue prior to starting implementation.
3. **Pull Requests:** Follow the project code style and ensure all test suites pass.

Please read our **[Contributing Guide](./CONTRIBUTING.md)** for step-by-step contribution guidelines.

---

## 💡 **Origin & Philosophy**

ShantanuJS originated during the architectural development of **[Code Perspective](https://github.com/ShanOrigin/code-perspective)**, a dynamic data structure and algorithm visualization project.

While engineering Code Perspective, existing high-level Web graphics frameworks lacked explicit mathematical transparency and required heavy runtime overhead. This presented an opportunity to explore how a graphics system could be built entirely from first-principles linear algebra and software engineering fundamentals.

What began as an SVG visual experiment evolved into a full-featured, zero-dependency 2D graphics engine centered around matrices, geometry, and clean software architecture.

---

## 👤 **Author & Maintainer**

### **Shantanu Suryawanshi**

*Creator and Principal Maintainer*

---

## 📜 **License**

Copyright © 2024–2026 **Shantanu Suryawanshi**.

This project is licensed under the **"Apache-2.0"**. You are free to use, study, modify, and redistribute this software in accordance with the license conditions.

See the full **[LICENSE](./LICENSE)** file for complete details.

---

**ShantanuJS**

*Zero Dependency · Math First · Matrix Driven · 2D Graphics & Animation*

