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

   - Write comments to everywhere where according to context code going to change 
       - Write detailed comment so future self thanks us.
