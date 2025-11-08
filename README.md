
### READ CAREFULLY ALL FEATURES OTHER WISE IT WILL GO OUT OF YOUR MIND  DUE TO COMPUTATIONAL GEOMETRY CONCEPTS and conceptual figuers read figuers carefuly ###

====================================================================
### NAME :             SHANTANU.JS | SHANTANU.TS 
====================================================================


###  ⚡ The Shantanu.ts/ts a advanced 2D Graphics & Animation library with zero dependency based on pure Mathematics( Matrix Theory & Linear Algebra )  built from scratch in **TypeScript** and for performance library is powered by **WASM ( C Language )*** . Everything is **matrix-driven** (linear algebra at its core), highly memory-efficient, and optimized for **native-level performance in the browser**.  
 

====================
### Origin Story
====================

================================================================================

This project began from a single frustration. During my first web-graphics project of DSA visualization **Code Perspective** ,  a data-structure and algorithm visualization engine where visualizations are generated dynamically from the algorithms themselves  , no prefix input or procedure Everything is dynamic  user Interactive .

I encountered a small problem ( in trees and graphs like animating along curves and etc ) that existing tools technically solved — just not in the way I wanted.
Instead of accepting that limitation, I decided to build my own system from first principles and pure scratch. That decision grew into ShantanuJS/TS . 

A complete 2D graphics library written entirely in TypeScript, powered by matrix and linear-algebra fundamentals of Mathematics , and accelerated through a custom WebAssembly module in C.

No one told me to do it. There was no team, no guidance , no tutorials , and only limited hardware and my knowledge of computational geometry — a modest development setup running a lightweight Linux environment of 4gb system.

Every module, from transformations and animations to rendering and filters, was designed and implemented from my own visualization of how a graphics engine should work.

What began as a personal workaround evolved into a fully functioning graphics framework capable of replicating most existing 2D-library features while introducing an advanced transformation and animation system unlike any other.

For me, ShantanuJS/TS isn’t just a library — it’s proof that imagination, mathematics, and persistence can break through any constraint.

================================================================================

# AUTHOR:
   🔹Created solely by **Shantanu Suryawanshi**.
   🔹This library is **100% a solo project**. No tutors, guides, or external developers involved.
   🔹Author used ChatGPT (free version) only to understand concepts and get help for small code snippets.
   🔹Entire library is built purely on mathematics, imagination, and programming.

# Project Idea :
   🔹Project Idea originated from basic and simple **Rapheal.js** svg based graphics library.
   🔹**Rapheal.js** is used in My first project "Code FrameWork" DSA visualtization engine which is dynamicaly support any user input and interaction( and Animation it self coming from **DS or Algorithams** itself it shows extact proccess of **DS and Algorithams** no pre difined keyFrames or fixed data  ).
   🔹after complition of library first project **Code FrameWork** will be rewritten in my own library.
    
# Project Theme :
   🔹100% 2 Dimensinal Mathematics ( Linear Algebra , Matrix Theory , Curve Math , Interpolation ) and Imagination based.
   🔹No copy features from any other library( only concepts are used ).

# IMPORTANT INFO:
   🔹Solo developer project from non graphics programming background.
   🔹Current rendering backend: SVG only.
   🔹Planned future backend: HTML5 Canvas (guaranteed).
   🔹Possible long-term backends: PDF, WebGL, WebGPU (not guaranteed).
   🔹ZERO DEPENDENCIES: only TypeScript and WASM (C for high-performance tasks like manual matrix multiplication).
   🔹WASM integrated with synchronous BASE64 operations for maximum graphics performance.
   🔹Written in TypeScript with 95–99% type safety.
   🔹80–90% decoupled: each module is modular and mostly independent.
   🔹Adding future backends requires minimal effort due to the decoupled architecture.
   🔹Age of project: ~8 months. 70% was implemented in the last 5–6 months of continuous work.




# Technologies :

   🔹Built entirely in **Neovim** Linux Command line Editor  — no IDEs, no scaffolding, no dependencies. Just code, math, and engineering.
   🔹This library was built almost entirely by me, but with significant help from the free version of ChatGPT.  
   🔹 I used ChatGPT to understand graphics concepts, get code snippets, and reason through tricky parts.  
   🔹 All the architecture, design decisions, and final implementations were mine with the help of ChatGPT.  
   🔹 This project is proof that with curiosity, math, persistence, and free tools,  
   🔹you can build complex systems from scratch.

   🔹NeoVim – Terminal-based code editor, fully customized with **LSP or language server integration, auto-suggestions, and personalized workflow** for efficient development



### Imports Patterns


# Dependency Injection / Provider Pattern:
  Each module provides its functionality to consumers through a controlled interface.

# Template Method Pattern:
  Shapes (and probably other modules) rely on base classes with abstract hooks.

# DAG-style dependency enforcement: 
  Submodules can depend internally, but nothing flows backward to create cycles.

# Helper-driven code reuse:
  Common functionality centralized instead of duplicated.


### ✨ Features


# 🔹90% Object oriented project
    🔹 5 levels of Multi level inheritance with Minix Pattern.
    🔹 All 5 levels of are using Generics from its child class.
    🔹 Heavy use of inheritance and Generics.

# 🔹Matrix-Driven Core
    🔹Every transformation & animation goes through optimized **2D matrix multiplications**.
    🔹Implemented with **1D arrays** for speed + minimal memory use.
    🔹Aggressive **storage reuse** → no garbage collector bloat.

# 🔹Advanced Transformation System
    🔹Every transformation goes through optimized **2D matrix multiplications**.
    🔹Implemented with **1D arrays** for speed + minimal memory use.
    🔹This module interact with **WASM MODULE INTERNALLY**
    🔹Aggressive **storage reuse** → no garbage collector bloat.
    🔹Pivot-aware transformations (each transform respects its own pivot point).
    🔹It support **relative or r ** , **absolute or a ** , **pivot or p** based transformations by default.

# 🔹Advanced Animation System
    🔹Pivot-aware transformations (each transform respects its own pivot point).  
    🔹Physics-based motion with **arc-length parameterization**.  
    🔹Curve-driven animations with custom easing.  
    🔹Group + scene-level animations.  
    🔹Full **canvas-wide transformations** with a single call( may be in future ).

# 🔹WebAssembly-Powered Performance
    🔹Embedded C math engine via **synchronous WASM execution**.  
    🔹No async setup, no boilerplate → behaves like pure TypeScript.  
    🔹Native-speed operations inside the browser.  

# 🔹Filters or Shapes or Event go through below MODULES sections 

# 🔹Rendering
     🔹SVG API-based rendering for compatibility.  
     🔹Replicates ~90% of existing 2D libraries while introducing **unique features** not found elsewhere.  

---



### 🚀 Project Description


  ShantanuJS is an advanced 2D graphics and animation engine built entirely in TypeScript,
  powered by a WebAssembly (C) math core for near-native performance.
  It features a fully matrix-driven architecture, where every transformation, animation, and rendering 
  operation is computed through optimized linear algebra and matrix theory.
  Designed with a zero-dependency, modular, and object-oriented structure, it delivers high efficiency, memory reuse,
  and minimal garbage collection.

  The engine currently renders through SVG, with planned support for Canvas, PDF, WebGL, and WebGPU backends.
  Its transformation system supports all pivot-aware and DSL-style transformations, both batched and standalone.
  The advanced animation system enables curve-driven, physics-based motion with arc-length parameterization 
  and full pivot consistency.

  ShantanuJS emphasizes deterministic behavior, mathematical precision, and scalability for complex visual systems.
  It is designed for developers who demand complete control and for researchers seeking a mathematically grounded,
  high-performance 2D graphics framework for the web. Future updates aim to expand real-time rendering, 
  enhance animation capabilities, and add multiple rendering backends — all while maintaining a zero-dependency architecture.

 🔹Advanced 2D Graphics & Animation Engine (TypeScript + WebAssembly)
 🔹Creator & Lead Developer | Duration: 1 year+

 🔹Developed a zero-dependency, high-performance 2D graphics engine from scratch in TypeScript with an embedded WebAssembly (C) math core, achieving native-level performance without async initialization overhead.

 🔹Implemented a fully matrix-driven architecture: every transformation, animation, and shape operation is computed through optimized 2D matrix multiplications stored in compact 1D arrays, ensuring minimal memory footprint and aggressive storage reuse (no GC bloat).

 🔹Engineered an advanced animation system with unique features not found in 95% of existing 2D libraries:

 🔹Pivot-aware transformations (every operation respects its own pivot point).

 🔹Physics-based motion with arc-length parameterization and curve-driven animation.

 🔹Batched transformations, group/scene animations, and full canvas-wide transformations with a single function call.

 🔹Layered compositing, filters, and transformation chaining — all pivot-consistent by default.


 🔹Optimized for browser rendering using SVG APIs, replicating ~90% of the features of established 2D libraries while introducing novel capabilities and superior performance.

 🔹Designed for minimal developer friction: WebAssembly is embedded directly, so the library runs synchronously like pure TypeScript code — no async setup, no extra dependencies, no boilerplate.

 🔹Delivered an engine that combines graphics innovation + mathematical rigor + systems-level optimization, making it both feature-rich and memory-efficient.

 🔹“Unlike typical WASM libraries, this engine embeds WebAssembly directly for synchronous execution. Users can call high-performance C-implemented matrix operations from TypeScript with zero async overhead — the library runs as seamlessly as pure JS, but with native speed.”

 🔹“Unlike typical libraries, this engine is fully matrix-driven: every transformation, animation, and filter runs through real linear algebra operations. Matrix multiplications are optimized with flat 1D arrays, minimizing GC pressure and maximizing performance. The library reuses storage aggressively, achieving a memory footprint significantly smaller than comparable frameworks.”


 🔹“Developed entirely in Neovim, proving that advanced graphics engines can be built with minimal tooling and a focus on fundamentals.”


## License
This project uses a **Dual-License** model:

 🔹👤 **Free Individual License (default)**  
    🔹Students, hobbyists, freelancers working solo → Free for personal and commercial use.  
ii
 🔹🏢 **Commercial License**  
    🔹Companies, teams, and organizations → Paid license required.  
    🔹See [COMMERCIAL_LICENSE.md](./COMMERCIAL_LICENSE.md) for details.  

⚠️ Note: This library uses internal symbols and advanced access patterns for its core functionality.  
Modifying these internals is **at your own risk**. The author is not liable for misuse.





====================================================================
###                         CANVAS
====================================================================

**Canvas is the parent of all elements **
**Canvas is Generics in nature so it supports All SHAPES MODULE shapes with full integration**

ShantanuJS/TS provides Canvas( width , height , x , y , props ) methos to create canvas 
 
# params : 
    width  - absolute width of canvas 
    height - absolute height of canvas 
    x      - ( optional ) -> places canvas top left at given x coordinste relative to html parent element of canvas in html document
    y      - ( optional ) -> places canvas top left at given y coordinste relative to html parent element of canvas in html document
    props  - object of properties related to canvas 


# Canvas provides several methods to manipulation such like 
 
    1) addTo( flag ,  ...elements[] )
 
         🔹This method and any type of graphics element created by ShantanuJS/TS in respected canvas.
         🔹 flag ( optional ) for added element either tracked by canvas or not bh default flag is true track all elements.
         🔹 Allow Adding single or multiple elements at a time.
 
    2) remove( ...elements[] ) 
 
         🔹This method remove any type of graphics element created by ShantanuJS/TS in respected canvas.
         🔹 Allow deleting single or multiple elements ag a time.
 
    3) clear()
 
         🔹This method clear or delete all elements present in currently working canvas.
  
    4) contains( element )
 
         🔹This method tell either given graphics element belongs to current canvas or not.
 
    5) getAllElements() 
 
         🔹This method gives or return all elements present in current canvas.


# May be support Single transformation for entire Canvas but not guaranteed 
    🔹Translate()
    🔹Rotate()
    🔹Scale()
    🔹Skew()
 
    # Remember this all transformations methods exactly same as **TRANSFORMATION MODULE** on entire Canvas Level.

====================================================================
###                         MODULES
====================================================================

### 1. SHAPES MODULE


#   🔹Supports primitive shapes:
        Point, Line, Polyline, Polygon, Rect, Path, Circle, Ellipse
#   🔹Supports custom shapes:
        Triangle (acute, right, obtuse)
        Curve (cubic, quadratic, arc , earc)
#   🔹Curve customization:
       🔹stiffness: curvature/slope of curve
       🔹smoothness: number of steps to form the curve
       🔹continuous : for curve continuouty
       🔹continuousCont : how much time phase shit happen 
#   🔹All shapes are fully compatible with:
       🔹Transformation Module
       🔹Animation Module
       🔹Filters Module

# All shapes derived from Shape patent class 

## Description :
 🔹 All shapes created using pareng class Shape for **Parent Child Template Pattern** to reduse code replication among all classes.

 🔹**IMP** Parent class **Shape Class** is a **Minix Pattern Class** of class of **Graphics Element Class With Multi Level Generics** with function which returns **new Class ** which combination of **Graphics ElementClass** and **Transformations functions**. 
  
 🔹Each shape has two sections i.e geometry & style .

 🔹In GEOMETRY properties are :
  
     ─│───────────────────────────────────────────────────────────────│─ 
      │ shape ( shape name for reference)                             │
      │ SharedBuffer (1D Array)                                       │
      │ matrix (shape coordinstes data) (2D view on SharedBuffer)     │
      │ obbox ( oriented bounding box data) (2D view on SharedBuffer) │
      │ rotate ( track rotation )                                     │
      │ skewX ( track skew or share in X axis)                        │
      │ skewY ( track skew or share in Y axis)                        │
      │ copies ( track copies of shape)                               │
      │ TList ( track all past transformation with type and data)     │
      │                                                               │
     ─│───────────────────────────────────────────────────────────────│─     
      
 🔹in Style properties are so much you can google style applicable on svg element.     

#🔹Remember All properties in geometry & styke  are Proxed so user can not add , delete , set , create only property on Shape object.

 🔹Remember each shape object of respected Shape supports all specific properties of that shape like example ( rect -> x , y , width | ellipse -> cx , cy , rx ,ry )

 🔹There is only one properties setter and getter mathod i.e **attrs(props , mode ='r')**
 
    🔹1 ) If **first parameter** is object then **attrs** is setter.
    🔹It is quite different  from another libraries it has two modes i.e 'relative' or 'r' and 'anbsolute' or 'a' , by default mode is 'r'.
    🔹In mode 'r' it act  **relative to shape current position**.
🔹In mode 'a' it act **relative to canvas origin**.
 
    🔹2 ) If **first parameter** is string then **attrs** is getter.
    🔹If you fetch single property then it will return single property.
    🔹if you fetch multiple properties at a time then **string should be space seperate d by properties** :
    
            🔹1)  if all properties are valid it **returns [ ] of all valid** properties values 
            🔹attrs("x y red") -> output -> [12 , 34 , red]
            
            🔹if some of them properties are not valid then it will **return [ ] of that valid and undifined** in place which property are not valid.
            🔹attrs("x y redd red widdth") -> output -> [12 , 34 , undifined , red , undifined ]



 🔹Each shape supports all transformations methods i.e Translate , Rotate , Scale , Skew , Flip (for methods information look Transformation Module).

 🔹Each shape support Animations methods ( for methods information look Animation Module )
    🔹animate() -> works on fire and forget approch.
    🔹animatia() -> gives full control of animation object like( start , pause , resume , isRunning , isPaused )

 🔹Each shape support all filter methods i.e blur , glow , boxShadow , innerShadow , lightEffect , displacementEffect , colorMatrixTrabsformstion , newMorphEffect , glassMorphEffect (for methods information look Filters Module).

 🔹Each shape supports some extra methods like 
    🔹toBack(number) -> like z index effect 
    🔹toFront(number) -> like z index effect

 🔹**Internal Use Only Methods**
    🔹getGeo(acceskey) -> gives you full control of geometry of shape but protected by acceskey user can not use this method 
    🔹getStyle(acceskey) -> gives you full control of style of shape but protected by acceskey user can not use this method 
    🔹getFig(acceskey) -> gives you full control of actual dom ele1 of shape but protected by acceskey user can not use this method 
    🔹getClassProps(acceskey) -> gives you full control of Shape class variables of shape but protected by acceskey user can not use this method 
  




### ** Mathematics knowledge **

#    Shapes & Curves
          │
          ├── Curves
          │    ├── General Curve
          │    │    ├── Straight Line (special case: curvature = 0)
          │    │    │     ├── Polyline
          │    │    │
          │    │    ├── Cubic Curve
          │    │    ├── Quadratic Curve
          │    │    ├── Arc
          │    │    └── Ellipse Arc
          │    │    
          │    └── Conic Sections
          │         ├── Ellipse
          │         │    └── Circle (special case: rx = ry)
          │         ├── Parabola
          │         └── Hyperbola
          │
          └── Polygons
               ├── Quadrilateral (चौरस  & चतुर्भुज)
               │    ├── Triangle 
               │    ├── Rectangle (आयत: 4 right angles)
               │    │    └── Square (चौकोन: 4 equal sides + 4 right angles)
               │    ├── Rhombus (equal sides, angles not 90°)
               │    ├── Parallelogram (opposite sides parallel)
               │    ├── Trapezium (at least one pair of parallel sides)
               │    └── Kite (two pairs of adjacent equal sides)
               └── Other polygons (pentagon, hexagon, …)

--------------------------------------------------------------------

### 2. TRANSFORMATION MODULE

#   🔹Transformation types:
        'r' | 'relative' -> relative to top-left of OBB (oriented bounding box)
        'a' | 'absolute' -> relative to geometric center
        'p' | 'pivot'    -> relative to custom pivot point (px, py)
#   🔹Transformation operations:
        Translate -> { x, y, type, px, py }
        Scale     -> { sx, sy, type, px, py }
        Rotate    -> { angle, type, px, py }
        Skew      -> { sx, sy, type, px, py }
        Flip      -> { flipX, flipY, dirX, dirY }

#   🔹Batching Methods :
        beginT() -> start Batching of Transformations 
        endT() -> end Batching and apply composite matrix to shape 
 
        - in between beginT() and endT() any transformation get batched with chaining or without chaining.

#   🔹Transformation DSL:
       🔹String-based transformations, batch multiple operations
       🔹Example:
            T(x, y, type, px, py) -> Translate
            S(sx, sy, type, px, py) -> Scale
            R(angle, type, px, py) -> Rotate
            H(x, y, type, px, py) -> Skew
    🔹Key notes:
       🔹Every transformation has its own parameters and pivot system.
       🔹All transformations support all modes.
       🔹Composite matrices are supported through DSL strings.
       🔹All methods supports chaining for **chain Pattern** method calls with DSL or without DSL .


#  🔹Each shape object has its own CMATH object for all Matrix manipulation.

#  🔹 Discription:
 
       🔹**Transformation Class** is a **Minix Pattern Class** of **Graphics Element Class** and transformation functions.
       
       🔹Each transformation supports all three types of transformation types that are relative, absolute, povit only when type parameter is respective type except Flip.
 
       🔹By default type for Translation is 'r' and for all other transformation type is 'a' 
 
       🔹( type , px , py ) are default parameter of transformation except Flip.
        
       🔹px , py only works when type parameter is 'pivot' or 'p' .
        
       🔹When  type are 'r' or 'a' and even if you give ( px , py ) seperately it won't affect at all in respective transformation.
 
       🔹It supports batching via beginT() and endT() or transfor() through DSL 
        
       🔹In transform() method except Flip all other methods supports by their methods  first capital latter only exception is Skew maped to H because of Name **ambiguity**.


#  🔹 Transformation Pipeline Orchestration  
:
#   One of most hard part of entire project 




 ─│─────────────────────────────────────────│─                  
  │  call any transformation on any shape   │ <─────────────────│─ 
 ─│─────────────────────────────────────────│─                  │
                   │                                            │
                   │                                            │
                   │                                            │
 ─│─────────────────────────────────────────│─                  │ 
  │ extract all parameters from used method │                   │        
 ─│─────────────────────────────────────────│─                  │ 
                   │                                            │   
                   │                                            │   
             'r'   │    'p'                                     │
 ─│────────────── type ──────────────────────────│─             │
  │                │                             │              │
  │                │'a'                          │ user given   │
  │                │                             │ arbitrary    │
  │ Top-Left       │ for Translate (Top-Left)    │ points       │
  │                │ other-wise (Center)         │              │
  │                │                             │              │
 ─│───────────────>│<────────────────────────────│─             │   
                   │                                            │
                   │                                            │--> false 
                   │->[px ,py]                                  │
                   │                                            │
                   │                                            │
     ─│─────────────────────────│─                              │
      │ translate(px,py)        │                               │
      │ given transformation    │-> Multiplication Using        │
      │ translate(-px,-py)      │   DOMMatrix API               │
     ─│─────────────────────────│─                              │
                   │                                            │
                   │                                            │
                   │-> Composite TMatrix as DOMMatrix           │
                   │                                            │
                   │                                            │
     ─│─────────────────────────│─                              │
      │ shape ( shape name )    │                               │
      │ SharedBuffer (1D Array) │                               │
     ─│─────────────────────────│─                              │
                   │                                            │
                   │                                            │
                   │         true                               │
          ─│──────────────│─                          ─│──────────────────│─
           │  isBaching   │──────────────────────────> │ is endT() called │
          ─│──────────────│─                          ─│──────────────────│─
                   │                                            │
          false <--│                                            │
                   │                                            │
                   │                                            │--> true 
          TMatrix as 1D Array                                   │   
     ─│─────────────────────────│─                              │   
      │                         │ <─────────────────────────────│─ 
      │    Multiplication       │
      │ SharedBuffer x TMatrix  │
      │                         │--> optimized multiplication function from **WASM MODULE**
     ─│─────────────────────────│─    
                   │
                   │
     ─│─────────────────────────│─ 
      │ apply TMatrix to shape  │
      │       or render         │
     ─│─────────────────────────│─    
                   │
                   │
     ─│─────────────────────────│─ 
      │ compute all Dimensions  │
      │ from SharedBuffer data  │--> store in **Shape Module to shape geometry** 
     ─│─────────────────────────│─   

--------------------------------------------------------------------

### 3. ANIMATION MODULE

#   🔹Animation methods :
        animate()  -> fire and forget
        animatia() -> returns animation object with full control
                      (start, pause, resume, isRunning, isPaused)
#   🔹Syntax:
        animate/animatia(
            shape or transformation props,
            advanced props,
            duration,
            easing,
            onComplete
        )

#   🔹Props:
        Shape/Transformation props:
            e.g. Rect -> { x, y, width, height, rx, ry }
                 Circle -> { cx, cy, r }
                 Transformations -> { translate, rotate, scale, skew }

#        Advanced props:
            {
                physics: {
                    physicsMotion: boolean
                    speed: number
                },
                curve: {
                    curvePathMotion: boolean
                    curvePath: 'linear' | 'quadratic' | 'cubic' | 'arc'
                    stepness: number
                    smoothness: number
                },
                pivot: {
                    mode: 'r' | 'c' | 'p' | 'relative' | 'centre' | 'pivot'
                    scalePivot:  [number, number]
                    skewPivot:   [number, number]
                    rotatePivot: [number, number]
                    commonPivot: [number, number]
                },
                controls: {
                    loop: boolean
                    direction: directions
                    optimizationTechnique: opt
                }
            }

#        Time/Duration:
           🔹Time-based animation control

#        Easing:
           🔹Built-in:
                linear
                easeInQuad, easeOutQuad, easeInOutQuad
                easeInCubic, easeOutCubic, easeInOutCubic
                easeOutBounce, easeInBounce, easeInOutBounce
           🔹Custom: any function (number) => number

#        OnComplete:
           🔹Callback function triggered when animation finishes

#   🔹Key Notes:
       🔹Animations can follow curve paths with adjustable stepness/smoothness.
       🔹Pivot system allows per-transformation pivots or common pivots.
       🔹Default settings:
            curvePathMotion = true
            curvePath = linear
            pivot mode = centre ('c')
            physicsMotion = false
            speed = 1
            loop = false
            direction = normal
            optimization = fitPolynomialCoefficient


### Description : 

#  curve object Notes 
 
       🔹 curvePathMotion -> enables along curve path following for shape
 
       🔹 curvePath -> create given curvePath for Animation to animate shape along with given curve
 
       🔹 stepness -> allow custom slope or curvature for any curve
 
       🔹 smoothness -> allow how much samples of curve would going to compute for Animation and how smoothness Animation will go


#  pivot object Notes 
 
       🔹 mode :
            Translate only and only mode -
 
                 🔹 'c' | 'centre' -> Animation is geometric centre of shape based. and all other Transformations Default pivots become same centre of shape.
 
                 🔹 'r' | 'relative' -> Animation is Left Top of OBB based. and all other transformations Default pivots become same Top Left of shape or OBB.
 
            Except Translate mode -
 
                 🔹 'p' | 'pivot' -> it allow all other Transformations except translate to use particular pivot points given by user or system generated according to user inputs.
 
       🔹 commonPivot :
 
                 🔹 if given then system uses common Pivot for all Transformations
 
       🔹 if commonPivot not given then user can give separate pivots for each Transformations


# Note 
 
       🔹 But all parameters are optional user can give as null even as Advance props.
 
       🔹 By Default
            🔹 curvePathMotion is true, curvePath is linear only and if only translate is available in first parameter
                   🔹 if translate is available then :
 
                          🔹 pivot mode by Default is 'c'
 
                          🔹 all pivots given by user will override by system for visual consistency and correctness according to 'c' or 'r' mode given by user.
 
            🔹 physicsMotion is false, speed is 1
 
            🔹 pivot are [ 0 , 0 ]
 
            🔹 loop is false, direction is normal, optimizationTechnique is fitPolynomialCoefficient


### Animation Pipeline Orchestration :
 
 
     ─│─────────────────────────────│─  
      │  call any Animation on any  │   
      │          Shape              │   
     ─│─────────────────────────────│─  
                   │                                            
                   │                                            
     ─│─────────────────────────────│─  
      │ extract all parameters from │   
      │     user used method        │   
     ─│─────────────────────────────│─  
                   │
                   │ 
     ─│─────────────────────────────│─  
      │ seperate given properties   │   
      │     GEOMETRY & STYLE        │   
     ─│─────────────────────────────│─  
                   │                                                
                   │ 
     ─│────────────────────────────────────────────│─ 
      │ compose shape specific & common properties │   
      │ into transformable GEOMETRY & set default  │
      │ Advance props wherever necessary  And      │ 
      │ convert style fill , stroke or colors into │ 
      │ [R,G,B,A] channels to interpolate easily   │ 
     ─│────────────────────────────────────────────│─   
                   │    
                   │    
                   │--> If translation available or                                   
                   │     any translate relative property                              
                   │                                                                                    
         true      │                                                       
 ─│────────────────────────────────────────────────│─             
  │                             false              │
  │                                                │     
  │                                                │
 ─│────────────────│─                              │
                   │                               │
                   │                               │                    
            ─│────────────│─  false                │                      
             │  direction │───────────│─           │ 
            ─│────────────│─          │            │   
                   │                  │            │
                   │                  │            │
          true  <--│        mode ='c' │            │
                   │                  │            │
                   │                  │            │
                   │ <────────────────│─           │
                   │                               │
                   │                               │
      'r'   ─│────────────│─    'c'                │                      
 ─│──────────│  direction │───────────│─           │ 
  │         ─│────────────│─          │            │   
  │                                   │            │
  │ Top                     geometr   │            │
  │ Left                     centre   │            │
  │                                   │            │
  │                                   │            │
 ─│───────────────>│<─────────────────│─           │
                   │                               │
                   │                               │
                   │-> pivots                      │
                   │                               │
                   │                               │
     ─│─────────────────────────│─    ─│─────────────────────────│─
      │ compute all pivots      │      │ compute all pivots      │
      │ respects to translation │      │ respects to own space   │────│─ 
      │ frame of reference      │      │ frame of reference      │    │                     
     ─│─────────────────────────│─    ─│─────────────────────────│─   │                       
                   │                                                  │
                   │                                                  │
                   │ <───<───<───<───<───<───<───<───<───<───<───<────│─
                   │ <───<───<───<───<───<───<───<───<───<───<───<────│─                    
                   │                                                  
                   │                                             
           ─│────────────│─  'reverse'
            │ direction  │──────────────│─
           ─│────────────│─             │  
                   │                    │                                
                   │                    │                                
                   │                    │  ─│────────────────────────│─ 
          'normal' │                    │   │ reverse all parameters │  
       'alternate' │                    │<--│ in space except scale  │  
                   │                    │  ─│────────────────────────│─ 
                   │                    │                                
                   │<───────────────────│─                               
                   │                                                
                   │
                   │───>───>───>───>───>───>───>───>───>───>───>──────│─
                   │───>───>───>───>───>───>───>───>───>───>───>──────│─
                   │                                                  │
                   │                                                  │
                   │                                                  │
     ─│─────────────────────────│─                                    │
      │ compute sample pioints  │                                     │
      │ on curve with given     │                                     │
      │ bend & smoothness with  │                                     │
      │ extra parameters        │                                     │
     ─│─────────────────────────│─                                    │
                   │                                                  │
                   │                                                  │
                   │                                                  │ 
         ─│───────────────────│─                                      │
          │   PhysicsMotion   │────│─                                 │
         ─│───────────────────│─   │                                  │    
                   │               │--> true                          │        
                   │               │                                  │
                   │               │  ─│─────────────────────────│─   │                                 
                   │               │   │   compute Arc length    │    │
          false <--│               │<--│  re-parameterization    │    │
                   │               │  ─│─────────────────────────│─   │                              
                   │               │                                  │
                   │<──────────────│─                                 │
                   │                                                  │
                   │                                                  │
                   │<─────────────────────────────────────────────────│─
                   │                                                  
                   │                                                                                  
     ─│─────────────────────────│─                     
      │ is Rotation && has      │                      
      │ arbitrary pivots        │───────│─                      
     ─│─────────────────────────│─      │                    
                   │                    │--> false         
                   │                    │                    
                   │                    │ set                                                           
          true  <--│                    │ optimizationTechnique = "preComputeFrames"              
                   │                    │
                   │<───────────────────│─
                   │                          
                   │
     ─│────────────────────────│─ 
      │ optimizationTechnique  │
     ─│────────────────────────│─    
                   │
                   │
─│──────────────────────────────────────────────────────────────────────────────────────│─
 │                                                                                      │ 
 │-->  1) preComputeFrames                                   2) fastPolynomialFit    <--│ 
 │                                                                                      │ 
 │ Compute only 100 keyFrames with                  Fit base and commposed Tmatrix and  │ 
 │ with subpixel with linear interpolation          create 6 polynomial equations for   │ 
 │ commposed with base Tmatrix of shape             6 2D affine matrix confficeints to  │ 
 │ for proper visuals                               get correct TMatrix at a point      │ 
 │                                                                                      │ 
 │ Storage Heavy and pre computed                   Use very less storage compute on    │
 │ Good for accuret visuals                         the fly less accuret visuals        │ 
 │                                                                                      │ 
 │                                                                                      │ 
─│──────────────────────────────────────────────────────────────────────────────────────│─
                   │
                   │
     ─│─────────────────────────│─ 
      │     Lunch Animstion     │
     ─│─────────────────────────│─ 


### Animation Render loop Orchestration :

   progress = 0 
   tempProgress = 0 
   reverseCycle 
   direction 

 
     ─│─────────────────────────│─                     
      │    start() Animation    │                          
     ─│─────────────────────────│─                     
                   │
                   │ <───────────────────────────────────────────────────────────────────────────────────────────│─                                
                   │                                                                                             │
                   │                                                                                             │
         ─│───────────────────│─      true                                                                       │
          │ animationStatus   │  ───────────────────> get out of Animation                                       │
         ─│───────────────────│─                                                                                 │
                   │                                                                                             │
                   │                                                                                             │
          false <--│                                                                                             │
                   │                                                                                             │
                   │                                                                                             │
  ─│────────────────────────────────│─                true                                                       │
   │ isTranslation && physicsMotion │  ──────────────────────────│─                                              │
  ─│────────────────────────────────│─                           │                                               │
                   │                                             │                                               │
                   │                                             │                                               │
                   │                                             │                                               │
                   │                                             │                                               │
                   │     ─│───────────────────────────────────────────────────────────────────────────────│─     │
                   │      │                                                                               │      │
                   │      │ 1). Compute Distance from elapsed time x speed x total legth of curve         │      │
                   │      │     Distance = ( (elapsedTime /1000) x speed x totalLength                    │      │
          false <--│      │                                                                               │      │
                   │      │ 2). Compute progress time at that perticular Distance from Arc Length Table   │      │
                   │      │   or ( re-parameterize progress from Distance to time)                        │      │
                   │      │  progress = getTimeForDistance( Distance)                                     │      │
                   │      │                                                                               │      │     
                   │     ─│───────────────────────────────────────────────────────────────────────────────│─     │  
                   │                                             │                                               │  
                   │                                             │                                               │  
                   │                                             │                                               │  
                   │                                             │                                               │  
                   │                                             │                                               │  
 ─│────────────────────────────────────────────│─                │                                               │  
  │                                            │                 │                                               │  
  │ 1). Compute time from :                    │                 │                                               │  
  │   time= (elapsedTime x speed )/totalTime   │                 │                                               │  
  │                                            │                 │                                               │  
  │ 2). Apply easing of choosen                │                 │                                               │  
  │  progress = easing( time )                 │                 │                                               │
  │                                            │                 │                                               │
 ─│────────────────────────────────────────────│─                │                                               │
                   │                                             │                                               │
                   │                                             │                                               │
                   │                                             │                                               │
                   │                                             │                                               │
                   │ <───────────────────────────────────────────│─                                              │
                   │                                                                                             │
                   │                                                                                             │
                   │                                                                                             │
  ─│────────────────────────────────│─                                                                           │
   │   normalize progress [ 0 , 1 ] │                                                                            │
  ─│────────────────────────────────│─                                                                           │
                   │                                                                                             │
                   │                                                                                             │
                   │                                                                                             │
                   │                                                                                             │
                   │                                                                                             │
  ─│────────────────────────────────│─        'alternate' & true                                                 │
   │   direction && reverseCycle    │  ──────────────────────────────────│─                                      │
  ─│────────────────────────────────│─                                   │                                       │
                   │                                                     │                                       │
                   │                                                     │                                       │
                   │                                                     │                                       │
                   │                                    ─│───────────────────────────────│─                      │              
                   │                                     │                               │                       │
     'normal'      │                                     │ 1). Reverse the progress :    │                       │
    'reverse'      │                                     │     tempProgress = progress   │                       │
        &          │                                     │      progress = 1 - progress  │                       │
      false        │                                     │                               │                       │
                   │                                    ─│───────────────────────────────│─                      │
                   │                                                     │                                       │
                   │                                                     │                                       │
                   │                                                     │                                       │
                   │                                                     │                                       │ upward
                   │ <───────────────────────────────────────────────────│─                                      │
                   │                                                                                             │
                   │                                                                                             │
                   │                                                                                             │
  ─│────────────────────────────────│─                                                                           │
   │   Interpolate() & Render()     │                                                                            │
  ─│────────────────────────────────│─                                                                           │
                   │                                                                                             │
                   │                                                                                             │
                   │                                                                                             │
                   │                                                                                             │
                   │                                                                                             │
                   │                                                                                          ───────
  ─│────────────────────────────────────│─                             false                                  ───────
   │ progress >= 1 || tempProgress == 1 │ ───────────────────────────────────────────────────────────────────────│─ 
  ─│────────────────────────────────────│─                                                                    ─────── 
                   │                                                                                          ───────
                   │                                                                                             │
                   │                                                                                             │
          true  <--│                                                                                             │
                   │                                                                                             │
                   │                                                                                             │
                   │                                                                                             │  upward 
                   │                                                                                             │
     ─│──────────────────────────────│─                false                                                     │
      │  !( loop || (reverseCycle && │ ─────────────────────────────────│─                                       │
      │ direction =='alternate' )    │                                  │                                        │
     ─│──────────────────────────────│─                                 │                                        │
                   │                                                    │                                        │     
                   │                                                    │                                        │     
                   │                                                    │                                        │     
                   │                                                    │                                        │     
                   │                                                    │                                        │     
                   │                                                    │                                        │
                   │                                      ─│──────────────────────────│─                         │            
           true <--│                                       │                          │                          │
                   │                                       │ startTime = currentTime  │                          │ 
                   │                                       │ elapsedTime = 0          │──────────────────────────│─ 
                   │                                       │ progress = 0             │  
                   │                                       │ nextFrame()              │    
                   │                                       │                          │   
                   │                                      ─│──────────────────────────│─ 
     ─│────────────────────────────│─                        
      │    animationState = false  │
      │    onComplete()            │
      │    cleanUp()               │
     ─│────────────────────────────│─
                   │
                   │
                   │
                   │
  ─│────────────────────────────────│─ 
   │    direction !== 'alternate'   │  
  ─│────────────────────────────────│─ 
                   │
                   │
                   │
  ─│───────────────────────────────────│─ 
   │ applyFinalTransformationMatrix(1) │  
  ─│───────────────────────────────────│─ 



--------------------------------------------------------------------

### 4. EVENT MODULE

#   🔹Supports 14+ events on shapes, canvas, or groups:
        click, dblclick, mouseDown, mouseUp, mouseMove,
        touchStart, touchEnd, touchMove,
        contextMenu, wheel, enterMouse, leaveMouse,
        hover, drag
   🔹Supports "un" prefix for unregistering events.


### Discription :
 
    🔹Each element supports one event only at a time of same event , You can not use same events more than one time on same element.
 
    🔹All event supports same Syntax which is below expect drag :
 
       🔹event( callback: (e: Event) => void, props : object , useC: string ) 
 
            🔹callback -> it is callback function used to call in event.
            🔹props - optional -> if allow stopPropagation : Boolean preventDefault : Boolean  for propogation and default behaviour.
            🔹useC - optional -> custom name for event for avoiding conflicts.
 
    🔹All undo events starts with 'un' prefix infront of same event name.
       🔹unevent( useC : string );
            🔹 useC - optional -> custom given name to delete perticular event.
 
    🔹 drag event - supports three callbacks at a time which are 
       🔹 onStart (x : number ,y : number )=> void - onStart fuction of drag which will be called on touch start and mouseDown.
       🔹 onMove ( x : number , y : number )=> void - onMove function of drag which will ve called on moving cursor.
       🔹 onEnd ( x : number , y : number)=> void - onEnd function of dra which will be called when touch leave or mouseUp.



--------------------------------------------------------------------

### 5. GROUP MODULE

# Work in progress 60% completed

#   🔹Supports grouping of shapes or groups (nested groups allowed).
   🔹Groups behave like shapes:
       🔹Support transformations
       🔹Support animations
       🔹Support events


### 6. Filters MODULE 

# Work in progress 50% completed.

# filter types :
  🔹 blur 
  🔹 glow
  🔹 boxShadow
  🔹 innerShadow
  🔹 lightEffect
  🔹 displacementEffect
  🔹 colorMatrixTransformstion
  🔹 newMorphEffect
  🔹 glassMorphEffect

  🔹 All above filters are implemented but need some care and optimization 
====================================================================
###                      PROJECT STATUS
====================================================================

# IMPLEMENTED (70%):
   🔹Shapes Module
   🔹Transformation Module
   🔹Animation Module
   🔹Event Module
   🔹Group Module (partial)
   🔹WASM integration
   🔹Core architecture

# PENDING (30%):
   🔹Filters Module
   🔹Full testing (20% completed)
   🔹Documentation
   🔹Demos
   🔹Remaining parts of Group Module
   🔹Extra utilities

====================================================================
###                           SUMMARY
====================================================================

# Shantanu.js/.ts is:
   🔹A 100% math-driven, zero-dependency, WASM + TypeScript graphics library
   🔹Fully modularized and decoupled for future backend support
   🔹Equipped with advanced transformations and animation system
   🔹Supporting curve-based, pivot-based, and physics-based motion
   🔹Interactive with full event handling
   🔹Designed with extensibility and performance as top priorities

### This is the first version (70% complete) with the remaining 30% under development.Once completed, it aims to be one of the most flexible and powerful 2D graphics engines built from scratch by a solo developer.
