export type Components = "event" | "transform" | "animation" | "filter";

import type { IAnimation } from "../interfaces/animation";
import type { IEvent } from "../interfaces/event";
import type { IFilter } from "../interfaces/filters";
import type { ITransformation } from "../interfaces/transformation";

export type ComponentsRegistry = {
  transformation: ITransformation;
  animation: IAnimation;
  filter: IFilter;
  event: IEvent;
};

export type InitOrGetComponentsReturnType =
  IAnimation | IEvent | IFilter | ITransformation;
