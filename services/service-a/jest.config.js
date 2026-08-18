const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },
  moduleNameMapper: {
    '^uuid$': '<rootDir>/src/tests/__mocks__/uuid.ts'
  },
  modulePathIgnorePatterns: [
    "<rootDir>/dist/"
  ]
};
