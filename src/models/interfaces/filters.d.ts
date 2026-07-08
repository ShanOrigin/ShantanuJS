/**
 * Adjusts image brightness.
 */
export interface IBrightnessFilter {
  /**
   * Brightness multiplier.
   * - 1 = original
   * - 0 = completely black
   * - >1 = brighter
   *
   * @default 1
   */
  amount: number;
}

/**
 * Creates an outer glow.
 */
export interface IGlowFilter {
  /**
   * Glow color.
   * @default "#000000"
   */
  color: string;

  /**
   * Blur radius.
   * @default 8
   */
  blur: number;

  /**
   * Glow strength.
   * @default 1
   */
  strength: number;

  /**
   * Opacity.
   * Range: 0–1
   * @default 1
   */
  opacity: number;
}

/**
 * Creates a drop shadow.
 */
export interface IShadowFilter {
  /**
   * Horizontal offset.
   * @default 0
   */
  offsetX: number;

  /**
   * Vertical offset.
   * @default 4
   */
  offsetY: number;

  /**
   * Blur radius.
   * @default 6
   */
  blur: number;

  /**
   * Shadow color.
   * @default "#000000"
   */
  color: string;

  /**
   * Opacity.
   * Range: 0–1
   * @default 0.5
   */
  opacity: number;
}

export interface IBlurFilter {
  radius: number;
}

export interface IContrastFilter {
  amount: number;
}

export interface ISaturateFilter {
  amount: number;
}

export interface IGrayscale {
  amount: number;
}

export interface IHueRotate {
  angle: number;
}

export interface IFilter {
  blur(id: string, props: IBlurFilter): void;
  contrast(id: string, props: IContrastFilter): void;
  saturate(id: string, props: ISaturateFilter): void;
  grayscale(id: string, props: IGrayscale): void;
  hueRotate(id: string, props: IHueRotate): void;

  glow(id: string, props: IGlowFilter): void;

  shadow(id: string, props: IShadowFilter): void;

  removeFilter(id: string): void;
  clearFilters(): void;
  hasFilter(id?: string): boolean;
  getAllFilters(): ReadonlyMap<string, FilterRecord>;
}

type Status = 'pending' | 'update' | 'normal';

export type FilterRecord =
  | {
      status: Status;
      type: 'blur';
      props: Required<IBlurFilter>;
    }
  | {
      status: Status;
      type: 'contrast';
      props: Required<IContrastFilter>;
    }
  | {
      status: Status;
      type: 'saturate';
      props: Required<ISaturateFilter>;
    }
  | {
      status: Status;
      type: 'grayscale';
      props: Required<IGrayscale>;
    }
  | {
      status: Status;
      type: 'hueRotate';
      props: Required<IHueRotate>;
    }
  | {
      status: Status;
      type: 'shadow';
      props: Required<IShadowFilter>;
    }
  | {
      status: Status;
      type: 'glow';
      props: Required<IGlowFilter>;
    };

/**
 * Linear gradient definition.
 */
export interface ILinearGradientFilter {
  /**
   * Start X.
   * @default 0
   */
  x1?: number;

  /**
   * Start Y.
   * @default 0
   */
  y1?: number;

  /**
   * End X.
   * @default 1
   */
  x2?: number;

  /**
   * End Y.
   * @default 0
   */
  y2?: number;

  /**
   * Gradient stops.
   */
  stops: {
    offset: number;
    color: string;
    opacity?: number;
  }[];
}

/**
 * Radial gradient definition.
 */
export interface IRadialGradientFilter {
  /**
   * Center X.
   * @default 0.5
   */
  cx?: number;

  /**
   * Center Y.
   * @default 0.5
   */
  cy?: number;

  /**
   * Radius.
   * @default 0.5
   */
  r?: number;

  /**
   * Optional focal point X.
   * @default cx
   */
  fx?: number;

  /**
   * Optional focal point Y.
   * @default cy
   */
  fy?: number;

  /**
   * Gradient stops.
   */
  stops: {
    offset: number;
    color: string;
    opacity?: number;
  }[];
}

/*
 


export interface ISepia {
  amount: number;
}

export interface IInvert {
  amount: number;
}

		{
      status: Status;
      type: 'linearGradient';
      props: Required<Omit<ILinearGradientFilter, 'stops'>> &
        Pick<ILinearGradientFilter, 'stops'>;
    }
  | {
      status: Status;
      type: 'radialGradient';
      props: Required<Omit<IRadialGradientFilter, 'stops'>> &
        Pick<IRadialGradientFilter, 'stops'>;
    };

		*/
