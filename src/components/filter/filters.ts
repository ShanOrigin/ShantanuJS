import type {
  IFilter,
  FilterRecord,
  IGlowFilter,
  IShadowFilter,
  IBlurFilter,
  IContrastFilter,
  ISaturateFilter,
  IGrayscale,
  IHueRotate
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

  blur(id: string, props: IBlurFilter): void {
    this.#preChecks(id, 'blur');
    this.#filters.set(id, {
      status: 'pending',
      type: 'blur',
      props
    });
  }

  contrast(id: string, props: IContrastFilter): void {
    this.#preChecks(id, 'contrast');
    this.#filters.set(id, {
      status: 'pending',
      type: 'contrast',
      props
    });
  }

  saturate(id: string, props: ISaturateFilter): void {
    this.#preChecks(id, 'saturate');
    this.#filters.set(id, {
      status: 'pending',
      type: 'saturate',
      props
    });
  }

  grayscale(id: string, props: IGrayscale): void {
    this.#preChecks(id, 'grayscale');
    this.#filters.set(id, {
      status: 'pending',
      type: 'grayscale',
      props
    });
  }

  hueRotate(id: string, props: IHueRotate): void {
    this.#preChecks(id, 'hueRotate');
    this.#filters.set(id, {
      status: 'pending',
      type: 'hueRotate',
      props
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
  glow(id: string, props: IGlowFilter): void {
    this.#preChecks(id, 'glow');
    this.#filters.set(id, {
      status: 'pending',
      type: 'glow',
      props
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
  shadow(id: string, props: IShadowFilter): void {
    this.#preChecks(id, ' shadow');
    this.#filters.set(id, {
      status: 'pending',
      type: 'shadow',
      props
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
  public hasFilter(id?: string): boolean {
    return !id ? this.#filters.size > 0 : this.#filters.has(id);
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
