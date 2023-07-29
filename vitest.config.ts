import { defineConfig, } from 'vitest/config'

export default defineConfig({
  test: {
    include: [ 'test/array/*.{js,ts}', ],
    includeSource: [ 'src/group.{js,ts}', ],
    update: true,
  },
})
