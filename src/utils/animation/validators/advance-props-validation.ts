import {
  InvalidFormatError,
  InvalidOptionError,
  MissingRequiredAnimationParameterError,
  OutOfRangeError,
  TypeMismatchError
} from '../../../errors/index.js';
import type {
  AnimationControls,
  OptimizationTechnique
} from '../../../models/types/animation/control';
import type {
  CurveMotionOptions,
  PhysicsOptions
} from '../../../models/types/animation/motion';
import type { AdvancedAnimationOptions } from '../../../models/types/animation/options';
import type { PivotOptions } from '../../../models/types/animation/pivot';
import type {
  Pivot,
  PivotAnchors
} from '../../../models/types/geometry/anchors';
import { PATHS_MAP } from '../../geometry/curves/curve-utils.js';
import {
  ANCHORS_MAP,
  MODES_MAP
} from '../../geometry/pivot-resolution/pivot-utils.js';
import { DIRECTIONS_MAP, OPT_MAP } from '../animation-constants.js';

import { deepMerge } from '../animation-utils.js';
/**
 * Validates and applies advanced animation properties.
 *
 * Purpose:
 * - Validates all advanced animation configuration sections.
 * - Delegates validation responsibility to specialized validators.
 * - Mutates the default configuration only after all validations succeed.
 *
 * Validation Domains:
 * - curve
 * - physics
 * - pivot
 * - controls
 *
 * @param defaultOne - Default advanced animation configuration
 * @param userOne - User-provided partial advanced configuration
 */
export function advancePropsValidation(
  defaultOne: AdvancedAnimationOptions,
  userOne: Partial<AdvancedAnimationOptions> | null
): void {
  if (userOne === null) return;

  validateAdvancePropsObject(userOne);

  validateCurveProps(userOne);
  validatePhysicsProps(userOne);
  validatePivotProps(userOne);
  validateControlsProps(userOne);

  deepMerge(defaultOne, userOne);
}

/* -------------------------------------------------------------------------- */
/*                               ROOT VALIDATION                              */
/* -------------------------------------------------------------------------- */

/**
 * Validates the root advanced animation configuration object.
 *
 * Purpose:
 * - Ensures the provided value is a valid object.
 * - Prevents invalid primitive values from entering validation flow.
 *
 * @param userOne - User-provided advanced animation configuration
 */
function validateAdvancePropsObject(
  userOne: Partial<AdvancedAnimationOptions>
): void {
  if (typeof userOne !== 'object') {
    throw new TypeMismatchError(
      'AdvanceOption',
      typeof userOne,
      'object',
      'Animation.animate()'
    );
  }
}

/* -------------------------------------------------------------------------- */
/*                               CURVE VALIDATION                             */
/* -------------------------------------------------------------------------- */

/**
 * Validates curve animation configuration.
 *
 * Purpose:
 * - Validates curve object structure.
 * - Ensures curve path configuration is valid.
 * - Validates curve motion dependencies.
 * - Validates stepness requirements.
 *
 * @param userOne - User-provided advanced animation configuration
 */
function validateCurveProps(userOne: Partial<AdvancedAnimationOptions>): void {
  if (!('curve' in userOne) || userOne.curve === undefined) {
    return;
  }

  const curve = userOne.curve;

  validateCurveObject(curve);
  validateCurveNotEmpty(curve);
  validateCurvePath(curve);
  validateCurveMotion(curve);
  validateCurveCurvatureSamples(curve);
}

/**
 * Validates curve object type.
 *
 * @param curve - Curve configuration object
 */
function validateCurveObject(curve: NonNullable<CurveMotionOptions>): void {
  if (curve === null || typeof curve !== 'object') {
    throw new TypeMismatchError(
      'curve',
      typeof curve,
      'object',
      'Animation.animate()'
    );
  }
}

/**
 * Ensures curve object is not empty.
 *
 * @param curve - Curve configuration object
 */
function validateCurveNotEmpty(curve: NonNullable<CurveMotionOptions>): void {
  if (Object.keys(curve).length === 0) {
    throw new InvalidOptionError(
      'curve',
      'empty object',
      ['path', 'enabled', 'stepness', 'smoothness'],
      'Animation.animate()'
    );
  }
}

/**
 * Validates curve path configuration.
 *
 * @param curve - Curve configuration object
 */
function validateCurvePath(curve: NonNullable<CurveMotionOptions>): void {
  if (!('path' in curve) || typeof curve.path !== 'string') {
    throw new MissingRequiredAnimationParameterError(
      'curve.path',
      'Animation.animate()'
    );
  }

  if (!PATHS_MAP.includes(curve.path)) {
    throw new InvalidOptionError(
      'curve.path',
      curve.path,
      PATHS_MAP,
      'Animation.animate()'
    );
  }
}

/**
 * Validates curve motion dependency.
 *
 * Purpose:
 * - Ensures non-linear curves explicitly enable curvePathMotion.
 *
 * @param curve - Curve configuration object
 */
function validateCurveMotion(curve: NonNullable<CurveMotionOptions>): void {
  if (curve.path === 'linear') {
    return;
  }

  if (curve.enabled !== true) {
    throw new MissingRequiredAnimationParameterError(
      'curve.enabled',
      'Animation.animate()'
    );
  }
}

/**
 * Validates curve stepness configuration.
 *
 * Purpose:
 * - Ensures non-linear curves provide numeric stepness.
 *
 * @param curve - Curve configuration object
 */
function validateCurveCurvatureSamples(
  curve: NonNullable<CurveMotionOptions>
): void {
  if (curve.path === 'linear') {
    return;
  }

  if (typeof curve.curvature !== 'number') {
    throw new TypeMismatchError(
      'curve.stepness',
      typeof curve.curvature,
      'number',
      'Animation.animate()'
    );
  }

  if (typeof curve.samples !== 'number') {
    throw new TypeMismatchError(
      'curve.stepness',
      typeof curve.samples,
      'number',
      'Animation.animate()'
    );
  }
}

/* -------------------------------------------------------------------------- */
/*                              PHYSICS VALIDATION                            */
/* -------------------------------------------------------------------------- */

/**
 * Validates physics animation configuration.
 *
 * Purpose:
 * - Validates physics object structure.
 * - Validates speed configuration.
 * - Validates physics motion dependencies.
 *
 * @param userOne - User-provided advanced animation configuration
 */
function validatePhysicsProps(
  userOne: Partial<AdvancedAnimationOptions>
): void {
  if (!('physics' in userOne) || userOne.physics === undefined) {
    return;
  }

  const physics = userOne.physics;

  validatePhysicsObject(physics);
  validatePhysicsSpeed(physics);
  validatePhysicsMotion(physics);
}

/**
 * Validates physics object type.
 *
 * @param physics - Physics configuration object
 */
function validatePhysicsObject(physics: NonNullable<PhysicsOptions>): void {
  if (physics === null || typeof physics !== 'object') {
    throw new TypeMismatchError(
      'physics',
      typeof physics,
      'object',
      'Animation.animate()'
    );
  }
}

/**
 * Validates physics speed configuration.
 *
 * @param physics - Physics configuration object
 */
function validatePhysicsSpeed(physics: NonNullable<PhysicsOptions>): void {
  if (!('speed' in physics)) {
    return;
  }

  if (typeof physics.speed !== 'number') {
    throw new TypeMismatchError(
      'physics.speed',
      typeof physics.speed,
      'number',
      'Animation.animate()'
    );
  }

  if (physics.speed < 0.02 || physics.speed > 5) {
    throw new OutOfRangeError(physics.speed, 0.02, 5, 'Animation.animate()');
  }
}

/**
 * Validates physics motion dependency.
 *
 * Purpose:
 * - Ensures physicsMotion is enabled when speed is provided.
 *
 * @param physics - Physics configuration object
 */
function validatePhysicsMotion(physics: NonNullable<PhysicsOptions>): void {
  if (!physics.speed) {
    return;
  }

  if (physics.enabled !== true) {
    throw new MissingRequiredAnimationParameterError(
      'physics.enabled',
      'Animation.animate()'
    );
  }
}

/* -------------------------------------------------------------------------- */
/*                               PIVOT VALIDATION                             */
/* -------------------------------------------------------------------------- */

/**
 * Validates pivot animation configuration.
 *
 * Purpose:
 * - Validates pivot object structure.
 * - Validates pivot mode values.
 * - Validates anchor configurations.
 * - Validates coordinate tuple formats.
 *
 * @param userOne - User-provided advanced animation configuration
 */
function validatePivotProps(userOne: Partial<AdvancedAnimationOptions>): void {
  if (!('pivots' in userOne) || userOne.pivots === undefined) {
    return;
  }

  const pivots = userOne.pivots as PivotOptions;

  validatePivotObject(pivots);

  for (const [key, value] of Object.entries(pivots)) {
    validatePivotEntry(key, value);
  }
}

/**
 * Validates pivot object type.
 *
 * @param pivot - Pivot configuration object
 */
function validatePivotObject(pivot: NonNullable<PivotOptions>): void {
  if (pivot === null || typeof pivot !== 'object') {
    throw new TypeMismatchError(
      'pivot',
      typeof pivot,
      'object',
      'Animation.animate()'
    );
  }
}

/**
 * Validates individual pivot entry.
 *
 * @param key - Pivot property name
 * @param value - Pivot property value
 */
function validatePivotEntry(
  key: string,
  value: string | Pivot | PivotAnchors
): void {
  if (key === 'mode') {
    validatePivotMode(value as string);
    return;
  }

  if (typeof value == 'object') {
    validatePivotCoordinate(value as Pivot);
    return;
  }

  validatePivotAnchor(key, value as PivotAnchors);
}

/**
 * Validates pivot mode option.
 *
 * @param value - Pivot mode value
 */
function validatePivotMode(value: string): void {
  if (typeof value !== 'string' || !MODES_MAP.includes(value)) {
    throw new InvalidOptionError(
      'pivot.mode',
      String(value),
      MODES_MAP,
      'Animation.animate()'
    );
  }
}

/**
 * Validates pivot coordinate tuple.
 *
 * @param value - Coordinate tuple
 */
function validatePivotCoordinate(pivot: Pivot): void {
  if (
    'px' in pivot &&
    'py' in pivot &&
    typeof pivot.px === 'number' &&
    typeof pivot.py === 'number'
  ) {
    return;
  } else {
    throw new InvalidFormatError(
      pivot,
      '{ px: number, py: number }',
      'Animation.animate()'
    );
  }
}

/**
 * Validates pivot anchor option.
 *
 * @param key - Pivot property name
 * @param value - Pivot property value
 */
function validatePivotAnchor(key: string, value: PivotAnchors): void {
  if (typeof value !== 'string') {
    throw new TypeMismatchError(
      `pivot.${key}`,
      typeof value,
      ' string | { px : number, py : number }',
      'Animation.animate()'
    );
  }

  if (!ANCHORS_MAP.includes(value)) {
    throw new InvalidOptionError(
      `pivot.${key}`,
      value,
      ANCHORS_MAP,
      'Animation.animate()'
    );
  }
}

/* -------------------------------------------------------------------------- */
/*                             CONTROLS VALIDATION                            */
/* -------------------------------------------------------------------------- */

/**
 * Validates animation control configuration.
 *
 * Purpose:
 * - Validates controls object structure.
 * - Validates loop configuration.
 * - Validates direction configuration.
 * - Validates optimization technique configuration.
 *
 * @param userOne - User-provided advanced animation configuration
 */
function validateControlsProps(
  userOne: Partial<AdvancedAnimationOptions>
): void {
  if (!('controls' in userOne) || userOne.controls === undefined) {
    return;
  }

  const controls = userOne.controls as AnimationControls;

  validateControlsObject(controls);
  validateControlsLoop(controls);
  validateControlsDirection(controls);
  validateControlsOptimization(controls);
}

/**
 * Validates controls object type.
 *
 * @param controls - Controls configuration object
 */
function validateControlsObject(
  controls: NonNullable<AnimationControls>
): void {
  if (controls === null || typeof controls !== 'object') {
    throw new TypeMismatchError(
      'controls',
      typeof controls,
      'object',
      'Animation.animate()'
    );
  }
}

/**
 * Validates controls loop configuration.
 *
 * @param controls - Controls configuration object
 */
function validateControlsLoop(controls: NonNullable<AnimationControls>): void {
  if ('loop' in controls && typeof controls.loop !== 'boolean') {
    throw new TypeMismatchError(
      'controls.loop',
      typeof controls.loop,
      'boolean',
      'Animation.animate()'
    );
  }
}

/**
 * Validates controls direction configuration.
 *
 * @param controls - Controls configuration object
 */
function validateControlsDirection(
  controls: NonNullable<AnimationControls>
): void {
  if (
    'direction' in controls &&
    (typeof controls.direction !== 'string' ||
      !DIRECTIONS_MAP.includes(controls.direction))
  ) {
    throw new InvalidOptionError(
      'controls.direction',
      String(controls.direction),
      DIRECTIONS_MAP,
      'Animation.animate()'
    );
  }
}

/**
 * Validates controls optimization configuration.
 *
 * @param controls - Controls configuration object
 */
function validateControlsOptimization(
  controls: NonNullable<AnimationControls>
): void {
  if (
    'optimizationTechnique' in controls &&
    OPT_MAP.includes(controls.optimizationTechnique as OptimizationTechnique)
  ) {
    throw new InvalidOptionError(
      'controls.optimizationTechnique',
      String(controls.optimizationTechnique),
      OPT_MAP,
      'Animation.animate()'
    );
  }
}
