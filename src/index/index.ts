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
  //  Triangle,
  Text,
  Image,
  Curve,
  CubicCurve,
  QuadraticCurve,
  ArcCurve,
  EarcCurve
} from '../shapes/provider/shapes.js';
/*
export const Shantanu = {
  Canvas,
  // basic shapes
  Rect,
  Circle,
  Line,
  Ellipse,
  Point,
  Polyline,
  Polygon,
  //  Path,
  // custom shapes
  Shapes: {
    Basic: {
      Circle,
      Line,
      Ellipse,
      Point,
      Polyline,
      Polygon
      //      Path
    },
    Custom: {
      Curve,
      QuadraticCurve,
      CubicCurve,
      ArcCurve,
      EarcCurve
      //      Triangle
    },
    Media: {
      Text
    }
  },
  // media elements
  Text
  // Image
} as const;

// Now export types that map cleanly
export namespace Shantanu {
  export type Canvas = InstanceType<typeof Shantanu.Canvas>;
  export type Rect = InstanceType<typeof Shantanu.Rect>;
  export type Circle = InstanceType<typeof Shantanu.Circle>;
  export type Line = InstanceType<typeof Shantanu.Line>;
  export type Ellipse = InstanceType<typeof Shantanu.Ellipse>;
  export type Point = InstanceType<typeof Shantanu.Point>;
  export type Polyline = InstanceType<typeof Shantanu.Polyline>;
  export type Polygon = InstanceType<typeof Shantanu.Polygon>;

  export type Text = InstanceType<typeof Shantanu.Text>;
}

export type ShantanuTypes = typeof Shantanu;
*/

export const Shantanu = {
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
  //   // Semantics layer (meta meaning)
  //   Semantics: {
  //     Group
  //   },
  //
  // Physics (placeholder for future)
  //  Physics: {}
} as const;

export namespace Shantanu {
  // === Core ===
  export type Canvas = InstanceType<typeof Shantanu.Canvas>;

  // === Shapes.Basic ===
  export namespace Shapes {
    export namespace Basic {
      export type Rect = InstanceType<typeof Shantanu.Shapes.Basic.Rect>;
      export type Circle = InstanceType<typeof Shantanu.Shapes.Basic.Circle>;
      export type Ellipse = InstanceType<typeof Shantanu.Shapes.Basic.Ellipse>;
      export type Line = InstanceType<typeof Shantanu.Shapes.Basic.Line>;
      export type Polygon = InstanceType<typeof Shantanu.Shapes.Basic.Polygon>;
      export type Polyline = InstanceType<
        typeof Shantanu.Shapes.Basic.Polyline
      >;
      export type Point = InstanceType<typeof Shantanu.Shapes.Basic.Point>;
      //    export type Path = InstanceType<typeof Shantanu.Shapes.Basic.Path>;
    }

    // === Shapes.Custom ===
    export namespace Custom {
      //   export type Triangle = InstanceType<typeof Shantanu.Shapes.Custom.Triangle>;
      export type QuadraticCurve = InstanceType<
        typeof Shantanu.Shapes.Custom.QuadraticCurve
      >;
      export type CubicCurve = InstanceType<
        typeof Shantanu.Shapes.Custom.CubicCurve
      >;
      export type ArcCurve = InstanceType<
        typeof Shantanu.Shapes.Custom.ArcCurve
      >;
      export type EarcCurve = InstanceType<
        typeof Shantanu.Shapes.Custom.EarcCurve
      >;
    }

    // === Shapes.Media ===
    export namespace Media {
      export type Text = InstanceType<typeof Shantanu.Shapes.Media.Text>;
      export type Image = InstanceType<typeof Shantanu.Shapes.Media.Image>;
      //     export type Video = InstanceType<typeof Shantanu.Shapes.Media.Video>;
    }
  }

  //   // === Math ===
  //   export namespace Math {
  //     export type Vector2 = InstanceType<typeof Shantanu.Math.Vector2>;
  //     export type Matrix2D = InstanceType<typeof Shantanu.Math.Matrix2D>;
  //     export type Angle = ReturnType<typeof Shantanu.Math.Angle>;
  //     export type Distance = ReturnType<typeof Shantanu.Math.Distance>;
  //   }
  //
  //   // === Semantics ===
  //   export namespace Semantics {
  //     export type Tag = InstanceType<typeof Shantanu.Semantics.Tag>;
  //     export type Layer = InstanceType<typeof Shantanu.Semantics.Layer>;
  //     export type Group = InstanceType<typeof Shantanu.Semantics.Group>;
  //     export type State = InstanceType<typeof Shantanu.Semantics.State>;
  //     export type ObjectType = ReturnType<typeof Shantanu.Semantics.ObjectType>;
  //   }
  //
}
