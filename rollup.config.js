import hot from 'rollup-plugin-hot'
import del from 'rollup-plugin-delete'

export default {
  input: 'src/main.js',
  output: {
    dir: 'dist/app',
    format: 'esm',
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
          'dist/app': '/',
          public: '/',
        },
      }),
  ],
  watch: {
    clearScreen: false,
  },
}
