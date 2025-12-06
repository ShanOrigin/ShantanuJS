# Project TODOs ✅

This project is still **in progress**.  
Below is a checklist of tasks to complete before finalizing the project structure and making it production-ready.

---

### +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

### IMPORTANT Big issuse ### 

### Change attrs() structure :
    - any property Change affect original geometry matrix and SVG (if Backed is SVG ) directly
    - any privious applyed transformations would be reapplyed again after original geometry change 
    - compute new dimensions according to changes 

### Put matrix as original :
    - create temporary transformed state whenever need in execution flow     - Area -> in transformations while batching 
    - transfer batched temporary transformed matrix state to compute new dimensions as parameters
    - do not create temporary transformed matrix state in compute dimensions
   
### Always recompute Transformation matrix : to avoid floating point drift approximatly 
    - use TList transformations stack for recompute Transformation matrix 
    - then apply to new or updated original matrix state 
    - store new state in temporary state do not modify original matrix state 
    - then recompute new dimensions from temporary transformed state if need or use temporary state for any other use 

### +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++



## 🔹 Naming Consistency
- [ ] Fix typos in file/folder names:

- [ ] Double-check for other small typos before release.

---

## 🔹 Project Structure
- [ ] Ensure `index.ts` cleanly re-exports everything from `Shantanu.ts`.
- [ ] Confirm `Shantanu.ts` is the **main entry point** (library exports).
- [ ] Keep `vtest.ts` only for **visual testing**, consider renaming → `visualTest.ts`.
- [ ] Remove or archive sandbox/experimental files if not needed.
- [ ] Fill or remove empty folders:
  - `shapes/structuralReusableElements/`
  - `tests/shapes/customShapes/`
  - `tests/shapes/mediaShapes/image/`
  - `tests/shapes/mediaShapes/text/`

---

## 🔹 Testing
- [ ] Add missing **unit tests** for custom shapes.
- [ ] Add **media shape tests** (text + image).
- [ ] Ensure `vtest.ts` demonstrates all shapes, animations, transformations.

---

## 🔹 Documentation
- [ ] Write **README.md** with:
  - Project description  
  - Installation steps  
  - Usage examples (importing from `Shantanu.ts`)  
  - Example output images/screenshots  
- [ ] Add **folder structure overview** (similar to what you shared).
- [ ] Optionally, create `docs/` folder for extended documentation.

---

## 🔹 Final Polish
- [ ] Remove duplicate/experimental auth files in `secretes/` if not required.
- [ ] Make sure `webAsm/` build pipeline is documented (how to rebuild `.wasm`).
- [ ] Verify type declarations in `types/` are complete.
- [ ] Add license file (MIT, Apache, etc.).
- [ ] Add version + entry point (`main`, `types`) in `package.json`.

---

✅ Once all these are checked, the project will be **ready for release/demo**.

## Very IMPORTANT :

   - implement context based canvas support

   - Write comments everywhere where something will change according to context and specific shape.
       - Write detailed , discritive comments about what would change so future self thanks us.

### 06 - 12 - 2025 -> started adding context based architecture into entire library

# core class
   - there would be private variable context which is going to hold the context of the Canvas .
   - there would be renderar  private variable which is going to hold the renderar for Canvas itself and all elements which will be going to add in Canvas for rendering perpose.
   - there is already fig private variable which is going to hold shape specific elements in 'svg' context or canvasNode in HTMLCanvas or in other backends.

   - all these context , renderar , fig  are initially unset or null and  only in 'svg'  or  'HTMLCanvas' going to create then these three variable get set by its proper values
   - except canvas creation in all other shapes these 3 variable will be null or unset initially 

# Canvas 
   - when any element going to add a particular Canvas then first Canvas will check is there context available if available then it will not add thst element to this canvas   - otherwise it will do below steps ,
   - Canvas then Canvas will give its context as value  and renderar as reference  to that elements.
   - Then Canvas will create a proper element according to the given context for that element and it will assigned that element to  fig private variable  of that element.
   - eg . consider element is rect 
          In 'svg' context it should be <rect> element node of svg .
          In 'HTMLCanvas' context it should be 'HTMLCanvas' node itself.

   - then Canvas will add that element into canvas itself for tracking.

# Any Shape of Shape Module 
   - Now any shape can render itself into the Canvas according to the given context.
   - That particular shape only can call that renderer to render , but  it cannot render itself directly into Canvas , it will just call randerar and renderar will handle rest all thing according to given context.
   - entire model is working on single policy i.e ,
       one shape can reside in one Canvas only at a time
