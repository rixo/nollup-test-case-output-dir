import hot from 'rollup-plugin-hot'
import del from 'rollup-plugin-delete'

export default {
  input: 'src/main.js',
  output: {
    file: 'dist/main.js',
    format: 'iife',
    sourcemap: true,
  },
  plugins: [
    // prevent confusing outcomes, if Nollup ends up serving files
    // compiled by rollup-plugin-hot
    del({ targets: 'dist/*' }),

    !process.env.NOLLUP &&
      hot({
        inMemory: true,
        port: 8080,
        mount: {
          dist: '/',
          public: '/',
        },
      }),
  ],
  watch: {
    clearScreen: false,
  },
}
