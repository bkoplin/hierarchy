import { defineConfig, } from 'vitest/config'

export default defineConfig({
  test: {
    include: [ 'test/*.{js,ts}', ],
    includeSource: [ 'src/array/group.{js,ts}', ],
    update: true,
  },
})
