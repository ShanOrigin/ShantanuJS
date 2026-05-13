export type getAttrsMethodsReturnTypes =
  | string
  | number
  | Float32Array
  | object
  | undefined;

export type attrsMethodReturnTypes =
  | void
  | getAttrsMethodsReturnTypes[]
  | getAttrsMethodsReturnTypes;

export type transformStack = {
  stack: [
    {
      transformName: string;
      transformType: string;
      transformMatrix: Float32Array;
    }
  ];
  skip: number;
};
