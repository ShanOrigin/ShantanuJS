"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// vitest.config.ts
var config_1 = require("vitest/config");
exports.default = (0, config_1.defineConfig)({
    test: {
        globals: true, // allows describe(), it(), expect() without importing
        environment: 'happy-dom', // use "node" if testing backend/server code
        include: ['src/tests/**/*.test.ts'] // customize test file locations
    }
});
