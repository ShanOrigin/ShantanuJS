import '../env.global.js'; // MUST be first line

// importing canvas classes
import Canvas from '../core/provider/canvas.js';

import {
  Point,
  Line,
  Polyline,
  Polygon,
  Rect,
  Circle,
  Ellipse,
  Text,
  Image,
  CubicCurve,
  QuadraticCurve,
  ArcCurve,
  EarcCurve
} from '../shapes/provider/shapes.js';
import { Group } from '../shapes/group/Group.js';

export const ShantanuJS = {
  Canvas,

  // Organized Shapes
  Shapes: {
    Basic: {
      Rect,
      Circle,
      Ellipse,
      Line,
      Polygon,
      Polyline,
      Point
      //    Path
    },
    Custom: {
      //      Triangle,
      QuadraticCurve,
      CubicCurve,
      ArcCurve,
      EarcCurve
    },
    Media: {
      Text,
      Image
      //      Video
    }
  },
  Semantics: {
    Group
  }

  // Math utilities (for geometry/trig ops)
  //   Math: {
  //     Vector2,
  //     Matrix2D,
  //     Angle,
  //     Distance,
  //     Projection,
  //     Trig: {
  //       sin: Math.sin,
  //       cos: Math.cos,
  //       tan: Math.tan,
  //       degToRad,
  //       radToDeg
  //     }
  //   },
  //
  // Semantics layer (meta meaning)

  // Physics (placeholder for future)
  //  Physics: {}
} as const;

export namespace ShantanuJS {
  // === Core ===
  export type Canvas = InstanceType<typeof ShantanuJS.Canvas>;

  // === Shapes.Basic ===
  export namespace Shapes {
    export namespace Basic {
      export type Rect = InstanceType<typeof ShantanuJS.Shapes.Basic.Rect>;
      export type Circle = InstanceType<typeof ShantanuJS.Shapes.Basic.Circle>;
      export type Ellipse = InstanceType<
        typeof ShantanuJS.Shapes.Basic.Ellipse
      >;
      export type Line = InstanceType<typeof ShantanuJS.Shapes.Basic.Line>;
      export type Polygon = InstanceType<
        typeof ShantanuJS.Shapes.Basic.Polygon
      >;
      export type Polyline = InstanceType<
        typeof ShantanuJS.Shapes.Basic.Polyline
      >;
      export type Point = InstanceType<typeof ShantanuJS.Shapes.Basic.Point>;
      //    export type Path = InstanceType<typeof ShantanuJS.Shapes.Basic.Path>;
    }

    // === Shapes.Custom ===
    export namespace Custom {
      //   export type Triangle = InstanceType<typeof ShantanuJS.Shapes.Custom.Triangle>;
      export type QuadraticCurve = InstanceType<
        typeof ShantanuJS.Shapes.Custom.QuadraticCurve
      >;
      export type CubicCurve = InstanceType<
        typeof ShantanuJS.Shapes.Custom.CubicCurve
      >;
      export type ArcCurve = InstanceType<
        typeof ShantanuJS.Shapes.Custom.ArcCurve
      >;
      export type EarcCurve = InstanceType<
        typeof ShantanuJS.Shapes.Custom.EarcCurve
      >;
    }

    // === Shapes.Media ===
    export namespace Media {
      export type Text = InstanceType<typeof ShantanuJS.Shapes.Media.Text>;
      export type Image = InstanceType<typeof ShantanuJS.Shapes.Media.Image>;
      //     export type Video = InstanceType<typeof ShantanuJS.Shapes.Media.Video>;
    }
  }

  //   // === Math ===
  //   export namespace Math {
  //     export type Vector2 = InstanceType<typeof ShantanuJS.Math.Vector2>;
  //     export type Matrix2D = InstanceType<typeof ShantanuJS.Math.Matrix2D>;
  //     export type Angle = ReturnType<typeof ShantanuJS.Math.Angle>;
  //     export type Distance = ReturnType<typeof ShantanuJS.Math.Distance>;
  //   }
  //
  //   // === Semantics ===
  export namespace Semantics {
    //     export type Tag = InstanceType<typeof ShantanuJS.Semantics.Tag>;
    //     export type Layer = InstanceType<typeof ShantanuJS.Semantics.Layer>;
    export type Group = InstanceType<typeof ShantanuJS.Semantics.Group>;
    //     export type State = InstanceType<typeof ShantanuJS.Semantics.State>;
    //     export type ObjectType = ReturnType<typeof ShantanuJS.Semantics.ObjectType>;
  }

  //
}
