import dep from './dep.js'

// setTimeout(() => {
//   import('./sub/nested.js').then(({ default: nested }) => {
//     console.log('main.js', nested)
//   })
// })
import('./sub/nested.js').then(({ default: nested }) => {
  console.log('main.js', nested)
})

import('./sub2/nested.js').then(({ default: nested }) => {
  console.log('main.js', dep, nested2)
})
