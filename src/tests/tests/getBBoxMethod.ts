// import shantanuJSTest from "../testingTool/shantanuJS-test.js";
// import { initializeCanvasAndShapes } from "../data/initializeCanvasAndShapes.js";
//
// export function getBBoxMethod() {
//   const testEnv = new shantanuJSTest(import.meta.url);
//
//   testEnv.env({
//     initialize(api, ctx) {
//       initializeCanvasAndShapes(api, ctx);
//     },
//
//     run(ctx) {
//       Object.keys(ctx.shapes).forEach((name) => {
//         testEnv.shTest({
//           testInfo: {
//             description: "Testing .getBBox() method",
//             module: "core",
//             testType: "unit",
//             element: name,
//           },
//
//           actions() {},
//
//           expect: {
//             constraints: { save: false },
//
//             testSubject: name,
//
//             validators: {
//               bbox: {
//                 expected: undefined,
//                 expectedStatus: "pass",
//
//                 validate(shape) {
//                   const box = shape.getBBox();
//
//                   return box &&
//                     Number.isFinite(box.x) &&
//                     Number.isFinite(box.y) &&
//                     Number.isFinite(box.width) &&
//                     Number.isFinite(box.height)
//                     ? "pass"
//                     : "fail";
//                 },
//               },
//             },
//           },
//         });
//       });
//     },
//   });
// }
