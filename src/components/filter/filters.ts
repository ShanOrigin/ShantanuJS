import type {
  IFilter,
  FilterRecord,
  IBrightnessFilter,
  IGlowFilter,
  IShadowFilter,
  ILinearGradientFilter,
  IRadialGradientFilter
} from '../../models/interfaces/filters';

import { DuplicateFilterError } from '../../errors/index.js';

/**
 * Manages the collection of graphical filters applied to a renderable object.
 *
 * Each filter is uniquely identified by a user-provided identifier, allowing it
 * to be added, replaced, queried, or removed independently without affecting
 * other filters.
 *
 * Filter definitions are stored internally in insertion order using a
 * {@link Map}. This preserves the order in which filters were added, which may
 * be significant for rendering backends where filter evaluation is sequential.
 *
 * Every filter method automatically merges user-provided values with its
 * corresponding default values before storing the final configuration.
 *
 * This class is backend-independent and only represents filter definitions.
 * Individual rendering systems (SVG, Canvas, WebGL, etc.) are responsible for
 * translating these definitions into backend-specific implementations.
 *
 * @implements {IFilter}
 */
export class Filters implements IFilter {
  /**
   * Internal collection of filter definitions.
   *
   * The map key represents the unique filter identifier supplied by the user,
   * while the value contains the complete filter configuration.
   *
   * Insertion order is preserved.
   */
  #filters = new Map<string, FilterRecord>();

  #preChecks(id: string, src: string) {
    if (this.hasFilter(id)) {
      throw new DuplicateFilterError(
        id,
        String(this.#filters.get(id)?.type),
        src
      );
    }
  }
  /**
   * Creates or replaces a brightness filter.
   *
   * If a filter with the same identifier already exists, it is replaced by
   * the newly supplied configuration.
   *
   * Default values:
   * - amount = 1
   *
   * @param id Unique identifier for the filter.
   * @param props Brightness filter configuration.
   */
  brightness(id: string, props: IBrightnessFilter = {}): void {
    this.#preChecks(id, 'brightness');

    this.#filters.set(id, {
      status: 'pending',
      type: 'brightness',
      props: {
        amount: 1,
        ...props
      }
    });
  }

  /**
   * Creates or replaces a glow filter.
   *
   * Default values:
   * - color = "#000000"
   * - blur = 8
   * - strength = 1
   * - opacity = 1
   *
   * @param id Unique identifier for the filter.
   * @param props Glow filter configuration.
   */
  glow(id: string, props: IGlowFilter = {}): void {
    this.#preChecks(id, 'glow');
    this.#filters.set(id, {
      status: 'pending',
      type: 'glow',
      props: {
        color: '#000000',
        blur: 8,
        strength: 1,
        opacity: 1,
        ...props
      }
    });
  }

  /**
   * Creates or replaces a shadow filter.
   *
   * Default values:
   * - offsetX = 0
   * - offsetY = 4
   * - blur = 6
   * - color = "#000000"
   * - opacity = 0.5
   *
   * @param id Unique identifier for the filter.
   * @param props Shadow filter configuration.
   */
  shadow(id: string, props: IShadowFilter = {}): void {
    this.#preChecks(id, ' shadow');
    this.#filters.set(id, {
      status: 'pending',
      type: 'shadow',
      props: {
        offsetX: 0,
        offsetY: 4,
        blur: 6,
        color: '#000000',
        opacity: 0.5,
        ...props
      }
    });
  }
  /**
   * Creates or replaces a linear gradient definition.
   *
   * Default values:
   * - x1 = 0
   * - y1 = 0
   * - x2 = 1
   * - y2 = 0
   *
   * Gradient stops must be supplied by the caller.
   *
   * @param id Unique identifier for the filter.
   * @param props Linear gradient configuration.
   */
  linearGradient(id: string, props: ILinearGradientFilter): void {
    this.#preChecks(id, 'linearGradient');

    this.#filters.set(id, {
      status: 'pending',
      type: 'linearGradient',
      props: {
        x1: 0,
        y1: 0,
        x2: 1,
        y2: 0,
        ...props
      }
    });
  }
  /**
   * Creates or replaces a radial gradient definition.
   *
   * Default values:
   * - cx = 0.5
   * - cy = 0.5
   * - r = 0.5
   * - fx = cx
   * - fy = cy
   *
   * Gradient stops must be supplied by the caller.
   *
   * @param id Unique identifier for the filter.
   * @param props Radial gradient configuration.
   */
  radialGradient(id: string, props: IRadialGradientFilter): void {
    this.#preChecks(id, 'radialGradient');
    this.#filters.set(id, {
      status: 'pending',
      type: 'radialGradient',
      props: {
        cx: 0.5,
        cy: 0.5,
        r: 0.5,
        fx: props.fx ?? props.cx ?? 0.5,
        fy: props.fy ?? props.cy ?? 0.5,
        ...props
      }
    });
  }

  /**
   * Removes a filter from the collection.
   *
   * If no filter exists with the supplied identifier, this method performs
   * no operation.
   *
   * @param id Identifier of the filter to remove.
   */
  public removeFilter(id: string): void {
    if (!this.hasFilter(id)) return;

    this.#filters.delete(id);
  }

  /**
   * Removes every registered filter.
   *
   * After calling this method, the collection becomes empty.
   */
  public clearFilters(): void {
    this.#filters.clear();
  }

  /**
   * Determines whether a filter exists.
   *
   * @param id Identifier of the filter.
   *
   * @returns `true` if a filter with the supplied identifier exists;
   * otherwise `false`.
   */
  public hasFilter(id: string): boolean {
    return this.#filters.has(id);
  }
  /**
   * Returns the complete collection of registered filters.
   *
   * The returned map preserves insertion order.
   *
   * @returns A read-only view of all registered filters.
   */
  public getAllFilters(): ReadonlyMap<string, FilterRecord> {
    return this.#filters;
  }
}
