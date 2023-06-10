import { defineConfig, } from 'vitest/config'

export default defineConfig({
  test: {
    include: [ 'test/**/*.ts', ],
    includeSource: [ 'src/**/*.ts', ],
    update: true,
  },
})
