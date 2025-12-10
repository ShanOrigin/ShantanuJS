// ----- Types Imports -----

import type {
  IGraphicalElementProperties as IG,
  //  INonGraphicalElementProperties as NIG,
  //  ICommonStyleProperties as IS
  IAllStyleProperties as IS
} from '../../properties/provider/shapeProperties';
import type {
  TransformGeometry,
  TransformGeometryWithPivot,
  NumberType,
  TGWPkeys,
  Point,
  CurveType,
  ArcTableEntry,
  EasingFunction,
  EasingType,
  IcommonGeometryAnimatableProperties,
  IadvanceProps,
  anchors,
  modes,
  opt,
  physicsParams,
  curveParams,
  pivotParams,
  controlsParams
} from '../../types/animation';

import type { iShape } from '../../shapes/provider/shapesTypes';

// ----- Runtime Imports -----

import Colors from '../../utils/colors/colors.js';
import { DEV_INTERNAL_ACCESS } from '../../utils/providers/accesskeys.js';
import {
  //  GraphicalElementProperties as G,
  //  NonGraphicalElementProperties as NG,
  //  CommonStyleProperties as S
  AllStyleProperties as S,
  IAllGShapeStyleProperties
} from '../../properties/provider/shapeProperties.js';

import {
  //----- impoting data -----
  tx,
  ty,
  sx,
  sy,
  map,
  CommonStyleAnimatableProperties,
  //----- impoting functions -----
  lerp,
  separateProperties,
  easing,
  pivotSetter,
  deepMerge,
  choosePivotAwareOptimization
} from './preBuilds/helpers/helpers.js';

import {
  interpolateAlongCurve,
  getTForDistance
} from '../../utils/curve/curveGenerator/interpolateAlongCurve.js';
import { generateCurvePoints } from '../../utils/curve/curveGenerator/generateCurvePoints.js';

import {
  fitTransformPolynomialsFast,
  transformUsingPolynomialFast
} from './preBuilds/preComputationsOptimizations/fitPolynomialFast.js';

import {
  precomputeFramesRaw,
  setPreComputedFrame
} from './preBuilds/preComputationsOptimizations/preComputeFrames.js';
import { transformStack } from '../../types';

type optFuncType = Float32Array &
  ReturnType<typeof fitTransformPolynomialsFast>;

type precomputeFramesRawType = (
  a: Float32Array,
  b: Point[],
  c: number,
  d: boolean,
  e?: number
) => string;

type transformUsingPolynomialFastType = (
  a: ReturnType<typeof fitTransformPolynomialsFast>,
  b: Point[],
  c: number,
  d: boolean,
  e?: number
) => string;

export type animatableProps = Partial<
  IcommonGeometryAnimatableProperties & {
    [K in keyof typeof CommonStyleAnimatableProperties]?: any;
  }
>;

type GShpesTages = keyof IG;
const GraphicsSource = 'http://www.w3.org/2000/svg';
//++++++++++ Animation Class   ++++++++++++
//export class Animation<T extends GShpesTages> {

import type { GraphicalElement } from '../../core/graphics/graphics/graphicalElement';
import type { Constructor } from '../mixinConstructor';

/**
 * Adds transformation-related capabilities to any base class.
 *
 * This mixin is responsible for attaching the transformation system to
 * graphical elements. It **does not** define what a graphical element is;
 * it only injects transformation behavior into whatever class is given.
 *
 * What it does:
 * - Adds a `transformStack` to track applied transforms
 * - Adds transformation manipulation methods (setTransform, reset, etc.)
 * - Preserves the generic types and constructor signature of the base class
 *
 * @param Base  Any class that should gain transformation behavior.
 * @returns     A new class extending Base with transform APIs added.
 */
export function AnimationMixin<
  TBase extends Constructor<GraphicalElement<any>>
>(Base: TBase) {
  abstract class Animatable extends Base {
    constructor(...rest: any[]) {
      super(...rest);
    }

    // #el is animator class Instance  which shape going to animate in SAnimation class
    #el!: iShape; //  GEC<keyof IG, keyof IG>;

    // it holds only Graphics elements or Figure of a Instance
    #elFig!: SVGElement;
    // Arc Length Parameterized table for storing arc table
    #arcTable!: ArcTableEntry[];

    // Arc total length while Arc length parameterization
    #totalLength!: number;

    // to store curve Path points { x , y } or sampaling points on curve
    #curvePoints: Point[] = [];

    // object to store Initial Geometry of Animation Shape in the transformed state
    #initialGeometry: TransformGeometry = {
      Translate: [0, 0],
      Scale: [1, 1],
      Rotate: 0,
      Skew: [0, 0]
    };

    // object to store Initial Style of Animation Shape
    #initialStyle = {} as IS | { fill: number[]; stroke: number[] };

    // transformation matrix of Shape before Animation
    #Tmatrix: Float32Array = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);

    // shared matrix of the shape which represent shape Matrix and oriented bounding box matrix
    #sharedSMatrix!: Float32Array;

    // progress represent how much animation completed from 0 to 1
    #progress!: number;

    //when direction is alternate then for handling ping pong motion
    #reverseCycle: boolean = false;

    // shape store which class Object is Going to animate
    #shape!: string; //T;

    // start time is time whem animation stared
    #startTime!: number;

    // ellipse time is time that shows how much time passed from animation start
    #elapsedTime: number = 0;

    // total time is time that which animation going to take time
    #totalTime!: number;

    // it holds animation state like animation is going on or stoped
    #animationState: boolean = false;

    // it tells animation allready available or not to --- avoid multiple animations can not run on same shape at same time it holds parent class isAnimation method to determine  ---
    #isAnimation: (t: boolean) => boolean | undefined;

    // object to store final Geometry and respective Pivot data of Animation Shape in the transformed state

    #finalGeometry: TransformGeometryWithPivot = {
      Translate: [0, 0],
      Scale: [0, 0],
      Rotate: 0,
      Skew: [0, 0]
    };

    // object to store final Style of Animation Shape
    #finalStyle: Record<string, number | string | number[]> = {};

    // object to store all advance properties about animation given by user and provide by default options
    #advInfo: IadvanceProps = {
      physics: {
        physicsMotion: false, // controls speed , time via , speed = distance / time law of physics for arc length reparameterization
        speed: 0.5 // controls speed via speed = distance /time law
      },
      curve: {
        curvePathMotion: false, // controls animate along side path or not
        curvePath: 'linear', // curve type to animate along curve path
        stepness: 0, // controls how much curve should bend or curvature
        smoothness: 0 // controls smoothness of forming curve vai stepness
      },
      pivot: {
        mode: 'relative', // controls animation transformation mode  a - geometric center ( exept translate)  , r - relative to top left , p - piviot eble px, py  , c - center( translate only)
        rotatePivot: 'C', // be default center
        scalePivot: 'C', // be default center
        skewPivot: 'C' // be default center
      },
      controls: {
        loop: false, // controls animation go in loop or not
        direction: 'normal', // controls direction of animation
        optimizationTechnique: 'fitPolynomialCofficient' // in rendering it decide wheather to optimize with which optimization
      }
    };

    // it store easing Function according to user values
    #easingFunction: EasingFunction = (t: number) => t;

    // it store on Complete Function which is going to run after Animation 100% completed
    #onComplete: Function = function () {}; ////console.log('Animation completed');

    // it store next animation frame Id for easy handaling
    #animationFrameId: number | null = null;

    // it store cleanUp Function to clean animator mess after animation completion
    #cleanUp!: Function;

    // it checks is user given animatableProps consists transform directly.
    #isTranslation!: boolean;

    // it store completion Promise , in case animation pause or played cases
    #completionPromise: Promise<void> | null = null;

    // it store completion Resolve Function , in case animation pause or played cases
    #completionResolve: (() => void) | null = null;

    // it stores interpolation functions of choosen by optimization technique
    #interpolateFunction!:
      | precomputeFramesRawType
      | transformUsingPolynomialFastType;

    // it stores either pre computed frames data or polynomial fit data according to choosen optimization technique
    #preComputeFranesOrPolynomial!:
      | Float32Array
      | ReturnType<typeof fitTransformPolynomialsFast>;

    /*
  constructor(
    GElement: iShape, // GEC<keyof IG, keyof IG>,
    isAnimation: (t: boolean) => boolean | undefined,
    cleanUp: Function
  ) {
    this.#elFig = GElement.getIFig(DEV_INTERNAL_ACCESS);

    const geo = GElement.getIGeo(DEV_INTERNAL_ACCESS) as {
      transformStack: transformStack;
      shape: string;
      buffer: Float32Array;
    };

    const style = GElement.getIStyle(DEV_INTERNAL_ACCESS);
    this.#shape = geo?.shape as string;

    this.#isAnimation = isAnimation;
    this.#el = GElement;

    this.#sharedSMatrix = new Float32Array(geo?.buffer?.length ?? 0);
    this.#sharedSMatrix.set(geo?.buffer as Float32Array);

    this.#Tmatrix = (geo.transformStack.stack[0].transformMatrix ??
      this.#Tmatrix) as Float32Array;

    for (const key in style) {
      key in S &&
        key in CommonStyleAnimatableProperties &&
        ((this.#initialStyle as any)[key as keyof IS] = (style as IS)[
          key as keyof IS
        ]);
    }

    this.#cleanUp = cleanUp as Function;
  }
*/

    // -----------curve Style -----------

    #curveFormation(
      el: SVGElement,
      curvePoints: { x: number; y: number }[],
      normalizePoints: { px: number; py: number }
    ) {
      if (!Array.isArray(curvePoints)) return;

      const curve = document.createElementNS(GraphicsSource, 'polyline');

      // Collect transformed points
      let path = '';

      for (let i = 0; i < curvePoints.length; i++) {
        const p = curvePoints[i];

        // local point
        let x = normalizePoints.px + p.x;
        let y = normalizePoints.py + p.y;

        path += `${x},${y} `;
      }

      curve.setAttribute('points', path);
      curve.setAttribute('stroke-width', '1');
      curve.setAttribute('stroke', 'black');
      // append to same svg

      el.ownerSVGElement?.appendChild(curve);
    }

    //++++++++++± InterPolation Logic ++++++±++++

    //+++++++++++++++++++++++++++
    // Function to interpolate everything given by user , main fighter of class
    //+++++++++++++++++++++++++++

    #interpolater() {
      //++++++ Transforming Geometry of Shape +++++
      // this.#transformGeometry();
      const fP: Record<string, number | string> = {}; // final Apply properties
      const tMatrix = this.#interpolateFunction(
        this.#preComputeFranesOrPolynomial as optFuncType,
        this.#curvePoints,
        this.#progress,
        this.#isTranslation
      );
      fP['transform'] = tMatrix;

      console.log(tMatrix);
      // ++++++ Transforming Style of Shape +++++

      const iS = this.#initialStyle as object,
        fS = this.#finalStyle as object;

      for (const k in fS) {
        if (
          k in CommonStyleAnimatableProperties &&
          k !== 'fill' &&
          k !== 'stroke'
        ) {
          fP[k] = lerp(
            (iS as any)?.[k] ?? 0,
            (fS as any)[k] as number,
            this.#progress
          );
        } else if (k === 'fill' || k === 'stroke') {
          const i: number[] = ((iS as any)?.[k] as number[]) ?? [0, 0, 0, 0];
          const f: number[] = (fS as any)[k] as number[];

          fP[k] = `rgba(
  ${Math.round(lerp(i[0], f[0], this.#progress))},
  ${Math.round(lerp(i[1], f[1], this.#progress))},
  ${Math.round(lerp(i[2], f[2], this.#progress))},
  ${lerp(i[3], f[3], this.#progress)}
)`;
        }
      }

      this.#el.attrs(fP);
    }

    //+++++++++++++++++++++++++++
    // Function to requests frame to browser
    //+++++++++++++++++++++++++++

    #requestNextFrame() {
      this.#animationFrameId = requestAnimationFrame(this.#update);
    }

    public isRunning(): boolean {
      // Animation is running if there’s an active frame and state is true
      return !!this.#animationFrameId && this.#animationState;
    }

    public isPaused(): boolean {
      // Animation is paused if no frame is active and state is false
      return !this.#animationFrameId && !this.#animationState;
    }

    public cancelAnimation(): void {
      // Pause the animation first and then reflect upto current progress in data
      this.pause();
      this.#resetAllStates();
    }
    /*
  #resetAllStates() {
    // #el is animator class object which shape going to animate
    (this.#el as any) = null;
    (this.#elFig as any) = null;

    // Arc Length Parameterized table for storing arc table
    (this.#arcTable as any) = null;

    // Arc total length while Arc length parameterization
    (this.#totalLength as any) = null;

    // to store curve Path points { x , y } or sampaling points on curve
    (this.#curvePoints as any) = null;

    // object to store Initial Geometry of Animation Shape in the transformed state
    (this.#initialGeometry as any) = null;
    // as Geometry & IG[T];

    // object to store Initial Style of Animation Shape
    (this.#initialStyle as any) = null;

    // transformation matrix of Shape before Animation
    (this.#Tmatrix as any) = null;

    // shared matrix of the shape which represent shape Matrix and oriented bounding box matrix
(this.#sharedSMatrix as any) = null;

    // progress represent how much animation completed from 0 to 1
    (this.#progress as any) = null;

    //when direction is alternate then for handling ping pong motion
    (this.#reverseCycle as any) = null;

    // shape store which class Object is Going to animate
    (this.#shape as any) = null;

    // start time is time whem animation stared
    (this.#startTime as any) = null;

    // ellipse time is time that shows how much time passed from animation start
    (this.#elapsedTime as any) = null;

    // total time is time that which animation going to take time
    (this.#totalTime as any) = null;

    // it holds animation state like animation is going on or stoped
    (this.#animationState as any) = null;

    // it tells animation allready available or not to --- avoid multiple animations can not run on same shape at same time ---
    (this.#isAnimation as any) = null;

    // object to final Initial Geometry of Animation Shape in the transformed state
    (this.#finalGeometry as any) = null;

    // object to store final Style of Animation Shape
    (this.#finalStyle as any) = null;

    // object to store all advance properties about animation given by user and provide by default options
    (this.#advInfo as any) = null;

    // it store easing Function according to user values
    (this.#easingFunction as any) = null;

    // it store on Complete Function which is going to run after Animation 100% completed
    (this.#onComplete as any) = null;

    // it store next animation frame Id for easy handaling
    (this.#animationFrameId as any) = null;

    // it store cleanUp Function to clean animator mess after animation completion
    (this.#cleanUp as any) = null;

    // it checks is user given animatableProps consists transform directly.
    (this.#isTranslation as any) = null;

    // it store completion Promise , in case animation pause or played cases
    (this.#completionPromise as any) = null;

    // it store completion Resolve Function , in case animation pause or played cases
    (this.#completionResolve as any) = null;

    (this.#interpolateFunction as any) = null;

    (this.#preComputeFranesOrPolynomial as any) = null;
  }
*/

    #resetAllStates() {
      for (const k of [
        '#el',
        '#elFig',
        '#arcTable',
        '#totalLength',
        '#curvePoints',
        '#initialGeometry',
        '#initialStyle',
        '#Tmatrix',
        '#sharedSMatrix',
        '#progress',
        '#reverseCycle',
        '#shape',
        '#startTime',
        '#elapsedTime',
        '#totalTime',
        '#animationState',
        '#isAnimation',
        '#finalGeometry',
        '#finalStyle',
        '#advInfo',
        '#easingFunction',
        '#onComplete',
        '#animationFrameId',
        '#cleanUp',
        '#isTranslation',
        '#completionPromise',
        '#completionResolve',
        '#interpolateFunction',
        '#preComputeFranesOrPolynomial'
      ])
        (this as any)[k] = null;
    }

    //+++++++++++++++++++++++++++
    // Function to stop animation at any movement of time
    //+++++++++++++++++++++++++++

    public pause(): void {
      if (!this.#animationState) return; // Already paused

      this.#elapsedTime = performance.now() - this.#startTime;
      this.#animationState = false;

      if (this.#animationFrameId) {
        cancelAnimationFrame(this.#animationFrameId);
        this.#animationFrameId = null; // Clear the ID to prevent reuse
      }
      // animation paused so it should affected in the hope of it will resume later
      this.#applyFinalTransformationMatrix(this.#progress);
    }

    //+++++++++++++++++++++++++++
    // Function to start animation , main door opener to this class
    //+++++++++++++++++++++++++++

    start(): Promise<void> | void {
      //console.log(this.#isAnimation(false), this.#animationState);
      if (this.#isAnimation(false) || this.#animationState) {
        //console.warn('animation is going on so cancelAnimationFrame');

        return this.#completionPromise ?? Promise.resolve();
      }
      this.#isAnimation(true);

      this.#startTime = performance.now();
      this.#elapsedTime = 0;
      this.#animationState = true;

      this.#completionPromise = new Promise((resolve) => {
        this.#completionResolve = resolve;
      });

      this.#requestNextFrame();

      return this.#completionPromise;
    }

    //+++++++++++++++++++++++++++
    // Function to start animation where it was stoped
    //+++++++++++++++++++++++++++

    resume(): Promise<void> {
      if (this.#animationState) {
        return this.#completionPromise ?? Promise.resolve();
      }

      this.#startTime = performance.now() - this.#elapsedTime;
      this.#animationState = true;

      this.#completionPromise = new Promise((resolve) => {
        this.#completionResolve = resolve;
      });

      // reset all to Initial position which pre cached data  which affected by this.#applyFinalTransformationMatrix when paused
      // these sharedBuffer and TList are mendetory properties so dont warry

      const geo = this.getIGeo(DEV_INTERNAL_ACCESS);

      (geo?.buffer as Float32Array).set(this.#sharedSMatrix as Float32Array);
      (
        ((geo as any)?.TList[0] as { TMatrix: Float32Array })
          ?.TMatrix as Float32Array
      ).set(this.#Tmatrix);

      this.#requestNextFrame();

      return this.#completionPromise;
    }

    //+++++++++++++++++++++++++++
    // Function to update each frame of animation , main boss of this class
    //+++++++++++++++++++++++++++

    #update = (currentTime: number) => {
      if (!this.#animationState) return;
      const { speed = 1, physicsMotion = false } = this.#advInfo
        .physics as physicsParams;
      const { direction } = this.#advInfo.controls as controlsParams;

      const elapsed = currentTime - this.#startTime;
      const clampedSpeed = Math.min(Math.max(speed, 0.2), 2);

      let p1 = 0;
      // Compute progress normally
      if (this.#isTranslation && physicsMotion) {
        const distance = (elapsed / 1000) * clampedSpeed * this.#totalLength;

        const safeDistance = Math.min(Math.max(0, distance), this.#totalLength);
        this.#progress = getTForDistance(safeDistance, this.#arcTable);
      } else {
        const time = Math.min((elapsed * clampedSpeed) / this.#totalTime, 1);
        this.#progress = this.#easingFunction(time);
        // console.log('in non physics mode');
      }

      // Flip for alternate direction
      direction === 'alternate' &&
        this.#reverseCycle &&
        ((p1 = this.#progress), (this.#progress = 1 - this.#progress));

      // Interpolator
      this.#progress >= 0 && this.#progress <= 1 && this.#interpolater();

      // Check if one cycle is completed
      if (this.#progress >= 1 || p1 >= 1) {
        if (
          this.#advInfo?.controls?.loop ||
          (direction === 'alternate' && !this.#reverseCycle)
        ) {
          this.#startTime = currentTime;
          this.#elapsedTime = 0;
          this.#progress = 0;
          this.#requestNextFrame();
        } else {
          this.#animationState = false;
          this.#isAnimation(true);
          this.#onComplete?.();
          this.#completionResolve?.();
          this.#completionResolve = null;
          this.#completionPromise = null;
          this.#cleanUp();
          // animation completed all entirely
          direction !== 'alternate' && this.#applyFinalTransformationMatrix(1);
        }

        direction === 'alternate' && (this.#reverseCycle = !this.#reverseCycle);
      } else {
        this.#requestNextFrame();
      }
    };

    //+++++++++++++++++++++++++++
    // Function to multiply shape matrix to T Matrix
    //+++++++++++++++++++++++++++

    #applyFinalTransformationMatrix(progress: number) {
      // extracting Initial Transformations
      // with all type safty explecitly for below functions or methods
      const {
        Scale: IS = [1, 1], // Default: no scale
        Skew: ISK = [0, 0], // Default: no skew
        Rotate: IR = 0 // Default: no rotation
      } = this.#initialGeometry as {
        Scale: NumberType;
        Skew: NumberType;
        Rotate: number;
        Translate: NumberType;
      };

      // extracting Final all Transformations and with its respective Pivot for pivot aware transformations
      // with all type safty explecitly for below functions or methods
      const {
        Scale: FS = [1, 1],
        Skew: FSK = [0, 0],
        Rotate: FR = 0,
        rotatePivot: RP = [0, 0], // rotation pivot
        scalePivot: SP = [0, 0], // scale pivot
        skewPivot: SK = [0, 0] // skew pivot
      } = this.#finalGeometry as {
        Scale: NumberType;
        Skew: NumberType;
        Rotate: number;
        Translate: NumberType;
        rotatePivot: NumberType;
        skewPivot: NumberType;
        scalePivot: NumberType;
      };

      // availability check for each transformations because all data Already available
      let isR = FR !== 0; // has rotation
      let isS = FS[0] !== 1 || FS[1] !== 1; // has scale
      let isSK = FSK[0] !== 0 || FSK[1] !== 0; // has skew

      const s = this.#el as any;

      // composing transformations count to we can check is there any transformations available or can we batch
      const isToCompose = +this.#isTranslation + +isR + +isS + +isSK;

      // appling batching even there is 1 or more 1 transformation available

      isToCompose > 0 && (s.beginT() as Function);

      // appling translate with linear interpolation in Initial values to final values  with respect to progress with respective type for  Pivots menagement

      if (this.#isTranslation) {
        // this.#isTranslation boolean for is there translation available we can optimize other things
        // getting interpolated points on curve that may be 'linear' , 'cubic' , 'quadratic' , 'arc' with respect to overall progress
        // then appling translate in local space with type 'r' or 'relative' and 'c' or 'center' which are transformation modules features for auto pivit handling

        const p = interpolateAlongCurve(this.#curvePoints, progress);

        // console.log(' x , y ', p.x, p.y);
        s.Translate({
          x: p.x,
          y: p.y,
          tType: 'r' //  this.#advInfo?.pivot?.mode // may be 'r' or 'c'
        });
      }

      // appling skew with linear interpolation in Initial values to final values  with respect to progress with respective Skew or Shear  Pivots
      isSK &&
        s.Skew({
          sx: lerp(ISK[0], FSK[0], progress),
          sy: lerp(ISK[1], FSK[1], progress),
          tType: 'p',
          px: SK[0],
          py: SK[1]
        });

      // appling scale with linear interpolation in Initial values to final values  with respect to progress with respective Scale Pivots
      isS &&
        s.Scale({
          sx: lerp(IS[0], FS[0], progress),
          sy: lerp(IS[1], FS[1], progress),
          tType: 'p',
          px: SP[0],
          py: SP[1]
        });

      // appling rotate with linear interpolation in Initial value to final value  with respect to progress with respective Rotation Pivots
      isR &&
        s.Rotate({
          angle: lerp(IR, FR, progress),
          tType: 'pivot',
          px: RP[0],
          py: RP[1]
        });

      // appling composed transformation matrix to perticular shape

      isToCompose > 0 && s.endT();
    }

    //+++++++++++++++++++++++++++
    // Function to animate user requests ,  main executer
    //+++++++++++++++++++++++++++

    public animate(
      attrs: animatableProps & IG[T],
      advProp: IadvanceProps | null,
      duration: number,
      ease: EasingType | Function | null = 'linear',
      onComplate: Function | null = null,
      start: boolean = true
    ): void | Promise<void> {
      // step 1 - handle all user given parameters

      // negative value auto conversion into + one
      this.#totalTime = Math.abs(duration) ?? 0;

      //  -  merging user advance props with default props

      advProp &&
        typeof advProp === 'object' &&
        deepMerge(this.#advInfo, advProp); // merge user Advance props with default one

      // - setting using function according to string or given function
      (typeof ease === 'string' &&
        (this.#easingFunction = easing(ease) as EasingFunction)) ||
        (typeof ease === 'function' &&
          (this.#easingFunction = ease as EasingFunction));

      // - setting on complete call according to the user given on complete for promise evaluation
      if (onComplate) {
        const previousOnComplete = this.#onComplete;
        this.#onComplete = () => {
          previousOnComplete && previousOnComplete();
          onComplate();
        };
      }

      //////console.log('step 1 - ', this.#advInfo, this.#easingFunction);
      // step 2 - decompose user given attributes in style props and geometry props

      const { styleProps: sp, geometryProps: gp } = separateProperties(
        this.#shape as string,
        attrs
      );

      // step 3 - make style properties which are animatable compatible to linear interpolation

      this.#finalStyle = sp;
      // - feeling colour and stroke colour are converted into arrays of size 4 [ r , g , b , a ]  for a linear interpolation
      this.#styleLerp();
      //////console.log('step 3 -', this.#initialStyle, this.#finalStyle);
      // step 4 - all geometry specific properties or affine transformation given by user composed into affine transformation for further linear interpolation
      this.#associate(gp);

      // step 5 -   resolving pivit or anchor given by user or not given by user for translation purpose or other affine transformations
      let translateMode; // it store translation mode either centre translation or either relative translation

      // - below storing is translation available or translation mode for further optimization

      [this.#isTranslation, translateMode] = this.#resolvePivot() as [
        boolean,
        modes
      ];

      // console.log(this.#advInfo.pivot, translateMode, this.#isTranslation);

      // step 6 - if direction is given by user than riversing the animation props if direction is reverse
      this.#advInfo?.controls?.direction == 'reverse' &&
        this.#reverseAnimationProps();

      // step 7 - computing the curve sample points in between two points according to the translation and the shape if translation available only

      if (this.#isTranslation) {
        this.#preComputeCurvePath(translateMode as modes);
      }

      // ////console.log('step 7 - ', this.#curvePoints);

      // step 8 - setting user given puppets or system calculated periods to the transformation

      const {
        commonPivot: _common,
        mode: _mode,
        ...pivots
      } = this.#advInfo.pivot as pivotParams;

      this.#finalGeometry = { ...this.#finalGeometry, ...pivots };

      // console.log(' this.#finalGeometry = ', this.#finalGeometry);

      // step 9 - doing pre optimization according to the user chosen that may be pre computer frame optimisation or fit polynomial coefficient optimization for smooth animation and translation

      // - accessing base transformation matrix of a shape which includes previously applied all transformation on shape

      const baseTransformationMatrix: Float32Array = ((
        this.getIGeo(DEV_INTERNAL_ACCESS) as {
          transformStack: transformStack;
        }
      ).transformStack.stack[0].transformMatrix ||
        new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1])) as Float32Array;

      let controls = this.#advInfo.controls as controlsParams;

      controls.optimizationTechnique !== 'preComputeFrames' &&
        (controls.optimizationTechnique = choosePivotAwareOptimization(
          this.#finalGeometry
        ));

      let optimizationTechnique = controls.optimizationTechnique as opt;

      // step 9 a - computing pre Frames  according to the all user given parameters
      // ////console.log('step 9 a -', this.#initialGeometry, this.#finalGeometry);
      optimizationTechnique == 'preComputeFrames' &&
        ((this.#preComputeFranesOrPolynomial = precomputeFramesRaw(
          this.#initialGeometry,
          this.#finalGeometry,
          baseTransformationMatrix,
          100,
          this.#el.createTransformMatrix.bind(this.#el)
        )) as optFuncType,
        (this.#interpolateFunction = setPreComputedFrame));

      // step 9 b - computing polynomial fit coefficients according to the all given user parameters
      optimizationTechnique == 'fitPolynomialCofficient' &&
        ((this.#preComputeFranesOrPolynomial = fitTransformPolynomialsFast(
          this.#initialGeometry,
          this.#finalGeometry,
          baseTransformationMatrix
        )),
        (this.#interpolateFunction = transformUsingPolynomialFast));

      // step 10 - final step is launching animation which using start function

      if (start && !this.#animationState) {
        //console.log('auto started animation');
        //	 this.#animationState = true;
        return this.start();
      }
    }

    #styleLerp() {
      const [f, s] = ['fill', 'stroke'];
      f in this.#finalStyle &&
        (((this.#initialStyle as any)[f] = this.#el.attrs(f)),
        this.#lerpColor(f, this.#finalStyle as object),
        this.#lerpColor(f, this.#initialStyle as object));

      s in this.#finalStyle &&
        (((this.#initialStyle as any)[s] = this.#el.attrs(s)),
        this.#lerpColor(s, this.#finalStyle as object),
        this.#lerpColor(s, this.#initialStyle as object));
    }

    #reverseAnimationProps() {
      for (const k in this.#finalGeometry) {
        if (
          !Object.prototype.hasOwnProperty.call(this.#finalGeometry, k) ||
          k == 'Scale'
        )
          continue;

        k == 'Rotate' &&
          (this.#finalGeometry[k] = (this.#finalGeometry[k] as number) * -1);

        Array.isArray(this.#finalGeometry[k as TGWPkeys] as NumberType) &&
          (((this.#finalGeometry[k as TGWPkeys] as NumberType)[0] *= -1),
          ((this.#finalGeometry[k as TGWPkeys] as NumberType)[1] *= -1));
      }
    }

    #resolvePivot(): [boolean, modes] {
      const pivot = this.#advInfo.pivot as pivotParams;
      pivot.mode = pivot.mode as modes;

      // --- Get object bounding info ---
      const N = this.#sharedSMatrix.length;
      const OBB = (this?.getBBox() as { matrix: number[][] }).matrix; // last 12 elements

      // --- Check if translation exists ---
      const { Translate } = this.#finalGeometry as TransformGeometryWithPivot;

      let isT = Translate[0] !== 0 || Translate[1] !== 0;
      let isTranslation = false;

      if (isT) {
        // Translation exists → translation dominates all pivots
        isTranslation = true;

        // Ensure pivot mode is suitable for translation
        !['r', 'relative', 'c', 'center'].includes(pivot.mode) &&
          (pivot.mode = 'r');

        // Set all transformation pivots to translation pivot
        const pv = pivotSetter(pivot.mode, OBB);
        pivot.rotatePivot = pv;
        pivot.scalePivot = pv;
        pivot.skewPivot = pv;
        ////console.log(pivot);
      } else {
        // No translation → allow separate pivots
        pivot.mode = 'p';

        // --- Common pivot has the highest priority ---
        const cp = pivot.commonPivot;
        if (cp) {
          let cpResolved!: [number, number];
          Array.isArray(cp) &&
            (cp[0] !== 0 || cp[1] !== 0) &&
            (cpResolved = cp as [number, number]);
          typeof cp === 'string' &&
            (cpResolved = pivotSetter(cp as anchors, OBB));
          // Apply common pivot to all transformations
          cpResolved &&
            ((pivot.rotatePivot ??= cpResolved),
            (pivot.scalePivot ??= cpResolved),
            (pivot.skewPivot ??= cpResolved));
        } else {
          // --- Resolve separate pivots individually if common pivot not provided ---

          // Rotate pivot
          if (
            pivot.rotatePivot &&
            (!Array.isArray(pivot.rotatePivot) ||
              (pivot.rotatePivot[0] === 0 && pivot.rotatePivot[1] === 0))
          ) {
            (typeof pivot.rotatePivot === 'string' &&
              (pivot.rotatePivot = pivotSetter(
                pivot.rotatePivot as anchors,
                OBB
              ))) ||
              (pivot.rotatePivot = [0, 0]);
          }

          // Scale pivot
          if (
            pivot.scalePivot &&
            (!Array.isArray(pivot.scalePivot) ||
              (pivot.scalePivot[0] === 0 && pivot.scalePivot[1] === 0))
          ) {
            (typeof pivot.scalePivot === 'string' &&
              (pivot.scalePivot = pivotSetter(
                pivot.scalePivot as anchors,
                OBB
              ))) ||
              (pivot.scalePivot = [0, 0]);
          }

          // Skew pivot
          if (
            pivot.skewPivot &&
            (!Array.isArray(pivot.skewPivot) ||
              (pivot.skewPivot[0] === 0 && pivot.skewPivot[1] === 0))
          ) {
            (typeof pivot.skewPivot === 'string' &&
              (pivot.skewPivot = pivotSetter(
                pivot.skewPivot as anchors,
                OBB
              ))) ||
              (pivot.skewPivot = [0, 0]);
          }
        }
      }

      // --- Return translation existence and resolved pivot mode ---
      return [isTranslation, pivot.mode as modes];
    }

    //+++++++++++++++++++++++++++
    // Function to generate control points on curve and store to use in animation
    //+++++++++++++++++++++++++++

    #preComputeCurvePath(translateMode: modes) {
      const curve = this.#advInfo.curve as curveParams;

      !curve.curvePathMotion && (curve.curvePathMotion = true); // translation is available but user not given the curve path motion through for following curve

      curve.stepness == 0 && (curve.curvePath = 'linear'); // even though animation following curve but stiffness is zero then it will be directly linear path and even though stiffness is given but karo path not then by default it is also linear

      // const { p1, p2 } = this.#getControlPointsOfCurve(translateMode as string);

      // --- Get object bounding info ---

      const OBB = (this.#el.getBBox() as { matrix: number[][] }).matrix;
      const [tx, ty] = this.#finalGeometry.Translate as number[];
      [this.#curvePoints, this.#arcTable, this.#totalLength] =
        generateCurvePoints({
          P1: { x: 0, y: 0 },
          P2: { x: tx, y: ty },
          bend: (curve.stepness as number) * -1,
          smoothness: curve.smoothness,
          curveName: curve.curvePath as CurveType,
          pointsOnly: false,
          continuous: false,
          continuousCount: 1
        }) as [Point[], ArcTableEntry[], number];

      const p = { px: 0, py: 0 };

      const mode =
        translateMode == 'r' || translateMode == 'relative' ? 'TL' : 'C';

      /*
    if (translateMode == 'r' || translateMode == 'relative') {
      [p.px, p.py] = pivotSetter('TL', OBB);
    } else if (translateMode == 'c' || translateMode == 'center') {
      [p.px, p.py] = pivotSetter('C', OBB);
    }
*/
      [p.px, p.py] = pivotSetter(mode, OBB);
      this.#curveFormation(this.#elFig, this.#curvePoints, p);

      /*
    console.log(
      ' curve point =  ',
      this.#curvePoints,
      this.#arcTable,
      this.#totalLength
    );
		*/
    }

    //+++++++++++++++++++++++++++
    // Function to get absolute  control points of curve to create curve in between that two points
    //+++++++++++++++++++++++++++
    /*
  #getControlPointsOfCurve(mode: string): { p1: Point; p2: Point } {
    let p1: Point = { x: 0, y: 0 },
      p2: Point = { x: 0, y: 0 };

    const [tx, ty] = this.#finalGeometry.Translate as number[];

    // the curve will form from 0 , 0  to the translation point which is relative to the shape
    // the curve will form from 0 0 to the translation point  with offset of shape shape top left to shape center

    (mode == 'r' || mode == 'relative' || mode == 'c' || mode == 'center') &&
      ((p1 = {
        x: 0,
        y: 0
      }),
      // translation point where we want to translate
      (p2 = {
        x: tx,
        y: ty
      }));

    return { p1, p2 };
  }
*/

    #lerpColor(p: string, o: object) {
      const isP = typeof o == 'object' && p in o;
      const lp = isP ? (o as any)[p] : 'none';
      const colorTest = new Colors('none');

      isP && ((o as any)[p] = colorTest.parseColor(lp));
    }

    //+++++++++++++++++++++++++++
    // specific to scale acording to shapes dimensions
    //+++++++++++++++++++++++++++

    #scaleConvertion(prop: string, v: number): number {
      const geom = (this.geometry as any)?.[prop] || 1;
      return v / geom;
    }

    //+++++++++++++++++++++++++++
    // Function  to associate all shapes different properties to accumulation of properties
    //+++++++++++++++++++++++++++

    #associate(gProps: IcommonGeometryAnimatableProperties) {
      'translate' in gProps &&
        (this.#finalGeometry.Translate = [
          gProps?.translate?.x || 0,
          gProps?.translate?.y || 0
        ]);
      'rotate' in gProps &&
        (this.#finalGeometry.Rotate = gProps?.rotate?.angle || 0);

      'scale' in gProps &&
        (this.#finalGeometry.Scale = [
          gProps?.scale?.sx || 0,
          gProps?.scale?.sy || 0
        ]);

      'skew' in gProps &&
        (this.#finalGeometry.Skew = [
          gProps?.skew?.sx || 0,
          gProps?.skew?.sy || 0
        ]);

      for (let k in gProps) {
        const isTeansforms =
          k == 'translate' || k == 'rotate' || k == 'scale' || k == 'skew';
        if (!gProps.hasOwnProperty(k) || isTeansforms) continue;
        const v = (gProps as any)[k];

        if (
          map[(tx.includes(k) ? k : 'not') as keyof typeof map] === 'Translate'
        ) {
          this.#finalGeometry.Translate[0] += v;
          continue;
        }
        if (
          map[(ty.includes(k) ? k : 'not') as keyof typeof map] === 'Translate'
        ) {
          this.#finalGeometry.Translate[1] += v;
          continue;
        }

        if (map[(sx.includes(k) ? k : 'not') as keyof typeof map] === 'Scale') {
          this.#finalGeometry.Scale[0] += this.#scaleConvertion(k, v);
          continue;
        }

        if (map[(sy.includes(k) ? k : 'not') as keyof typeof map] === 'Scale') {
          this.#finalGeometry.Scale[1] += this.#scaleConvertion(k, v);
        }
      }

      this.#finalGeometry.Scale[0] == 0 && (this.#finalGeometry.Scale[0] = 1);
      this.#finalGeometry.Scale[1] == 0 && (this.#finalGeometry.Scale[1] = 1);
    }
  }

  return Animatable as unknown as abstract new (
    ...args: ConstructorParameters<TBase>
  ) => InstanceType<TBase> & Animatable;
}
//++++++++++++++++++++++++++++++++++++
// GroupAnimation Class
// Optimized single RAF loop for multiple child shapes
//++++++++++++++++++++++++++++++++++++
//++++++++++ Very Important ++++++++++

/*
class GroupAnimation {
  #children: ShapeAnimation[] = [];   // children shape animators
  #startTime = 0;
  #elapsedTime = 0;
  #progress = 0;
  #duration: number;
  #animationState = false;
  #animationFrameId: number | null = null;
  #completionPromise: Promise<void> | null = null;
  #completionResolve: (() => void) | null = null;

  constructor(children: ShapeAnimation[], duration: number) {
    this.#children = children;
    this.#duration = duration;
  }

  //+++++++++++++++++++++++++++
  // Start Group Animation
  //+++++++++++++++++++++++++++
  public start(): Promise<void> | void {
    if (this.#animationState) return this.#completionPromise ?? Promise.resolve();

    this.#startTime = performance.now();
    this.#elapsedTime = 0;
    this.#animationState = true;

    this.#completionPromise = new Promise((resolve) => {
      this.#completionResolve = resolve;
    });

    this.#requestNextFrame();

    return this.#completionPromise;
  }

  //+++++++++++++++++++++++++++
  // Pause Group Animation
  //+++++++++++++++++++++++++++
  public pause(): void {
    if (!this.#animationState) return; // already paused

    this.#elapsedTime = performance.now() - this.#startTime;
    this.#animationState = false;

    this.#animationFrameId && cancelAnimationFrame(this.#animationFrameId);
    this.#animationFrameId = null;

    // apply final transform to all children so they "freeze"
    this.#children.forEach((c) => c['#applyFinalTransformationMatrix']?.(this.#progress));
  }

  //+++++++++++++++++++++++++++
  // Resume Group Animation
  //+++++++++++++++++++++++++++
  public resume(): Promise<void> {
    if (this.#animationState) return this.#completionPromise ?? Promise.resolve();

    this.#startTime = performance.now() - this.#elapsedTime;
    this.#animationState = true;

    this.#completionPromise = new Promise((resolve) => {
      this.#completionResolve = resolve;
    });

    this.#requestNextFrame();
    return this.#completionPromise;
  }

  //+++++++++++++++++++++++++++
  // Internal frame driver
  //+++++++++++++++++++++++++++
  #requestNextFrame() {
    this.#animationFrameId = requestAnimationFrame(this.#update.bind(this));
  }

  #update(now: number) {
    if (!this.#animationState) return;

    this.#elapsedTime = now - this.#startTime;
    this.#progress = Math.min(this.#elapsedTime / this.#duration, 1);

    // Shared progress computed ONCE here ⬇️
    // Then delegated to all children without re-running RAF
    this.#children.forEach((c) => c['#applyFinalTransformationMatrix']?.(this.#progress));

    if (this.#progress < 1) {
      this.#requestNextFrame();
    } else {
      this.#animationState = false;
      this.#completionResolve?.();
    }
  }
}
*/
