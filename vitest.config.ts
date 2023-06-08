import { defineConfig, } from 'vitest/config'

export default defineConfig({
  test: {
    include: [ 'test/**/*.{js,ts}', ],
    includeSource: [ 'src/**/*.{js,ts}', ],
    update: true,
  },
})
