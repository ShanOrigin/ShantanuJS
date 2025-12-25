import { SVGRenderer } from './svg/svgRenderer/svgRenderer.js';

import type { CONTEXT } from '../../../types/graphicsElements';
import type { Renderer } from './renderers';

export function initRenderer(context: CONTEXT): Renderer {
  switch (context) {
    case 'svg':
      return new SVGRenderer();
    /*    case 'canvas':
      return new CanvasRenderer(context);
*/
    default:
      throw new Error('Unsupported renderer context');
  }
}
