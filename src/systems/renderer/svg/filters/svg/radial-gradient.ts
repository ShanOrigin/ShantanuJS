// import {
//   addTo,
//   createSVGElement
// } from '../../../../core/provider/svgSpecific.js';
//
// import type {
//   radialGradientProps,
//   RadialPosition
// } from '../../../../types/filters';
// import { generateId } from '../../../helpers/helpers.js';
//
// /**
//  * Creates an SVG radial gradient definition.
//  *
//  * @param props - Gradient position, radius, focal point, and color stops.
//  * @returns Object containing the unique gradient id and SVG <radialGradient> element.
//  */
// export function svgRadialGradient(props: radialGradientProps) {
//   const positions: Record<RadialPosition, [string, string]> = {
//     CENTER: ['50%', '50%'],
//     TL: ['0%', '0%'],
//     TR: ['100%', '0%'],
//     BL: ['0%', '100%'],
//     BR: ['100%', '100%']
//   };
//
//   let {
//     direction = 'CENTER',
//     radius = 50,
//     focalX = 50,
//     focalY = 50,
//     stops = []
//   } = props;
//
//   radius = Math.abs(radius);
//   focalX = Math.abs(focalX);
//   focalY = Math.abs(focalY);
//
//   const [cx, cy] = positions[direction];
//   const id = `radialGradient-${direction + generateId('')}`;
//
//   const gradient = createSVGElement('radialGradient');
//
//   if (direction === 'BR') {
//     if (focalX < 30) focalX = 30;
//     if (focalY < 30) focalY = 30;
//   }
//
//   if (direction === 'TR') {
//     if (focalX < 50) focalX = 50;
//     if (focalY > 80) focalY = 80;
//   }
//
//   if (direction === 'CENTER') {
//     if (focalX < 30 || focalX > 70) focalX = 50;
//     if (focalY > 90) focalY = 80;
//   }
//
//   gradient.setAttribute('id', id);
//   gradient.setAttribute('cx', cx);
//   gradient.setAttribute('cy', cy);
//   gradient.setAttribute('r', direction === 'CENTER' ? `${radius}%` : '100%');
//   gradient.setAttribute('fx', `${focalX}%`);
//   gradient.setAttribute('fy', `${focalY}%`);
//   gradient.setAttribute('gradientUnits', 'objectBoundingBox');
//
//   const total = stops.length;
//   if (!total) return { id, filter: gradient };
//
//   let firstExplicit = -1;
//   let lastExplicit = -1;
//
//   for (let i = 0; i < total; i++) {
//     if (stops[i]?.offset !== undefined) {
//       if (firstExplicit === -1) firstExplicit = i;
//       lastExplicit = i;
//     }
//   }
//
//   for (let i = 0; i < total; i++) {
//     const stop = stops[i];
//     let offset: number;
//
//     if (stop?.offset !== undefined) {
//       offset = parseFloat(String(stop.offset));
//     } else {
//       if (firstExplicit === -1) {
//         offset = total > 1 ? (i / (total - 1)) * 100 : 0;
//       } else if (i < firstExplicit) {
//         offset =
//           (i / firstExplicit) *
//           parseFloat(String(stops[firstExplicit]?.offset!));
//       } else if (i > lastExplicit) {
//         offset =
//           parseFloat(String(stops[lastExplicit]?.offset!)) +
//           ((i - lastExplicit) / (total - 1 - lastExplicit || 1)) *
//             (100 - parseFloat(String(stops[lastExplicit]?.offset!)));
//       } else {
//         let nextExplicit = i + 1;
//         while (
//           nextExplicit < total &&
//           stops[nextExplicit]?.offset === undefined
//         )
//           nextExplicit++;
//
//         const prevOffset = parseFloat(String(stops[i - 1]?.offset!));
//         const nextOffset =
//           nextExplicit < total
//             ? parseFloat(String(stops[nextExplicit]?.offset!))
//             : 100;
//
//         const gap = nextExplicit - (i - 1);
//         offset = prevOffset + (nextOffset - prevOffset) / gap;
//         stops[i]!.offset = offset;
//       }
//     }
//
//     const stopEl = createSVGElement('stop');
//     stopEl.setAttribute('stop-color', stop!.color);
//     stopEl.setAttribute('offset', `${offset}%`);
//
//     addTo(gradient, stopEl);
//   }
//
//   return { id, filter: gradient };
// }
