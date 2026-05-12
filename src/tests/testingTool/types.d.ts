// ++++++ General export types +++++++

export type CompareMode = 'eq' | 'gt' | 'lt' | 'gte' | 'lte';
export type testInfo = {
  module?: string;
  element?: string;
  testType?: string;
  description?: string;
};

export type Primitive = string | number | boolean;

export type AttrMap = Record<string, Primitive>;

export type geoAttrMap = AttrMap & { tolerance?: number };
export type NumMap = Record<string, number>;

export type constraintsParams = {
  save?: boolean;
  oracle?: {
    browser?: boolean;
    library?: boolean;
  };
};

export type verifyParams = {
  shapes: string[];
  constraints?: constraintsParams;
  style?: {
    fill?: string;
    strokeColor?: string;
    strokeWidth?: number;
    attrs?: AttrMap;
  };
  geometry?: {
    attr?: geoAttrMap;
    equalTo?: geoAttrMap;
    greaterThan?: geoAttrMap;
    lessThan?: geoAttrMap;
    greaterThanOrEqual?: geoAttrMap;
    lessThanOrEqual?: geoAttrMap;
    bbox?: { check: boolean; tolerance?: number };
  };

  error?: {
    expected: Error;
  };
};

// +++++++++ Style export types +++++++++

export type OracleResult = {
  status: 'pass' | 'fail';
  actual: Primitive;
  expected: Primitive;
};

// ++++++++ Geometry export types +++++++++

export type GeometryCheckResult = {
  status: 'pass' | 'fail';
  actual: number | string | number[];
  expected: number | string | number[];
  delta?: number;
  reason?: string;
  tolerance?: number;
};

// +++++++ Error export types +++++++++

export type Terrors = {
  setupErrors: Error[];
  actionErrors: Error[];
  verifyErrors: Error[];
};

// +++++++ Output Types ++++++++

export type outputParam = {
  information: testInfo & { id: string };

  state?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };

  assertions: {
    crossCheck?: 'library' | 'browser' | 'system';
    domain: 'style' | 'geometry' | 'error';
    property: string;
    status: 'pass' | 'fail';
    expected: any;
    actual: any;
    delta?: number;
    reason?: string;
    tolerance?: number;
  }[];
};

export type env = {
  browser: {
    name: string;
    version: string;
  };
  platform: string;
};
export type metaData = {
  info: {
    module: string;
    testType: string;
    canvasId: string;
  };
  environment: env & { libraryVersion: string };
};

export type tests = Record<string, outputParam>;
export type saveFileData = {
  save?: boolean;
  fileUrl: string;
  meta?: metaData;
  tests: tests;
};

export type RGBA = [number, number, number, number];

/**
 * Represents parsed browser information.
 */
export interface BrowserInfo {
  name: string;
  version: string;
}

/**
 * Represents the complete legacy browser detection result.
 */
export interface LegacyBrowserInfo {
  browser: BrowserInfo;
  platform: string;
}
