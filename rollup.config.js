export default {
  input: ['src/main.js', 'src/sub/nested.js', 'src/sub2/nested.js'],
  output: {
    dir: 'dist/app',
    format: 'es',
    sourcemap: true,
  }
}
