import type { GraphicsNode, IGraphicsContainer } from "./graphics-container";

type RenderPhase = "PREPARE" | "RENDER";

export interface IRenderer {
  render(phase: RenderPhase, ...shapes: GraphicsNode[]): void;
}
