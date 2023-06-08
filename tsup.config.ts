import { nodeModulesPolyfillPlugin, } from 'esbuild-plugins-node-modules-polyfill'
import { defineConfig, } from 'tsup'
// import esbuild from 'esbuild'
import fg from 'fast-glob'

export default defineConfig({
  entryPoints: fg.sync([
    'src/**/index.ts',
  ]),
  minify: true,
  treeshake: true,
  // footer: { js: '\n\nObject.keys(func).forEach((key) => globalThis[key] = func[key])', },
  shims: true,
  define: { 'import.meta.vitest': 'false', },
  esbuildPlugins: [ nodeModulesPolyfillPlugin(), ],
})
