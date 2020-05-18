if (false) {
  import('./dyn1.js').then(({ default: x }) => {
    console.log('dyn1', x)
  }).catch(err => {
    console.trace(err)
  })
}

import('./dyn2.js').then(({ default: x }) => {
  console.log('dyn2', x)
}).catch(err => {
  console.trace(err)
})
