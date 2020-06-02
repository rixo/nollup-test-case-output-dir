const fs = require('fs')
const path = require('path')

const main = path.resolve(__dirname, 'src/main.js')
const foo = path.resolve(__dirname, 'src/foo.js')
const foot = path.resolve(__dirname, 'src/foot.js')

const NOLLUP = !process.env.ROLLUP
const DYN = !!process.env.DYN

const foo0 = `
  export default 'foo'
  console.log('> foo')
`

const foo1 = `
  export default 'foot'
  console.log('> foot')
`

const accept = NOLLUP
  ? `module.hot.accept(() => { require(module.id) })`
  : `import.meta.hot.accept()`

const main0static = `
  import foo from './foo.js'
  console.log(foo)
  ${accept}
`

const main1static = `
  import foot from './foot.js'
  console.log(foot)
  ${accept}
`

const main0dyn = `
  import('./foo.js').then(({ default: foo }) => {
    console.log(foo)
  })
  ${accept}
`

const main1dyn = `
  import('./foot.js').then(({ default: foot }) => {
    console.log(foot)
  })
  ${accept}
`

const main0 = DYN ? main0dyn : main0static
const main1 = DYN ? main1dyn : main1static

const handleError = err => {
  if (err.code === 'ENOENT') return
  console.error(err)
}

const serial = (...opts) =>
  opts.flat().reduce((p, fn) => p.then(fn), Promise.resolve())

const wait = d => new Promise(resolve => setTimeout(resolve, d))

const d = 75

const bug = () =>
  serial([
    () => fs.promises.writeFile(main, main1, 'utf8'),
    () => wait(d),
    () => fs.promises.writeFile(foot, foo1, 'utf8'),
    () => fs.promises.unlink(foo),
  ])

const restore = () =>
  serial([
    () => fs.promises.writeFile(main, main0, 'utf8'),
    () => wait(d),
    () => fs.promises.writeFile(foo, foo0, 'utf8'),
    () => fs.promises.unlink(foot),
  ])

const handler = fs.existsSync(foo) ? bug : restore

handler().catch(handleError)
