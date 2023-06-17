import { nodeModulesPolyfillPlugin, } from 'esbuild-plugins-node-modules-polyfill'
import { defineConfig, } from 'tsup'

// import esbuild from 'esbuild'
import fg from 'fast-glob'

export default defineConfig({
  entryPoints: fg.sync([ 'src/hierarchy/index.ts', ]),
  minify: true,
  treeshake: true,
  format: [
    'cjs',
    'esm',
  ],
  dts: { entry: [ 'src/hierarchy/index.ts', ], },
  // footer: { js: '\n\nObject.keys(func).forEach((key) => globalThis[key] = func[key])', },
  shims: true,
  define: { 'import.meta.vitest': 'false', },
  esbuildPlugins: [ nodeModulesPolyfillPlugin(), ],
  external: [ 'jsdom/lib/jsdom/living/generated/utils', ],
})
