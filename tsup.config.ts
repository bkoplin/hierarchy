import { defineConfig, } from 'tsup'

// import esbuild from 'esbuild'
import fg from 'fast-glob'

export default defineConfig({
  entryPoints: fg.sync([ 'src/index.ts', ]),
  minify: true,
  treeshake: true,
  clean: true,
  format: [
    'cjs',
    'esm',
  ],
  dts: {
    entry: [ 'src/index.ts', ],
    compilerOptions: { noEmitOnError: false, },
  },
  // footer: { js: '\n\nObject.keys(func).forEach((key) => globalThis[key] = func[key])', },
  // shims: true,
  define: { 'import.meta.vitest': 'false', },
  // esbuildPlugins: [ nodeModulesPolyfillPlugin(), ],
  // external: [ 'jsdom/lib/jsdom/living/generated/utils', ],
})
