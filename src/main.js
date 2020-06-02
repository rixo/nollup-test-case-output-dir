
  import foo from './foo.js'
  console.log(foo)
  module.hot.accept(() => { require(module.id) })
