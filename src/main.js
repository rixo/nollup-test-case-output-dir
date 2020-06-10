import { foo, bar, baz } from './a.js'

console.log(foo, bar, baz)

// prevent rollup-plugin-hot from crashing
if (typeof module !== 'undefined') {
  module.hot.accept(() => {
    require(module.id)
  })
}
