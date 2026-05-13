import {
  boxShadowProps,
  linearGradientProps,
  radialGradientProps
} from '../../../types/filters';

import { svgBoxShadow } from './svg/boxShadow.js';

import { svgBlur } from './svg/blur.js';
import { svgGlow } from './svg/glow.js';

import { svgLinearGradient } from './svg/linearGradient.js';
import { svgRadialGradient } from './svg/radialGradient.js';

import { Warn } from '../../helpers/helpers.js';
import { addTo, SVG_CONTEXT } from '../../../core/provider/svgSpecific.js';
import { type GraphicsModel } from '../../../core/provider/graphics.js';
import { type IGraphicalElementProperties } from '../../../properties/provider/shapeProperties.js';
import { DEV_INTERNAL_ACCESS } from '../../internals/accessKeys.js';

interface svgFilterType {
  id: string;
  filter: SVGElement;
}

type ResourceRecord = {
  type: 'filter' | 'gradient';
  prev?: {
    filter?: string | null;
    fill?: string | null;
    stroke?: string | null;
  };
};

/**
 * Context-aware filter manager responsible for creating, attaching,
 * and removing visual effects tied to a GraphicsModel instance.
 *
 * Maintains an internal registry to track:
 * - resource type (filter / gradient)
 * - previous rendering state for safe restoration
 *
 * Ensures deterministic creation, application, and deletion
 * without leaking renderer responsibilities.
 */
export class Filter {
  #shape!: GraphicsModel<keyof IGraphicalElementProperties>;

  // Central registry
  #registry = new Map<string, ResourceRecord>();

  constructor(shape: GraphicsModel<keyof IGraphicalElementProperties>) {
    this.#shape = shape;
  }

  /**
   * Appends definition into SVG <defs>.
   */
  #addFilterToDefs(filter: SVGElement) {
    if (this.#shape.geometry?.context === SVG_CONTEXT) {
      const pt = this.#shape.getIFig(DEV_INTERNAL_ACCESS)
        .ownerSVGElement as SVGSVGElement | null;

      if (!pt) return;

      const defs = pt.querySelector('defs') as SVGDefsElement | null;
      if (!defs) {
        Warn('No <defs> element found in SVG — cannot append filter.');
        return;
      }

      addTo(defs, filter);
    }
  }

  /**
   * Capture previous state before applying new effect.
   */
  #captureState(): {
    filter?: string | null;
    fill?: string | null;
    stroke?: string | null;
  } {
    const el = this.#shape;

    return {
      filter: el.style?.filter,
      fill: el.style?.fill,
      stroke: el.style?.stroke
    };
  }

  /**
   * Applies Gaussian blur filter.
   */
  public blur(blurStrength: number): string {
    let id = '';

    if (this.#shape.geometry?.context === SVG_CONTEXT) {
      const prev = this.#captureState();

      const result = svgBlur(blurStrength) as svgFilterType;
      id = result.id;

      this.#addFilterToDefs(result.filter);

      this.#registry.set(id, {
        type: 'filter',
        prev
      });
    }

    return id;
  }

  /**
   * Applies glow effect.
   */
  public glow(bright: number): string {
    let id = '';

    if (this.#shape.geometry?.context === SVG_CONTEXT) {
      const prev = this.#captureState();

      const result = svgGlow(bright) as svgFilterType;
      id = result.id;

      this.#addFilterToDefs(result.filter);

      this.#registry.set(id, {
        type: 'filter',
        prev
      });
    }

    return id;
  }

  /**
   * Applies box shadow.
   */
  public boxShadow(props: boxShadowProps): string {
    let id = '';

    if (this.#shape.geometry?.context === SVG_CONTEXT) {
      const prev = this.#captureState();

      const result = svgBoxShadow(props) as svgFilterType;
      id = result.id;

      this.#addFilterToDefs(result.filter);

      this.#registry.set(id, {
        type: 'filter',
        prev
      });
    }

    return id;
  }

  /**
   * Creates linear gradient.
   */
  public linearGradient(
    props: linearGradientProps = { direction: 'LR', stops: [] }
  ): string {
    let id = '';

    if (this.#shape.geometry?.context === SVG_CONTEXT) {
      const prev = this.#captureState();

      const result = svgLinearGradient(props) as svgFilterType;
      id = result.id;

      this.#addFilterToDefs(result.filter);

      this.#registry.set(id, {
        type: 'gradient',
        prev
      });
    }

    return id;
  }

  /**
   * Creates radial gradient.
   */
  public radialGradient(
    props: radialGradientProps = { direction: 'CENTER', stops: [] }
  ): string {
    let id = '';

    if (this.#shape.geometry?.context === SVG_CONTEXT) {
      const prev = this.#captureState();

      const result = svgRadialGradient(props) as svgFilterType;
      id = result.id;

      this.#addFilterToDefs(result.filter);

      this.#registry.set(id, {
        type: 'gradient',
        prev
      });
    }

    return id;
  }

  /**
   * Deletes filter/gradient and restores previous state.
   *
   * @param id - Resource id.
   * @returns Restored properties.
   */
  public deleteFilter(id: string): ResourceRecord['prev'] {
    const record = this.#registry.get(id);
    if (!record) return {};

    const result = record.prev;

    if (this.#shape.geometry?.context === SVG_CONTEXT) {
      const el = this.#shape.getIFig(DEV_INTERNAL_ACCESS);
      const svg = el.ownerSVGElement as SVGSVGElement | null;

      if (svg) {
        const defs = svg.querySelector('defs');
        const target = defs?.querySelector(`#${id}`);
        target && defs!.removeChild(target);
      }
    }

    this.#registry.delete(id);

    return result;
  }
}
