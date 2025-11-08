import { createSVGElement } from '../dom/dom.js';
import {
  NonGraphicalElementProperties,
  INonGraphicalElementProperties
} from '../../properties/provider/shapeProperties.js';

import {
  boxShadowProps,
  innerShadowProps,
  colorMatrixProps,
  displacementEffectProps,
  lightEffectProps,
  linearGradientProps,
  GradientDirection,
  radialGradientProps,
  RadialPosition,
  neoMorphProps,
  glassMorphProps
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

import { neoMorph } from './filters/morphism/newMorphEffect.js';
import { glassMorph } from './filters/morphism/glassMorphEffect.js';

export class Filter {
  #filter!: SVGElement;
  #filterComp!: Record<string, SVGElement>;

  public boxShadow(props: boxShadowProps) {
    props['filter'] ??= this.#filter;
    props['filterComp'] ??= this.#filterComp;
    return boxShadow(props);
  }

  public innerShadow(props: innerShadowProps) {
    props['filter'] ??= this.#filter;
    props['filterComp'] ??= this.#filterComp;
    return innerShadow(props);
  }

  public blur(blurStrenght: number) {
    const props = {} as { blur: number };
    props['blur'] = blurStrenght;
    props['filter'] ??= this.#filter;
    props['filterComp'] ??= this.#filterComp;

    return blur(props);
  }

  public glow(bright: number) {
    const props = {} as { bright: number };
    props['bright'] = bright;
    props['filter'] ??= this.#filter;
    props['filterComp'] ??= this.#filterComp;

    return glow(props);
  }

  public linearGradient(
    props: linearGradientProps = {
      direction: 'LR',
      stops: []
    }
  ) {
    props['filter'] ??= this.#filter;
    props['filterComp'] ??= this.#filterComp;
    return linearGradient(props);
  }

  public radialGradient(
    props: radialGradientProps = {
      position: 'CENTER',
      radius: '50%',
      stops: []
    }
  ) {
    props['filter'] ??= this.#filter;
    props['filterComp'] ??= this.#filterComp;
    return radialGradient(props);
  }

  public lightEffect(
    props: lightEffectProps = {
      lightingColor: 'red',
      surfaceScale: 1,
      intensityOfLight: 1,
      horizontalAngleOfLight: 45,
      verticalAngleOfLight: 45
    }
  ) {
    props['filter'] ??= this.#filter;
    props['filterComp'] ??= this.#filterComp;
    return lightEffect(props);
  }

  public displacementEffect(
    props: displacementEffectProps = {
      patternStyle: 'turbulence',
      waveFrequency: 0.6,
      detailLevel: 3,
      distortionAmount: 5,
      distortDirectionX: 'B',
      distortDirectionY: 'G'
    }
  ) {
    props['filter'] ??= this.#filter;
    props['filterComp'] ??= this.#filterComp;
    return displacementEffect(props);
  }

  public colorMatrixTransformation(
    props: colorMatrixProps = {
      type: 'saturate',
      values: 1,
      inSource: 'SourceGraphic'
    }
  ) {
    props['filter'] ??= this.#filter;
    props['filterComp'] ??= this.#filterComp;
    return colorMatrixTransformation(props);
  }

  public neoMorph(
    props: neoMorphProps = {
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
    props['filter'] ??= this.#filter;
    props['filterComp'] ??= this.#filterComp;
    return neoMorph(props);
  }

  public glassMorph(
    props: glassMorphProps = {
      blurAmount: 10, // how strong the background blur is
      frostOpacity: 0.05, // how much white frost overlays the glass
      edgeBlur: 1.2, // how soft the inner highlight edge is
      edgeHighlightOpacity: 0.35 // brightness of the inner edge highlight
    }
  ) {
    props['filter'] ??= this.#filter;
    props['filterComp'] ??= this.#filterComp;
    return glassMorph(props);
  }
}

// old filter class

export class fFilter {
  #filter!: SVGElement;
  #filterComp!: Record<string, SVGElement>;

  // Cleaner attribute updater
  #propertyUpdate(el: SVGElement, props: Record<string, string | number>) {
    for (const [name, value] of Object.entries(props)) {
      el.setAttribute(name, String(value));
    }
  }

  // 🔹 Reusable children appender
  #appendChildren(parent: SVGElement, ...children: SVGElement[]) {
    for (const child of children) {
      parent.appendChild(child);
    }
  }

  public boxShadow({
    blur,
    offsetX,
    offsetY,
    color,
    opacity = 0.5
  }: boxShadowProps) {
    /*
       <filter id="boxShadow" height="200%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
        <feOffset dx="4" dy="4" result="offsetblur" />
        <feFlood flood-color="black" flood-opacity="0.5" />
        <feComposite in2="offsetblur" operator="in" />
        <feMerge>
          <feMergeNode />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
**/

    this.#filter = createSVGElement('filter');
    this.#filter.setAttribute('id', 'boxShadow');
    // Gaussian blur
    const feGaussianBlur = createSVGElement('feGaussianBlur');
    this.#propertyUpdate(feGaussianBlur, {
      in: 'SourceAlpha',
      stdDeviation: blur
    });

    // Offset
    const feOffset = createSVGElement('feOffset');
    this.#propertyUpdate(feOffset, {
      dx: offsetX,
      dy: offsetY,
      result: 'offsetblur'
    });

    // Flood
    const feFlood = createSVGElement('feFlood');
    this.#propertyUpdate(feFlood, {
      'flood-color': color,
      'flood-opacity': opacity
    });

    // Composite
    const feComposite = createSVGElement('feComposite');
    this.#propertyUpdate(feComposite, { in2: 'offsetblur', operator: 'in' });

    // Merge
    const feMerge = createSVGElement('feMerge');
    const feMergeNode0 = createSVGElement('feMergeNode');
    const feMergeNode1 = createSVGElement('feMergeNode');
    feMergeNode1.setAttribute('in', 'SourceGraphic');

    // 🔹 Append chain using helper
    this.#appendChildren(feMerge, feMergeNode0, feMergeNode1);
    this.#appendChildren(
      this.#filter,
      feGaussianBlur,
      feOffset,
      feFlood,
      feComposite,
      feMerge
    );

    this.#filterComp = {
      feGaussianBlur,
      feOffset,
      feFlood,
      feComposite,
      feMerge,
      feMergeNode0,
      feMergeNode1
    };

    return 'boxShadow';
  }

  public innerShadow({ blur, offsetX, offsetY }: innerShadowProps) {
    /*
      <filter id="innerShadow">
        <feOffset dx="3" dy="3" />
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="arithmetic" k2="-1" k3="1" />
      </filter>

		 */
    this.#filter = createSVGElement('filter');
    this.#filter.setAttribute('id', 'innerShadow');

    // Gaussian blur
    const feGaussianBlur = createSVGElement('feGaussianBlur');
    this.#propertyUpdate(feGaussianBlur, {
      result: 'blur',
      stdDeviation: blur
    });

    // Offset
    const feOffset = createSVGElement('feOffset');
    this.#propertyUpdate(feOffset, {
      dx: offsetX,
      dy: offsetY
    });

    // Composite
    const feComposite = createSVGElement('feComposite');
    this.#propertyUpdate(feComposite, {
      in: 'SourceGraphic',
      in2: 'blur',
      operator: 'arithmetic',
      k2: '-1',
      k3: '1'
    });

    this.#appendChildren(this.#filter, feOffset, feGaussianBlur, feComposite);

    this.#filterComp = {
      feOffset,
      feGaussianBlur,
      feComposite
    };

    return 'innerShadow';
  }

  public blur(blur: number) {
    /*
       <filter id="blur">
        <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" />
      </filter>
 */

    this.#filter = createSVGElement('filter');
    this.#filter.setAttribute('id', 'blur');

    // Gaussian blur
    const feGaussianBlur = createSVGElement('feGaussianBlur');
    this.#propertyUpdate(feGaussianBlur, {
      in: 'SourceGraphic',
      stdDeviation: blur
    });
    this.#filter.appendChild(feGaussianBlur);

    this.#filterComp = { feGaussianBlur };
    return 'blur';
  }

  public glow(bright: number) {
    /*
		       <filter id="glow">
        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

		 */

    this.#filter = createSVGElement('filter');
    this.#filter.setAttribute('id', 'glow');

    // Gaussian blur
    const feGaussianBlur = createSVGElement('feGaussianBlur');
    this.#propertyUpdate(feGaussianBlur, {
      in: 'SourceGraphic',
      stdDeviation: bright
    });

    // Merge
    const feMerge = createSVGElement('feMerge');
    const feMergeNode0 = createSVGElement('feMergeNode');
    const feMergeNode1 = createSVGElement('feMergeNode');
    feMergeNode0.setAttribute('in', 'coloredBlur');
    feMergeNode1.setAttribute('in', 'SourceGraphic');

    // 🔹 Append chain using helper
    this.#appendChildren(feMerge, feMergeNode0, feMergeNode1);
    this.#appendChildren(this.#filter, feGaussianBlur, feMerge);

    this.#filterComp = {
      feGaussianBlur,
      feMerge,
      feMergeNode0,
      feMergeNode1
    };
    return 'glow';
  }

  public colorMatrixTransformation({
    type,
    values,
    inSource = 'SourceGraphic'
  }: colorMatrixProps) {
    this.#filter = createSVGElement('filter');
    this.#filter.setAttribute('id', 'colorMatrix');

    const feColorMatrix = createSVGElement('feColorMatrix');
    this.#propertyUpdate(feColorMatrix, {
      type,
      in: inSource,
      result: 'colorMatrixResult'
    });

    // Handle values
    if (type === 'matrix' && Array.isArray(values)) {
      feColorMatrix.setAttribute('values', values.join(' '));
    } else if (
      (type === 'saturate' || type === 'hueRotate') &&
      typeof values === 'number'
    ) {
      feColorMatrix.setAttribute('values', String(values));
    }

    this.#appendChildren(this.#filter, feColorMatrix);

    this.#filterComp = { feColorMatrix };
    return 'colorMatrix';
  }

  public displacementEffect({
    patternStyle = 'turbulence',
    waveFrequency = 0.6,
    detailLevel = 3,
    randomSeed,
    distortionAmount = 5,
    distortDirectionX = 'B',
    distortDirectionY = 'G'
  }: displacementEffectProps = {}) {
    this.#filter = createSVGElement('filter');
    this.#filter.setAttribute('id', 'displacementEffect');

    // feTurbulence (always outputs to "turb")
    const feTurbulence = createSVGElement('feTurbulence');
    this.#propertyUpdate(feTurbulence, {
      type: patternStyle,
      baseFrequency: waveFrequency,
      numOctaves: detailLevel,
      ...(randomSeed !== undefined ? { seed: randomSeed } : {}),
      result: 'turb'
    });

    // feDisplacementMap (always takes "SourceGraphic" and "turb")
    const feDisplacementMap = createSVGElement('feDisplacementMap');
    this.#propertyUpdate(feDisplacementMap, {
      in: 'SourceGraphic',
      in2: 'turb',
      scale: distortionAmount,
      xChannelSelector: distortDirectionX,
      yChannelSelector: distortDirectionY
    });

    // Append
    this.#appendChildren(this.#filter, feTurbulence, feDisplacementMap);

    this.#filterComp = {
      feTurbulence,
      feDisplacementMap
    };

    return 'displacementEffect';
  }

  public lightEffect({
    lightingColor = 'red',
    surfaceScale = 1,
    intensityOfLight = 1,
    horizontalAngleOfLight = 45,
    verticalAngleOfLight = 45
  }: lightEffectProps = {}) {
    this.#filter = createSVGElement('filter');
    this.#filter.setAttribute('id', 'lightEffect');

    // feDiffuseLighting
    const feDiffuseLighting = createSVGElement('feDiffuseLighting');
    this.#propertyUpdate(feDiffuseLighting, {
      in: 'SourceGraphic',
      'lighting-color': lightingColor,
      surfaceScale,
      diffuseConstant: intensityOfLight
    });

    // feDistantLight
    const feDistantLight = createSVGElement('feDistantLight');
    this.#propertyUpdate(feDistantLight, {
      azimuth: horizontalAngleOfLight,
      elevation: verticalAngleOfLight
    });

    // Append
    this.#appendChildren(feDiffuseLighting, feDistantLight);
    this.#appendChildren(this.#filter, feDiffuseLighting);

    this.#filterComp = {
      feDiffuseLighting,
      feDistantLight
    };

    return 'lightEffect';
  }

  public linearGradient({
    direction = 'LR',
    stops = []
  }: linearGradientProps = {}) {
    const directions: Record<
      GradientDirection,
      [string, string, string, string]
    > = {
      LR: ['0%', '0%', '100%', '0%'],
      RL: ['100%', '0%', '0%', '0%'],
      TB: ['0%', '0%', '0%', '100%'],
      BT: ['0%', '100%', '0%', '0%'],
      TLBR: ['0%', '0%', '100%', '100%'],
      BRTL: ['100%', '100%', '0%', '0%'],
      TRBL: ['100%', '0%', '0%', '100%'],
      BLTR: ['0%', '100%', '100%', '0%']
    };

    const [x1, y1, x2, y2] = directions[direction];
    const id = `linearGradient-${direction}`;

    this.#filter = createSVGElement('linearGradient');
    this.#propertyUpdate(this.#filter, { id, x1, y1, x2, y2 });

    stops.forEach((s, i) => {
      const stop = createSVGElement('stop');
      this.#propertyUpdate(stop, {
        'stop-color': s.color,
        offset: typeof s.offset === 'number' ? `${s.offset}%` : s.offset
      });
      this.#appendChildren(this.#filter, stop);
      this.#filterComp[`stop${i}`] = stop;
    });

    return id;
  }

  public radialGradient({
    position = 'CENTER',
    radius = '50%',
    focalX,
    focalY,
    stops = []
  }: radialGradientProps = {}) {
    const positions: Record<RadialPosition, [string, string]> = {
      CENTER: ['50%', '50%'],
      TL: ['0%', '0%'],
      TR: ['100%', '0%'],
      BL: ['0%', '100%'],
      BR: ['100%', '100%']
    };

    const [cx, cy] = positions[position];
    const id = `radialGradient-${position}`;

    this.#filter = createSVGElement('radialGradient');
    this.#propertyUpdate(this.#filter, {
      id,
      cx,
      cy,
      r: typeof radius === 'number' ? `${radius}%` : radius,
      ...(focalX !== undefined ? { fx: String(focalX) } : {}),
      ...(focalY !== undefined ? { fy: String(focalY) } : {})
    });

    stops.forEach((s, i) => {
      const stop = createSVGElement('stop');
      this.#propertyUpdate(stop, {
        'stop-color': s.color,
        offset: typeof s.offset === 'number' ? `${s.offset}%` : s.offset
      });
      this.#appendChildren(this.#filter, stop);
      this.#filterComp[`stop${i}`] = stop;
    });

    return id;
  }

  #eoMorph() {
    /*
	
<svg width="520" height="360" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Neumorphism single-filter demo">
  <defs>
    <!-- Combined Neumorphism filter: produces outer shadow, top-left highlight, AND inner (inset) shadow -->
  


<filter id="neuCombined"  filterUnits="userSpaceOnUse">

      <!-- Outer shadow (soft dark, lower-right) -->
      <feGaussianBlur in="SourceAlpha" stdDeviation="10" result="outerBlur"/>
      <feOffset in="outerBlur" dx="8" dy="8" result="outerOffset"/>
      <feFlood flood-color="#b8c9db" flood-opacity="0.85" result="outerFlood"/>
      <feComposite in="outerFlood" in2="outerOffset" operator="in" result="outerShadow"/>

      <!-- Top-left highlight (soft white) -->
      <feGaussianBlur in="SourceAlpha" stdDeviation="6" result="hlBlur"/>
      <feOffset in="hlBlur" dx="-6" dy="-6" result="hlOffset"/>
      <feFlood flood-color="#ffffff" flood-opacity="0.9" result="hlFlood"/>
      <feComposite in="hlFlood" in2="hlOffset" operator="in" result="highlight"/>

      <!-- Inner (inset) shadow -->
      <feGaussianBlur in="SourceAlpha" stdDeviation="6" result="inBlur"/>
      <feOffset in="inBlur" dx="4" dy="4" result="inOffset"/>
      <!-- arithmetic composite to produce the inner band: (inOffset * k2) + (SourceAlpha * k3) -->
      <feComposite in="inOffset" in2="SourceAlpha" operator="arithmetic"
                   k1="0" k2="-1" k3="1" k4="0" result="inMask"/>
      <feFlood flood-color="#000000" flood-opacity="0.12" result="inFlood"/>
      <feComposite in="inFlood" in2="inMask" operator="in" result="innerShadow"/>

      <!-- Merge: outer shadow + highlight behind the graphic, then the graphic, then inner shadow on top -->
      <feMerge>
        <feMergeNode in="outerShadow"/>
        <feMergeNode in="highlight"/>
        <feMergeNode in="SourceGraphic"/>
        <feMergeNode in="innerShadow"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Demo: single rect uses the combined filter (no duplicate shapes) -->
  <rect x="60" y="40" width="400" height="260" rx="20" ry="20"
        fill="#e6eef6"
        stroke="#e6eef6"
        filter="url(#neuCombined)" />

  <!-- A circle also using the same single filter (shows reusability) -->
  <circle cx="140" cy="160" r="48" fill="#f6fbff" filter="url(#neuCombined)"/>

  <!-- Content on top -->
  <text x="220" y="140" font-family="sans-serif" font-size="20" fill="#27354a" font-weight="700">Neumorphic Card</text>
  <text x="220" y="170" font-family="sans-serif" font-size="13" fill="#495b78">single-filter outer + inner shadows</text>
</svg>

	 */
  }

  public neoMorph({
    backgroundColor = '#e6eef6',
    outerShadowColor = '#b8c9db',
    highlightColor = '#ffffff',
    innerShadowColor = '#000000',

    outerBlur = 10,
    outerOffsetX = 8,
    outerOffsetY = 8,
    outerShadowOpacity = 0.85,

    highlightBlur = 6,
    highlightOffsetX = -6,
    highlightOffsetY = -6,
    highlightOpacity = 0.9,

    innerBlur = 6,
    innerOffsetX = 4,
    innerOffsetY = 4,
    innerShadowOpacity = 0.12
  }: neoMorphProps = {}) {
    this.#filter = createSVGElement('filter');
    this.#propertyUpdate(this.#filter, {
      id: 'neoMorph',
      filterUnits: 'userSpaceOnUse'
    });

    // --- Outer shadow ---
    const outerBlurEl = createSVGElement('feGaussianBlur');
    this.#propertyUpdate(outerBlurEl, {
      in: 'SourceAlpha',
      stdDeviation: outerBlur,
      result: 'outerBlur'
    });

    const outerOffsetEl = createSVGElement('feOffset');
    this.#propertyUpdate(outerOffsetEl, {
      in: 'outerBlur',
      dx: outerOffsetX,
      dy: outerOffsetY,
      result: 'outerOffset'
    });

    const outerFloodEl = createSVGElement('feFlood');
    this.#propertyUpdate(outerFloodEl, {
      'flood-color': outerShadowColor,
      'flood-opacity': outerShadowOpacity,
      result: 'outerFlood'
    });

    const outerCompositeEl = createSVGElement('feComposite');
    this.#propertyUpdate(outerCompositeEl, {
      in: 'outerFlood',
      in2: 'outerOffset',
      operator: 'in',
      result: 'outerShadow'
    });

    // --- Highlight (top-left glow) ---
    const hlBlurEl = createSVGElement('feGaussianBlur');
    this.#propertyUpdate(hlBlurEl, {
      in: 'SourceAlpha',
      stdDeviation: highlightBlur,
      result: 'hlBlur'
    });

    const hlOffsetEl = createSVGElement('feOffset');
    this.#propertyUpdate(hlOffsetEl, {
      in: 'hlBlur',
      dx: highlightOffsetX,
      dy: highlightOffsetY,
      result: 'hlOffset'
    });

    const hlFloodEl = createSVGElement('feFlood');
    this.#propertyUpdate(hlFloodEl, {
      'flood-color': highlightColor,
      'flood-opacity': highlightOpacity,
      result: 'hlFlood'
    });

    const hlCompositeEl = createSVGElement('feComposite');
    this.#propertyUpdate(hlCompositeEl, {
      in: 'hlFlood',
      in2: 'hlOffset',
      operator: 'in',
      result: 'highlight'
    });

    // --- Inner shadow ---
    const inBlurEl = createSVGElement('feGaussianBlur');
    this.#propertyUpdate(inBlurEl, {
      in: 'SourceAlpha',
      stdDeviation: innerBlur,
      result: 'inBlur'
    });

    const inOffsetEl = createSVGElement('feOffset');
    this.#propertyUpdate(inOffsetEl, {
      in: 'inBlur',
      dx: innerOffsetX,
      dy: innerOffsetY,
      result: 'inOffset'
    });

    const inMaskEl = createSVGElement('feComposite');
    this.#propertyUpdate(inMaskEl, {
      in: 'inOffset',
      in2: 'SourceAlpha',
      operator: 'arithmetic',
      k1: 0,
      k2: -1,
      k3: 1,
      k4: 0,
      result: 'inMask'
    });

    const inFloodEl = createSVGElement('feFlood');
    this.#propertyUpdate(inFloodEl, {
      'flood-color': innerShadowColor,
      'flood-opacity': innerShadowOpacity,
      result: 'inFlood'
    });

    const innerCompositeEl = createSVGElement('feComposite');
    this.#propertyUpdate(innerCompositeEl, {
      in: 'inFlood',
      in2: 'inMask',
      operator: 'in',
      result: 'innerShadow'
    });

    // --- Merge ---
    const mergeEl = createSVGElement('feMerge');
    const mergeNode1 = createSVGElement('feMergeNode');
    const mergeNode2 = createSVGElement('feMergeNode');
    const mergeNode3 = createSVGElement('feMergeNode');
    const mergeNode4 = createSVGElement('feMergeNode');

    this.#propertyUpdate(mergeNode1, { in: 'outerShadow' });
    this.#propertyUpdate(mergeNode2, { in: 'highlight' });
    this.#propertyUpdate(mergeNode3, { in: 'SourceGraphic' });
    this.#propertyUpdate(mergeNode4, { in: 'innerShadow' });

    this.#appendChildren(
      mergeEl,
      mergeNode1,
      mergeNode2,
      mergeNode3,
      mergeNode4
    );

    // --- Append all ---
    this.#appendChildren(
      this.#filter,
      outerBlurEl,
      outerOffsetEl,
      outerFloodEl,
      outerCompositeEl,
      hlBlurEl,
      hlOffsetEl,
      hlFloodEl,
      hlCompositeEl,
      inBlurEl,
      inOffsetEl,
      inMaskEl,
      inFloodEl,
      innerCompositeEl,
      mergeEl
    );

    this.#filterComp = {
      outerBlurEl,
      outerOffsetEl,
      outerFloodEl,
      outerCompositeEl,
      hlBlurEl,
      hlOffsetEl,
      hlFloodEl,
      hlCompositeEl,
      inBlurEl,
      inOffsetEl,
      inMaskEl,
      inFloodEl,
      innerCompositeEl,
      mergeEl
    };

    return 'neoMorph';
  }

  #lassMorph() {
    /*
	
<svg  width="900" height="420"
     xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">

  <defs>
    <!-- decorative background (no external images) -->
    <linearGradient id="g1" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#1f3b6f"/>
      <stop offset="0.5" stop-color="#6b2f7e"/>
      <stop offset="1" stop-color="#ce5b5b"/>
    </linearGradient>

    <!-- ---------- Glass filter (reusable) ---------- -->
    <!--
      How it works:
      1) blur the BackgroundImage (what's behind the element)
      2) color/adjust that blurred result
      3) mask the blurred result to the element's alpha (SourceAlpha)
      4) add a subtle white tint (semi-transparent) masked to the shape
      5) add a soft inner highlight (edge) for realism
    -->
    <filter id="glassPortal"
        
            filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse">
      <!-- 1) get a blurred copy of whatever is behind the element -->
      <feGaussianBlur in="BackgroundImage" stdDeviation="10" result="bg-blur"/>

      <!-- 2) slightly dim / desaturate or tweak the blurred background if you like -->
      <feColorMatrix in="bg-blur" type="matrix" result="bg-tint"
        values="
          0.96 0    0    0 0
          0    0.96 0    0 0
          0    0    0.97 0 0
          0    0    0    1 0"/>

      <!-- 3) keep blurred area only where the shape exists -->
      <feComposite in="bg-tint" in2="SourceAlpha" operator="in" result="bg-in-shape"/>

      <!-- 4) create a subtle translucent white overlay (the "frost") -->
      <feFlood flood-color="white" flood-opacity="0.05" result="frost"/>
      <feComposite in="frost" in2="SourceAlpha" operator="in" result="frost-in-shape"/>

      <!-- 5) merge blurred background + frost into a single "glass base" -->
      <feMerge result="glass-base">
        <feMergeNode in="bg-in-shape"/>
        <feMergeNode in="frost-in-shape"/>
      </feMerge>

      <!-- 6) soft inner highlight (thin bright edge inside the shape) -->
      <feGaussianBlur in="SourceAlpha" stdDeviation="1.2" result="edge-blur"/>
      <!-- arithmetic to get inner band -->
      <feComposite in="edge-blur" in2="SourceAlpha" operator="arithmetic"
                   k1="0" k2="-1" k3="1" k4="0" result="inner-band" />
      <feFlood flood-color="white" flood-opacity="0.35" result="edge-color" />
      <feComposite in="edge-color" in2="inner-band" operator="in" result="edge-color-in" />

      <!-- 7) final merge: glass base + inner edge -->
      <feMerge>
        <feMergeNode in="glass-base"/>
        <feMergeNode in="edge-color-in"/>
      </feMerge>
    </filter>
    <!-- ---------- end filter ---------- -->
  </defs>

  <!-- Nice background made from gradients and shapes (just for demo) -->
  <rect x="0" y="0" width="900" height="420" fill="url(#g1)"/>
  <g opacity="0.18">
    <circle cx="120" cy="120" r="140" fill="#ffffff"/>
    <circle cx="780" cy="300" r="220" fill="#ffffff"/>
  </g>
  <g transform="translate(60,240)" opacity="0.16">
    <rect x="0" y="-140" width="240" height="80" rx="20" fill="#000" transform="rotate(-20 120 -100)"/>
    <rect x="480" y="-80" width="260" height="80" rx="10" fill="#000" transform="rotate(18 610 -40)"/>
  </g>

  <!-- ---------- Glass element: apply the filter to any shape ---------- -->
  <!-- NOTE: set fill="transparent" or omit fill to let the filter's glass show through -->
  <rect x="280" y="60" width="340" height="240" rx="20" ry="20"
        fill="transparent"
        stroke="white" stroke-opacity="0.22" stroke-width="1.4"
        filter="url(#glassPortal)" />
	 */
  }

  public glassMorph({
    blurAmount = 10, // how strong the background blur is
    frostOpacity = 0.05, // how much white frost overlays the glass
    edgeBlur = 1.2, // how soft the inner highlight edge is
    edgeHighlightOpacity = 0.35 // brightness of the inner edge highlight
  }: glassMorphProps = {}) {
    this.#filter = createSVGElement('filter');
    this.#propertyUpdate(this.#filter, {
      id: 'glassMorph',
      filterUnits: 'userSpaceOnUse',
      primitiveUnits: 'userSpaceOnUse'
    });

    // 1) Blur background
    const bgBlur = createSVGElement('feGaussianBlur');
    this.#propertyUpdate(bgBlur, {
      in: 'BackgroundImage',
      stdDeviation: blurAmount,
      result: 'bg-blur'
    });

    // 2) Slight color adjustment
    const bgTint = createSVGElement('feColorMatrix');
    this.#propertyUpdate(bgTint, {
      in: 'bg-blur',
      type: 'matrix',
      values: `
      0.96 0    0    0 0
      0    0.96 0    0 0
      0    0    0.97 0 0
      0    0    0    1 0
    `,
      result: 'bg-tint'
    });

    // 3) Mask blurred background to shape
    const bgInShape = createSVGElement('feComposite');
    this.#propertyUpdate(bgInShape, {
      in: 'bg-tint',
      in2: 'SourceAlpha',
      operator: 'in',
      result: 'bg-in-shape'
    });

    // 4) Frost overlay
    const frost = createSVGElement('feFlood');
    this.#propertyUpdate(frost, {
      'flood-color': 'white',
      'flood-opacity': frostOpacity,
      result: 'frost'
    });

    const frostInShape = createSVGElement('feComposite');
    this.#propertyUpdate(frostInShape, {
      in: 'frost',
      in2: 'SourceAlpha',
      operator: 'in',
      result: 'frost-in-shape'
    });

    // 5) Merge glass base
    const glassBaseMerge = createSVGElement('feMerge');
    const glassBaseNode1 = createSVGElement('feMergeNode');
    const glassBaseNode2 = createSVGElement('feMergeNode');
    this.#propertyUpdate(glassBaseNode1, { in: 'bg-in-shape' });
    this.#propertyUpdate(glassBaseNode2, { in: 'frost-in-shape' });
    this.#appendChildren(glassBaseMerge, glassBaseNode1, glassBaseNode2);
    glassBaseMerge.setAttribute('result', 'glass-base');

    // 6) Inner highlight
    const edgeBlurEl = createSVGElement('feGaussianBlur');
    this.#propertyUpdate(edgeBlurEl, {
      in: 'SourceAlpha',
      stdDeviation: edgeBlur,
      result: 'edge-blur'
    });

    const innerBand = createSVGElement('feComposite');
    this.#propertyUpdate(innerBand, {
      in: 'edge-blur',
      in2: 'SourceAlpha',
      operator: 'arithmetic',
      k1: 0,
      k2: -1,
      k3: 1,
      k4: 0,
      result: 'inner-band'
    });

    const edgeFlood = createSVGElement('feFlood');
    this.#propertyUpdate(edgeFlood, {
      'flood-color': 'white',
      'flood-opacity': edgeHighlightOpacity,
      result: 'edge-color'
    });

    const edgeComposite = createSVGElement('feComposite');
    this.#propertyUpdate(edgeComposite, {
      in: 'edge-color',
      in2: 'inner-band',
      operator: 'in',
      result: 'edge-color-in'
    });

    // 7) Final merge
    const finalMerge = createSVGElement('feMerge');
    const finalNode1 = createSVGElement('feMergeNode');
    const finalNode2 = createSVGElement('feMergeNode');
    this.#propertyUpdate(finalNode1, { in: 'glass-base' });
    this.#propertyUpdate(finalNode2, { in: 'edge-color-in' });
    this.#appendChildren(finalMerge, finalNode1, finalNode2);

    // Append all
    this.#appendChildren(
      this.#filter,
      bgBlur,
      bgTint,
      bgInShape,
      frost,
      frostInShape,
      glassBaseMerge,
      edgeBlurEl,
      innerBand,
      edgeFlood,
      edgeComposite,
      finalMerge
    );

    this.#filterComp = {
      bgBlur,
      bgTint,
      bgInShape,
      frost,
      frostInShape,
      glassBaseMerge,
      edgeBlurEl,
      innerBand,
      edgeFlood,
      edgeComposite,
      finalMerge
    };

    return 'glassMorph';
  }
}

/*
 
1. Drop Shadow (soft multiple shadows) → like Material Design shadows with elevation levels.


2. Noise / Grain → adds film/noise texture (often done with <feTurbulence> + blend).


3. Bevel/Emboss → makes things look carved or raised (combo of diffuse lighting + specular lighting).


4. Specular Lighting (shiny reflections) → more metallic/glossy look compared to diffuse.


5. Morphology (erode/dilate) → SVG feMorphology, good for “stroke-thick” or “cut-out” effects.


6. Blend Modes → <feBlend> with multiply, screen, overlay… powerful for duotones & overlays.


7. Convolution (edge detection, sharpen) → <feConvolveMatrix>, niche but powerful.
 */
