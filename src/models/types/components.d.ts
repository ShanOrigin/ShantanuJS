export type Components = 'event' | 'transform' | 'animation' | 'filter';

/**
 * Event component contract.
 */
export interface IEventComponent {
  [key: string]: unknown;
}

/**
 * Transform component contract.
 */
export interface ITransformComponent {
  [key: string]: unknown;
}

/**
 * Animation component contract.
 */
export interface IAnimationComponent {
  [key: string]: unknown;
}

/**
 * Single filter component contract.
 */
export interface IFilterComponent {
  [key: string]: unknown;
}

/**
 * Centralized component registry mapping.
 */
export interface IComponentsRegistry {
  event: IEventComponent;
  transform: ITransformComponent;
  animation: IAnimationComponent;
  filter: IFilterComponent[];
}

export type ComponentsObject = {
  [K in keyof IComponentsRegistry]?: IComponentsRegistry[K];
};
