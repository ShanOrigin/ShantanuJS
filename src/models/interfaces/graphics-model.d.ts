import type { AttrsMethodReturnTypes } from "../types/common";

import type {
  ValidGraphicsShapes,
  InternalGeometry,
  PublicGeometry,
  InternalStyle,
  PublicStyle,
} from "../types/graphics-model";

export interface IGraphicsModel<T extends ValidGraphicsShapes> {
  readonly geometry: PublicGeometry<T>;

  readonly style: PublicStyle<T>;

  attrs(
    props: Partial<InternalGeometry<T> & InternalStyle<T>> | string,
  ): AttrsMethodReturnTypes;

  toFront(): void;
  toBack(): void;

  hide(): void;
  show(): void;
}
