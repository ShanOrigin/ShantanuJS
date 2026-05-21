import type { GraphicsNode, IGraphicsContainer } from './graphics-container';

export interface Renderer {
  render(...shapes: GraphicsNode[]): void;
}
