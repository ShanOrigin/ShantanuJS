// ++++++ General export types +++++++

export type infoParams = {
  module?: string;
  element?: string;
  testType?: string;
  description?: string;
};

export type Primitive = string | number | boolean;

export type AttrMap = Record<string, Primitive>;

export type NumMap = Record<string, number>;

export type constraintsParams = {
  save?: boolean;
  oracle?: {
    browser?: boolean;
    library?: boolean;
  };
  tolerance?: {
    geometry: number;
  };
};

export type verifyParam = {
  constraints?: constraintsParams;
  style?: {
    fill?: string;
    strokeColor?: string;
    strokeWidth?: number;
    attrs?: AttrMap;
  };
  geometry?: {
    attr?: NumMap;
    equalTo?: NumMap;
    greaterThan?: NumMap;
    lessThan?: NumMap;
    bbox?: boolean;
  };

  error?: {
    expected: Error;
  };
};

export type testInfo = infoParams;

// +++++++++ Style export types +++++++++

export type OracleResult = {
  status: 'pass' | 'fail';
  actual: Primitive;
  expected: Primitive;
};
export type StyleResult = {
  library?: Record<string, OracleResult>;
  browser?: Record<string, OracleResult>;
};

// ++++++++ Geometry export types +++++++++

export type GeometryCheckResult = {
  status: 'pass' | 'fail';
  actual: number;
  expected: number;
  delta?: number;
};

export type GeometryResult = {
  library?: Record<string, GeometryCheckResult>;
  browser?: Record<string, GeometryCheckResult>;
};

// +++++++ Error export types +++++++++

export type Terrors = {
  setupErrors: Error[];
  actionErrors: Error[];
  verifyErrors: Error[];
};

// +++++++ Output Types ++++++++

export type outputParam = {
  information: infoParams & { id: string };

  state?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };

  assertions: {
    domain: 'style' | 'geometry' | 'error';
    property: string;
    status: 'pass' | 'fail';
    expected: any;
    actual: any;
    delta?: number;
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

export type fileLevelData = {
  meta: metaData;
  tests: Record<string, outputParam>;
};
