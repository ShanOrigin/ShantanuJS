export const hideTests = {
  testInfo: {
    description: "Testing .hide() method of shape",
    module: "core",
    testType: "unit",
  },

  expected: {
    style: {
      attrs: {
        opacity: {
          value: 0,
          expectedStatus: "pass",
        },
      },
    },
  },
};
