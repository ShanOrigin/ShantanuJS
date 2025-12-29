import {
  GraphicalElementProperties,
  AllGShapeStyleProperties,
  dimensions
} from '../../properties/provider/shapeProperties.js';

import {
  parameterTypeValidator,
  animationChecks,
  getTransformationMatrix,
  cwarn
} from '../../utils/providers/utils.js';

import { Animation } from '../../utils/providers/utils.js';
import { Filter } from '../../utils/providers/utils.js';
import { TransformMinix } from '../../utils/providers/utils.js';

import {
  DEV_INTERNAL_ACCESS,
  assertAccess
} from '../../utils/internals/accessKeys.js';

export { DEV_INTERNAL_ACCESS, assertAccess };
// ------ Type Imports ------

import type { animatableProps } from '../../utils/animations/animation.js';
import type { attrsMethodReturnTypes, transformStack } from '../../types/index';
import type {
  IadvanceProps,
  EasingType,
  EasingFunction
} from '../../types/animation';
import type {
  TranslateMethodProps,
  ScaleMethodProps,
  RotateMethodProps,
  SkewMethodProps,
  FlipMethodProps
} from '../../types/transformations';
import type { shapesPropsType } from '../../types/shapes';

import {
  boxShadowProps,
  innerShadowProps,
  colorMatrixProps,
  displacementEffectProps,
  lightEffectProps,
  linearGradientProps,
  radialGradientProps,
  neuMorphProps,
  glassMorphProps
} from '../../types/filters';

import type { IGraphicalElementProperties as IG } from '../../properties/provider/shapeProperties';

import { EventsSystem } from '../../core/providers/eventsSystem.js';
import { GShpesTages } from '../../core/providers/graphics.js';

export abstract class Shape<T extends GShpesTages> extends TransformMinix(
  EventsSystem
)<T> {
  #fig = this.getIFig(DEV_INTERNAL_ACCESS); // reference to base class original fig
  #geometry = this.getIGeo(DEV_INTERNAL_ACCESS); // reference to base class original geometry
  //#Animations!: Animation<T>[]; // for timeline support but not implementated yet
  #isAnimations: boolean = false; // animation control to avoid multiple animation do not run at same time

  #classProp: {
    selectable: boolean;
    hasCanvasSelectable: boolean;
  } = {
    selectable: false,
    hasCanvasSelectable: false
  }; // future use

  // Actual implementation
  constructor(shape: T, id: string) {
    super(shape, id); // ( shape generics , id , rander generics by default = 'path' )
  }

  protected getClassProps(accessKey: symbol) {
    assertAccess(accessKey);

    return this.#classProp;
  }
  //++++++++++++++++++++++++++++++ Child Class Going to Override this below methods  ++++±+++++++++++++++++++++++++++++

  // In this function the code of matrix generation for that particular shape should be implementated.
  // According to the how are generating that shape matrix
  protected abstract generateMatrix(accessKeys: symbol): void;

  // in this function the code of restore dimensions according to the particular shape should be implemented.
  // Restore dimension code should be according to the shape
  protected abstract restoreDimension(
    accessKeys: symbol,
    temporaryState: Float32Array,
    basic?: boolean
  ): void;

  // In this function the the validation code of that particular shape matrix should be implementated on which this method is going to be  override.
  // According to the implementation of shape Matrix in that class

  // Example - Rect class  should validate rect matrix
  // Example - Ellipe class should validate Ellipse matrix
  protected abstract validateShapeMatrix(
    accessKeys: symbol,
    matrix: Float32Array[],
    outputn?: boolean
  ): boolean | number[] | number;

  //++++++++++++++++++++++++++++++++++±+++++++++++++++++++++++++++++

  /*
Flattening = Taking your local canonical points + applying the ENTIRE transform stack → rewriting those points in world space → making that the new canonical


Destroying the previous local coordinate frame

Collapsing transforms into geometry

Moving geometry into world coordinates

Making world geometry into new local geometry

Recomputing all parametric values

Resetting transform stack to identity


LOCAL (canonical)
   ↓ apply transform stack
WORLD (live geometry)
   ↓ derive param attributes
PARAMETRIC (semantic)
   ↓ apply param edit
WORLD (modified)
   ↓ flatten into new local
LOCAL (new canonical)

Description : taking original shape data ( which is local geometry ) and then applying all transformations stack ( combined ) to convert local geometry to World geometry or Actual screen representation then apply parametric attributes accordingly ( because parametric attributes changes original geometry ) then after this now making new world geometry as local geometry for further operations and reseting entire transform stack to identity . 

*/

  #flattenTransforms(
    applyUserParams: Function,
    userParams: Record<string, string | number>
  ) {
    console.log('in Flattening');
    const composedMatrix = this.getCMatrix(DEV_INTERNAL_ACCESS)() as DOMMatrix;

    // const { a, b, m31, c, d, m32, e, f } = composedMatrix;

    // column major because shape matrix is row major and for clearity

    //  const transformMatrix = new Float32Array([a, b, m31, c, d, m32, e, f, 1]);

    //  console.log('transforMatrix ', transformMatrix);
    const updatedBuffer = this.getMProduct(
      DEV_INTERNAL_ACCESS,
      composedMatrix
    )() as Float32Array;

    // create world view parameters of local geometry and reflects that new world view parameters in Actual current state of this shape geometry which are current parameters of shape.

    // console.log('updatedBuffer = ', updatedBuffer);
    this.#restore({
      temporaryState: updatedBuffer,
      isEffect: true
    });

    // apply or add user given parameters to world view parameters .
    applyUserParams({ ...userParams, transform: '' });

    // this use world view parameters + user Parameters created by restore to create new local or canonical representation of shape with respect to world parameters and new user given attrs parameters
    this.generateMatrix(DEV_INTERNAL_ACCESS);

    const geo = this.#geometry as {
      transformStack: transformStack;
    };

    geo.transformStack.stack.length = 1;
    // assinging identity matrix to composed or cumulative  matrix

    (geo.transformStack.stack[0].transformMatrix as Float32Array).set(
      [1, 0, 0, 0, 1, 0, 0, 0, 1],
      0
    );
  }

  public override attrs(
    props: shapesPropsType | string
  ): attrsMethodReturnTypes {
    try {
      const shape = this.#geometry?.shape;
      if (!shape || shape == '') {
        throw new Error('Shape is not difined');
      }

      if (typeof props === 'object') {
        if ('initial' in props && props.initial) {
          delete props.initial;
          console.log('initial');
          super.attrs(props);
          this.generateMatrix(DEV_INTERNAL_ACCESS);
        } else {
          parameterTypeValidator(
            props,
            GraphicalElementProperties,
            AllGShapeStyleProperties,
            this.#classProp,
            shape
          );

          //ToDo : autoFixGeometry according to shape
          //autoFixGeometry(props, ['rx', 'ry', 'stroke-width']);

          const elementProps = GraphicalElementProperties[shape as keyof IG];
          const styleProps =
            AllGShapeStyleProperties[
              shape as keyof typeof AllGShapeStyleProperties
            ];

          // g for storing Geometry specific properties
          const g: Record<string, number | string> = {};
          // s for storing Style specific properties
          const s: Record<string, string | number | undefined> = {};

          for (const key in props) {
            if (key in elementProps) {
              const k = key as keyof typeof elementProps;

              g[k] = props[k]; // TS now knows k is valid
            } else if (key in styleProps) {
              const k = key as keyof typeof styleProps;
              s[k] = props[k]; // TS now knows k is valid
            }
          }
          if (shape === 'rect') {
            'rx' in g && ((s['rx'] = g['rx']), delete g['rx']);
            'ry' in g && ((s['ry'] = g['ry']), delete g['ry']);
          }

          // applying style properties only
          super.attrs(s);

          // applying geometric perperties with respect to shape if any property available

          Object.keys(g).length > 0 &&
            this.#flattenTransforms(super.attrs.bind(this), g);

          // renderering new updated geometry and style
        }
      } else if (typeof props === 'string') {
        let result = super.attrs(props);
        if (result != null) {
          return result;
        }
      }

      return undefined;
    } catch (e) {
      throw e;
    }
  }

  public setSMatrix(m: number[][], rollback: boolean = false): void {
    try {
      if (this.#isAnimations) {
        cwarn('Animation is Going on So can not set matrix seperataly...!');
        return;
      }

      cwarn(
        'setSMatrix: All previous transformations are cleared , becarefull , you might loose all privouse dara of shape.'
      );

      const geo = this.#geometry as {
        transformStack: transformStack;
        buffer: Float32Array;
        shape: string;
      };

      if (!geo) {
        throw new Error('Geometry not initialized');
      }
      const shape = geo.shape as keyof typeof dimensions;

      const [rowSize, columnSize] = dimensions[shape];

      const sb = [] as Float32Array[];
      const prev = new Float32Array(
        geo.buffer.slice(0, columnSize! * rowSize!)
      ); // backup

      for (let i = 0; i < rowSize!; i++) {
        sb[i] = new Float32Array(3);
        for (let j = 0; j < columnSize!; j++) {
          const e = m[i]?.[j] ?? 1;
          geo.buffer[i * columnSize! + j] = e;
          sb[i]![j]! = e;
        }
      }

      if (
        !Array.isArray(sb) ||
        !this.validateShapeMatrix(DEV_INTERNAL_ACCESS, sb)
      ) {
        if (rollback) {
          geo.buffer.set(prev, 0); // rollback
        } else {
          throw new Error(
            'given Matrix for Rectangle is invalid maybe it is not actually the shape which you want to give'
          );
        }
      }

      this.restoreDimension(DEV_INTERNAL_ACCESS, geo.buffer);

      // setting '' to transform attribute of svg
      this.attrs({ transform: '' });
      // clearing all transformations stack history
      geo.transformStack.stack.length = 1;
      // assinging identity matrix to composed or cumulative  matrix

      (geo.transformStack.stack[0].transformMatrix as Float32Array).set(
        [1, 0, 0, 0, 1, 0, 0, 0, 1],
        0
      );
    } catch (e) {
      throw e;
    }
  }

  // returning a transformation Matrix applied by user

  public getTMatrix(
    which: string | number = 0,
    major: 'r' | 'c' = 'r'
  ): number[][] {
    return getTransformationMatrix(
      (this.#geometry as { transformStack: transformStack }).transformStack
        .stack,
      which,
      major
    ) as number[][];
  }

  #restore({
    temporaryState,
    isEffect
  }: {
    temporaryState: Float32Array;
    isEffect: boolean;
  }) {
    isEffect && this.restoreDimension(DEV_INTERNAL_ACCESS, temporaryState);
  }

  //++++++++++++++++++++++++++++++++++++++++++++
  // Transformations Section
  //++++++++++++++++++++++++++++++++++++++++++++
  #preChecks(mode: string, px: number, py: number) {
    //  this.#geometry && !this.#geometry.Obbox && this.getBBox();

    if ((mode == 'p' || mode == 'pivot') && px == 0 && py == 0) {
      cwarn(
        "pivot px , py both are zero so effect is same as relative transformation even if type is 'pivot' or 'p' , falling to 'relative' type to save computations."
      );
      mode = 'r';
    }
    return mode;
  }

  public override Translate({
    x,
    y,
    tType = 'a',
    px = 0,
    py = 0
  }: Required<Pick<TranslateMethodProps, 'x' | 'y'>> &
    Partial<Omit<TranslateMethodProps, 'x' | 'y'>>): /*
    
     Omit<TranslateMethodProps, 'isEffect' | 'isVEffect'> */ this {
    try {
      if (this.#isAnimations) {
        cwarn(
          'Animation is Going on So can not apply transformation seperataly...!'
        );
        return this;
      }
      tType = this.#preChecks(tType, px, py);

      super.Translate({
        x,
        y,
        tType,
        px,
        py,
        isEffect: true,
        callbacks: this.#restore.bind(this),
        isVEffect: true
      });
      return this;
    } catch (e) {
      throw e;
    }
  }

  public override Scale({
    sx = 1,
    sy = 1,
    tType = 'a',
    px = 0,
    py = 0
  }: Omit<ScaleMethodProps, 'isEffect' | 'isVEffect'>): this {
    try {
      if (this.#isAnimations) {
        cwarn(
          'Animation is Going on So can not apply transformation seperataly...!'
        );
        return this;
      }

      tType = this.#preChecks(tType, px, py);
      super.Scale({
        sx,
        sy,
        tType,
        px,
        py,
        isEffect: true,
        callbacks: this.#restore.bind(this),
        isVEffect: true
      });
      return this;
    } catch (e) {
      throw e;
    }
  }

  public override Rotate({
    angle,
    tType = 'a',
    px = 0,
    py = 0
  }: Omit<RotateMethodProps, 'isEffect' | 'isVEffect'>): this {
    try {
      if (this.#isAnimations) {
        cwarn(
          'Animation is Going on So can not apply transformation seperataly...!'
        );
        return this;
      }

      tType = this.#preChecks(tType, px, py);

      super.Rotate({
        angle,
        tType,
        px,
        py,
        isEffect: true,
        callbacks: this.#restore.bind(this),
        isVEffect: true
      });
      return this;
    } catch (e) {
      throw e;
    }
  }
  public override Skew({
    sx,
    sy,
    tType = 'a',
    px = 0,
    py = 0
  }: Omit<SkewMethodProps, 'isEffect' | 'isVEffect'>): this {
    try {
      if (this.#isAnimations) {
        cwarn(
          'Animation is Going on So can not apply transformation seperataly...!'
        );
        return this;
      }
      tType = this.#preChecks(tType, px, py);

      super.Skew({
        sx,
        sy,
        tType,
        px,
        py,
        isEffect: true,
        callbacks: this.#restore.bind(this),
        isVEffect: true
      });
      return this;
    } catch (e) {
      throw e;
    }
  }
  public override Flip({
    flipX,
    flipY,
    dirX = 'x+',
    dirY = 'y+'
  }: Omit<FlipMethodProps, 'isEffect' | 'isVEffect'>): this {
    try {
      if (this.#isAnimations) {
        cwarn(
          'Animation is Going on So can not apply transformation seperataly...!'
        );
        return this;
      }
      this.#preChecks('', 1, 1);

      super.Flip({
        flipX,
        flipY,
        dirX,
        dirY,
        isEffect: true,
        callbacks: this.#restore.bind(this),
        isVEffect: true
      });
      return this;
    } catch (e) {
      throw e;
    }
  }

  public override transform(input: string): this {
    try {
      if (this.#isAnimations) {
        cwarn(
          'Animation is Going on So can not apply transformation seperataly...!'
        );
        return this;
      }
      this.#preChecks('', 1, 1);
      super.transform(input, [this.#restore.bind(this)]);
      return this;
    } catch (e) {
      throw e;
    }
  }

  //++++++++++++++++++++++++++++++++++++++++++++
  // Animation Section
  //++++++++++++++++++++++++++++++++++++++++++++

  #isAnimationsGoingOn(arg: boolean): boolean | undefined | void {
    if (!arg) return this.#isAnimations;
    this.#isAnimations = !this.#isAnimations;
  }

  public animate(
    attrs: animatableProps & IG['rect'],
    avdProp: IadvanceProps | null,
    duration: number,
    ease: EasingFunction | EasingType | null = null,
    onComplete: Function | null = null
  ): void | Promise<void> {
    this.#preChecks('', 1, 1);
    animationChecks(attrs, avdProp, duration, ease, onComplete);

    const animation = new Animation<'rect'>(
      this,
      this.#isAnimationsGoingOn.bind(this),
      function () {}
    );
    return animation.animate(attrs, avdProp, duration, ease, onComplete, true);
  }

  public animatia(
    attrs: animatableProps & IG['rect'],
    avdProp: IadvanceProps | null,
    duration: number,
    ease: EasingFunction | EasingType | null = null,
    onComplete: Function | null = null
  ): {
    start: () => void | Promise<void>;
    pause: () => void;
    resume: () => Promise<void>;
    isPaused: () => boolean;
    isRunning: () => boolean;
  } {
    this.#preChecks('', 1, 1);
    animationChecks(attrs, avdProp, duration, ease, onComplete);
    const animation = new Animation<'rect'>(
      this,
      this.#isAnimationsGoingOn.bind(this),
      function () {}
    );
    animation.animate(attrs, avdProp, duration, ease, onComplete, false);

    return {
      start: animation.start.bind(animation),
      pause: animation.pause.bind(animation),
      resume: animation.resume.bind(animation),
      isPaused: animation.isPaused.bind(animation),
      isRunning: animation.isRunning.bind(animation)
    };
  }

  //++++++++++++++++++++++++++++++++++++++++++++
  // Filter Section
  //++++++++++++++++++++++++++++++++++++++++++++
  public boxShadow(props: boxShadowProps) {
    new Filter().boxShadow(this.#fig, props);
  }

  public innerShadow(props: innerShadowProps) {
    new Filter().innerShadow(this.#fig, props);
  }

  public blur(blur: number) {
    new Filter().blur(this.#fig, blur);
  }

  public glow(bright: number) {
    new Filter().glow(this.#fig, bright);
  }

  public linearGradient(
    props: linearGradientProps = { direction: 'LR', stops: [] }
  ) {
    new Filter().linearGradient(this.#fig, props);
  }

  public radialGradient(
    props: radialGradientProps = {
      direction: 'CENTER',
      stops: []
    }
  ) {
    new Filter().radialGradient(this.#fig, props);
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
    new Filter().lightEffect(this.#fig, props);
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
    new Filter().displacementEffect(this.#fig, props);
  }

  public colorMatrixTransformation(
    props: colorMatrixProps = {
      type: 'saturate',
      values: 1,
      inSource: 'SourceGraphic'
    }
  ) {
    new Filter().colorMatrixTransformation(this.#fig, props);
  }

  public neuMorph(
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
    new Filter().neuMorph(this.#fig, props);
  }

  public glassMorph(
    props: glassMorphProps = {
      blurAmount: 10,
      frostOpacity: 0.05,
      edgeBlur: 1.2,
      edgeHighlightOpacity: 0.35
    }
  ) {
    new Filter().glassMorph(this.#fig, props);
  }
}
