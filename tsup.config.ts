import { defineConfig } from 'tsup'

export default defineConfig({
  bundle: true,
  skipNodeModulesBundle: true,
  entry: ['src/index.ts'],
  dts: true,
  format: 'cjs',
  shims: false,
  splitting: true,
  treeshake: true,
  target: 'es2020',
  platform: 'node',
  sourcemap: true,
})
