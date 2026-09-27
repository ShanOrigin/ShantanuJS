export const toFrontTests = {
  description: "Testing .toFront() method of shape",
  expected: {
    geometry: {
      greaterThan: {
        zIndex: {
          value: 0,
          expectedStatus: "pass",
        },
        lessThan: {
          zIndex: {
            value: 0,
            expectedStatus: "fail",
          },
        },
      },
    },
  },
};
