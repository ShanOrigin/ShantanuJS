import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import replace from "@rollup/plugin-replace";
import typescript from "rollup-plugin-typescript2";
import esbuild from "rollup-plugin-esbuild";

const DEV = false;

const basePlugins = [
  replace({
    __SHANTANU_DEV__: JSON.stringify(DEV),
    preventAssignment: true,
    delimiters: ["", ""],
  }),

  resolve({
    extensions: [".js", ".ts"],
  }),

  commonjs(),

  typescript({
    tsconfigOverride: {
      compilerOptions: {
        sourceMap: true,
      },
    },
    clean: true,
  }),
];

const minifyPlugin = esbuild({
  minify: true,
  target: "es2018",
  legalComments: "none",
  treeShaking: true,
});

export default [
  /* ---------------------------------------------------------------------- */
  /*                         UMD / Browser / CDN                            */
  /* ---------------------------------------------------------------------- */

  {
    input: "src/index/index.ts",

    output: {
      file: "dist/distribution/ShantanuJS.min.js",
      format: "umd",
      name: "ShantanuJS",
      sourcemap: true,
      exports: "named",
    },

    treeshake: true,

    plugins: [
      ...basePlugins,
      minifyPlugin,
    ],
  },

  /* ---------------------------------------------------------------------- */
  /*                                  ESM                                   */
  /* ---------------------------------------------------------------------- */

  {
    input: "src/index/index.ts",

    output: {
      file: "dist/distribution/ShantanuJS.esm.js",
      format: "esm",
      sourcemap: true,
      exports: "named",
    },

    treeshake: true,

    plugins: basePlugins,
  },

  /* ---------------------------------------------------------------------- */
  /*                                  CJS                                   */
  /* ---------------------------------------------------------------------- */

  {
    input: "src/index/index.ts",

    output: {
      file: "dist/distribution/ShantanuJS.cjs.js",
      format: "cjs",
      sourcemap: true,
      exports: "named",
    },

    treeshake: true,

    plugins: basePlugins,
  },
];