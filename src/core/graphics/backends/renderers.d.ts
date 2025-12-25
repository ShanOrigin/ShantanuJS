import type {
  GraphicalElement,
  GShpesTages
} from '../graphicsElement/graphicsElement';

export interface Renderer {
  render(shapes: Array<GraphicalElement<GShpesTages>>): void;
}
