import {
  boxShadowProps,
  innerShadowProps,
  colorMatrixProps,
  displacementEffectProps,
  lightEffectProps,
  linearGradientProps,
  radialGradientProps,
  neuMorphProps,
  glassMorphProps,
  SVGFiltersParams
} from '../../types/filters';

import { boxShadow } from './filters/basic/boxShadow.js';
import { innerShadow } from './filters/basic/innerShadow.js';
import { blur } from './filters/basic/blur.js';
import { glow } from './filters/basic/glow.js';

import { linearGradient } from './filters/intermediate/linearGradient.js';
import { radialGradient } from './filters/intermediate/radialGradient.js';
import { lightEffect } from './filters/intermediate/lightEffect.js';
import { displacementEffect } from './filters/intermediate/displacementEffect.js';
import { colorMatrixTransformation } from './filters/intermediate/colorMatrixTrabsformstion.js';

import { neuMorph } from './filters/morphism/newMorphEffect.js';
import { glassMorph } from './filters/morphism/glassMorphEffect.js';
import { cwarn } from '../helpers/helpers.js';

interface svgFilterType {
  id: string;
  filter: SVGElement;
  filterComp: Record<string, SVGElement>;
}

export class Filter {
  #filter!: SVGElement;
  #filterComp!: Record<string, SVGElement>;

  #applyFilter(el: SVGElement, id: string) {
    const pt = el.ownerSVGElement as SVGSVGElement | null;
    if (!pt) return; // safety check: el not inside an <svg>

    // assume <defs> already exists
    const defs = pt.querySelector('defs') as SVGDefsElement | null;
    if (!defs) {
      cwarn('No <defs> element found in SVG — cannot append filter.');
      return;
    }

    defs.appendChild(this.#filter);

    ((id.startsWith('linearGradient') || id.startsWith('radialGradient')) &&
      el.setAttribute('fill', `url(#${id})`)) ||
      el.setAttribute('filter', `url(#${id})`);
  }

  public blur(el: SVGElement, blurStrength: number) {
    const { id, filter, filterComp } = blur(blurStrength) as svgFilterType;

    this.#filter = filter;
    this.#filterComp = filterComp;

    id && this.#applyFilter(el, id);
  }

  public glow(el: SVGElement, bright: number) {
    const { id, filter, filterComp } = glow(bright) as svgFilterType;

    this.#filter = filter;
    this.#filterComp = filterComp;

    id && this.#applyFilter(el, id);
  }

  public boxShadow(el: SVGElement, props: boxShadowProps) {
    const { id, filter, filterComp } = boxShadow(props) as svgFilterType;

    this.#filter = filter;
    this.#filterComp = filterComp;

    id && this.#applyFilter(el, id);
  }

  public innerShadow(el: SVGElement, props: innerShadowProps) {
    const { id, filter, filterComp } = innerShadow(props) as svgFilterType;

    this.#filter = filter;
    this.#filterComp = filterComp;

    id && this.#applyFilter(el, id);
  }

  public linearGradient(
    el: SVGElement,
    props: linearGradientProps = { direction: 'LR', stops: [] }
  ) {
    const { id, filter, filterComp } = linearGradient(props) as svgFilterType;

    console.log(id, filter, filterComp);
    this.#filter = filter;
    this.#filterComp = filterComp;

    id && this.#applyFilter(el, id);
  }

  public radialGradient(
    el: SVGElement,
    props: radialGradientProps = {
      direction: 'CENTER',
      stops: []
    }
  ) {
    const { id, filter, filterComp } = radialGradient(props) as svgFilterType;
    console.log(id, filter, filterComp);
    this.#filter = filter;
    this.#filterComp = filterComp;

    id && this.#applyFilter(el, id);
  }

  public lightEffect(
    el: SVGElement,
    props: lightEffectProps = {
      lightingColor: 'red',
      surfaceScale: 1,
      intensityOfLight: 1,
      horizontalAngleOfLight: 45,
      verticalAngleOfLight: 45
    }
  ) {
    const { id, filter, filterComp } = lightEffect(props) as svgFilterType;

    this.#filter = filter;
    this.#filterComp = filterComp;

    id && this.#applyFilter(el, id);
  }

  public displacementEffect(
    el: SVGElement,
    props: displacementEffectProps = {
      patternStyle: 'turbulence',
      waveFrequency: 0.6,
      detailLevel: 3,
      distortionAmount: 5,
      distortDirectionX: 'B',
      distortDirectionY: 'G'
    }
  ) {
    const { id, filter, filterComp } = displacementEffect(
      props
    ) as svgFilterType;

    this.#filter = filter;
    this.#filterComp = filterComp;

    id && this.#applyFilter(el, id);
  }

  public colorMatrixTransformation(
    el: SVGElement,
    props: colorMatrixProps = {
      type: 'saturate',
      values: 1,
      inSource: 'SourceGraphic'
    }
  ) {
    const p = props as colorMatrixProps & SVGFiltersParams;
    p.filter ??= this.#filter;
    p.filterComp ??= this.#filterComp;
    const id = colorMatrixTransformation(p);
    if (id != '') this.#applyFilter(el, id);
  }

  public neuMorph(
    el: SVGElement,
    props: neuMorphProps = {
      backgroundColor: '#e6eef6',
      outerShadowColor: '#b8c9db',
      highlightColor: '#ffffff',
      innerShadowColor: '#000000',

      outerBlur: 10,
      outerOffsetX: 8,
      outerOffsetY: 8,
      outerShadowOpacity: 0.85,

      highlightBlur: 6,
      highlightOffsetX: -6,
      highlightOffsetY: -6,
      highlightOpacity: 0.9,

      innerBlur: 6,
      innerOffsetX: 4,
      innerOffsetY: 4,
      innerShadowOpacity: 0.12
    }
  ) {
    // SVG Specific code

    const parent = el.ownerSVGElement;
    parent?.tagName === 'svg' &&
      (parent.style.background =
        props.backgroundColor! + ' none repeat scroll 0% 0%');

    const { id, filter, filterComp } = neuMorph(props) as svgFilterType;

    this.#filter = filter;
    this.#filterComp = filterComp;

    console.log(id, filter);
    id && this.#applyFilter(el, id);
  }

  public glassMorph(
    el: SVGElement,
    props: glassMorphProps = {
      blurAmount: 10,
      frostOpacity: 0.05,
      edgeBlur: 1.2,
      edgeHighlightOpacity: 0.35
    }
  ) {
    const { id, filter, filterComp } = glassMorph(props) as svgFilterType;

    this.#filter = filter;
    this.#filterComp = filterComp;

    console.log(id, filter);
    id && this.#applyFilter(el, id);
  }
}
