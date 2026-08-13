import "../env.global.js"; // Must be imported first.

/* -------------------------------------------------------------------------- */
/*                                Core Modules                                */
/* -------------------------------------------------------------------------- */

import { Canvas } from "../systems/canvas/canvas.js";

/* -------------------------------------------------------------------------- */
/*                                   Shapes                                   */
/* -------------------------------------------------------------------------- */

import { Line } from "../graphics/shapes/primitives/line.js";
import { Point } from "../graphics/shapes/primitives/point.js";
import { Circle } from "../graphics/shapes/primitives/circle.js";
import { Ellipse } from "../graphics/shapes/primitives/ellipse.js";
import { Rect } from "../graphics/shapes/primitives/rectangle.js";
import { Polyline } from "../graphics/shapes/primitives/polyline.js";
import { Polygon } from "../graphics/shapes/primitives/polygon.js";

import { ArcCurve } from "../graphics/shapes/curves/arc-curve.js";
import { QuadraticCurve } from "../graphics/shapes/curves/quadratic-curve.js";
import { CubicCurve } from "../graphics/shapes/curves/cubic-curve.js";
import { EarcCurve } from "../graphics/shapes/curves/earc-curve.js";

/* -------------------------------------------------------------------------- */
/*                                    Media                                   */
/* -------------------------------------------------------------------------- */

import { Image } from "../graphics/media/image.js";
import { Text } from "../graphics/media/text.js";

/* -------------------------------------------------------------------------- */
/*                                 Containers                                 */
/* -------------------------------------------------------------------------- */

import { Group } from "../graphics/container/group/group.js";

/**
 * The root namespace of the ShantanuJS library.
 *
 * Provides access to the complete public API including the rendering
 * canvas, drawable shapes, media elements, and container objects.
 *
 * @example
 * ```ts
 * const canvas = new ShantanuJS.Canvas(...);
 * const rect = new ShantanuJS.Shapes.Rect(...);
 * ```
 */
export const ShantanuJS = {
  /**
   * Root rendering surface.
   */
  Canvas,

  /**
   * Collection of all built-in geometric shapes.
   */
  Shapes: {
    Line,
    Point,
    Circle,
    Ellipse,
    Rect,
    Polyline,
    Polygon,
    QuadraticCurve,
    CubicCurve,
    ArcCurve,
    EarcCurve,
  },

  /**
   * Collection of media elements.
   */
  Media: {
    Text,
    Image,
  },

  /**
   * Container for grouping multiple graphics.
   */
  Group,
} as const;

/**
 * Type namespace for the public ShantanuJS API.
 *
 * This namespace exposes strongly typed aliases for all public classes,
 * allowing consumers to reference instance types without using
 * `InstanceType<typeof ...>` throughout their code.
 *
 * @example
 * ```ts
 * let canvas: ShantanuJS.Canvas;
 * let rect: ShantanuJS.Shapes.Rect;
 * let text: ShantanuJS.Media.Text;
 * let group: ShantanuJS.Group;
 * ```
 */
export namespace ShantanuJS {
  /**
   * Canvas instance.
   */
  export type Canvas = InstanceType<typeof ShantanuJS.Canvas>;

  /**
   * Shape instance types.
   */
  export namespace Shapes {
    /** Line instance. */
    export type Line = InstanceType<typeof ShantanuJS.Shapes.Line>;

    /** Point instance. */
    export type Point = InstanceType<typeof ShantanuJS.Shapes.Point>;

    /** Circle instance. */
    export type Circle = InstanceType<typeof ShantanuJS.Shapes.Circle>;

    /** Ellipse instance. */
    export type Ellipse = InstanceType<typeof ShantanuJS.Shapes.Ellipse>;

    /** Rectangle instance. */
    export type Rect = InstanceType<typeof ShantanuJS.Shapes.Rect>;

    /** Polyline instance. */
    export type Polyline = InstanceType<typeof ShantanuJS.Shapes.Polyline>;

    /** Polygon instance. */
    export type Polygon = InstanceType<typeof ShantanuJS.Shapes.Polygon>;

    /** Quadratic Bézier curve instance. */
    export type QuadraticCurve = InstanceType<
      typeof ShantanuJS.Shapes.QuadraticCurve
    >;

    /** Cubic Bézier curve instance. */
    export type CubicCurve = InstanceType<typeof ShantanuJS.Shapes.CubicCurve>;

    /** Circular arc curve instance. */
    export type ArcCurve = InstanceType<typeof ShantanuJS.Shapes.ArcCurve>;

    /** Elliptical arc curve instance. */
    export type EarcCurve = InstanceType<typeof ShantanuJS.Shapes.EarcCurve>;
  }

  /**
   * Media instance types.
   */
  export namespace Media {
    /** Text instance. */
    export type Text = InstanceType<typeof ShantanuJS.Media.Text>;

    /** Image instance. */
    export type Image = InstanceType<typeof ShantanuJS.Media.Image>;
  }

  /**
   * Group container instance.
   */
  export type Group = InstanceType<typeof ShantanuJS.Group>;
}
