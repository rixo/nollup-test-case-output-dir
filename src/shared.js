let i = 2

export default () => {
  return 'shared' + '_' + i++
}

export { default as a } from './shared-a.js'
