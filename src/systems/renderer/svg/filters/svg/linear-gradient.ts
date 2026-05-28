// import {
//   addTo,
//   createSVGElement
// } from '../../../../core/provider/svgSpecific.js';
//
// import {
//   linearGradientProps,
//   GradientDirection
// } from '../../../../types/filters.d';
// import { generateId } from '../../../helpers/helpers.js';
//
// /**
//  * Creates an SVG linear gradient definition.
//  *
//  * @param props - Gradient direction and color stops configuration.
//  * @returns Object containing the unique gradient id and SVG <linearGradient> element.
//  */
// export function svgLinearGradient(props: linearGradientProps) {
//   const directions: Record<
//     GradientDirection,
//     [string, string, string, string]
//   > = {
//     LR: ['0%', '0%', '100%', '0%'],
//     RL: ['100%', '0%', '0%', '0%'],
//     TB: ['0%', '0%', '0%', '100%'],
//     BT: ['0%', '100%', '0%', '0%'],
//     TLBR: ['0%', '0%', '100%', '100%'],
//     BRTL: ['100%', '100%', '0%', '0%'],
//     TRBL: ['100%', '0%', '0%', '100%'],
//     BLTR: ['0%', '100%', '100%', '0%']
//   };
//
//   const { direction = 'LR', stops = [] } = props;
//   const [x1, y1, x2, y2] = directions[direction];
//   const id = `linearGradient-${direction + generateId('')}`;
//
//   const linearGradient = createSVGElement('linearGradient');
//   linearGradient.setAttribute('id', id);
//   linearGradient.setAttribute('x1', x1);
//   linearGradient.setAttribute('y1', y1);
//   linearGradient.setAttribute('x2', x2);
//   linearGradient.setAttribute('y2', y2);
//
//   let lastOffset = 0;
//   let nextExplicitIndex = stops.findIndex((s) => s!.offset !== undefined);
//   if (nextExplicitIndex === -1) nextExplicitIndex = stops.length;
//
//   for (let i = 0; i < stops.length; i++) {
//     const stop = stops[i];
//     let offset: number;
//
//     if (stop!.offset !== undefined) {
//       offset = parseFloat(String(stop!.offset));
//       lastOffset = offset;
//
//       nextExplicitIndex = stops.findIndex(
//         (s, idx) => idx > i && s!.offset !== undefined
//       );
//       if (nextExplicitIndex === -1) nextExplicitIndex = stops.length;
//     } else {
//       const nextOffset =
//         nextExplicitIndex < stops.length
//           ? parseFloat(String(stops[nextExplicitIndex]!.offset!))
//           : 100;
//
//       const gaps =
//         nextExplicitIndex < stops.length
//           ? nextExplicitIndex - i + 1
//           : stops.length - i;
//
//       offset = lastOffset + (nextOffset - lastOffset) / gaps;
//       lastOffset = offset;
//     }
//
//     const stopEl = createSVGElement('stop');
//     stopEl.setAttribute('stop-color', stop!.color);
//     stopEl.setAttribute('offset', `${offset}%`);
//
//     addTo(linearGradient, stopEl);
//   }
//
//   return { id, filter: linearGradient };
// }
