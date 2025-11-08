// working everything

import typescript from 'rollup-plugin-typescript2';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import esbuild from 'rollup-plugin-esbuild';

export default [
  // UMD build (for CDN)
  {
    input: 'src/index/index.ts',
    output: {
      file: 'dist/distribution/Shantanu.min.js',
      format: 'umd',
      name: 'Shantanu', // Exposed as window.Shantanu in browsers
      sourcemap: true
    },
    treeshake: true,
    plugins: [
      resolve(),
      commonjs(),
      typescript({ useTsconfigDeclarationDir: true, clean: true }),
      esbuild({
        minify: true,
        target: 'es2018', // modern enough for most browsers
        legalComments: 'none', // remove comments
        treeShaking: true
      })
    ]
  },

  // ESM build (for modern bundlers)
  {
    input: 'src/index/index.ts',
    output: {
      file: 'dist/distribution/Shantanu.esm.js',
      format: 'esm',
      sourcemap: true
    },
    treeshake: true,
    plugins: [
      resolve(),
      commonjs(),
      typescript(),
      esbuild({ minify: true, target: 'es2018', treeShaking: true })
    ]
  },

  // CommonJS build (for Node.js)
  {
    input: 'src/index/index.ts',
    output: {
      file: 'dist/distribution/Shantanu.cjs.js',
      format: 'cjs',
      sourcemap: true
    },
    treeshake: true,
    plugins: [
      resolve(),
      commonjs(),
      typescript(),
      esbuild({ minify: true, target: 'es2018', treeShaking: true })
    ]
  }
];
