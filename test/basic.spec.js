import { harness, test } from 'zorax'
import * as fs from 'fs'
import * as path from 'path'
import proxyquire from 'proxyquire'
import { fork } from 'child_process'
// import nollupDevServer from 'nollup/lib/dev-middleware'

// import { rollup } from 'rollup'

process.chdir(path.resolve(__dirname, '..'))

// const nollup = require.resolve('nollup/lib/cli.js')

const CUSTOM_REPORT = process.env.CUSTOM

if (CUSTOM_REPORT == 0) {
  const report = harness.report
  harness.report = async (...args) => {
    console.log('')
    return await report(async stream => {
      for await (const message of stream) {
        switch (message.type) {
          case 'BAIL_OUT':
            // eslint-disable-next-line no-console
            console.error(message.data)
            continue
        }
      }
    })
  }
}

const nollupDevServer = proxyquire('nollup/lib/dev-middleware', {
  chokidar: {
    watch: () => ({
      on: () => {},
    }),
  },
})

const macro = async (t, title, options, config) => {
  // const fileName = path.resolve(
  //   outputOptions.dir || path.dirname(outputOptions.file), outputFile.fileName
  // );

  // fs.writeFile = t.spy((file, ...args) => {
  //   const cb = args.pop()
  //   console.log('>', file)
  //   setTimeout(() => cb(null))
  // })

  const files = []
  let nollupFiles

  const _fs = {
    // ...fs,
    '@global': true,
    writeFile(file, ...args) {
      const cb = args.pop()
      files.push(file)
      setTimeout(() => cb(null))
    },
  }

  const { rollup } = proxyquire('rollup', {
    '@noCallThru': true,
    '@global': true,
    '@runtimeGlobal': true,
    fs: _fs,
    path: {},
  })

  const bundle = await rollup(config)

  await bundle.write(config.output)

  const app = {
    use: t.spy(),
    get: t.spy(),
    listen: t.spy(),
  }

  // FIXME nollup dev server mutates our config object
  const configClone = {
    ...config,
    output: { ...config.output },
  }

  const middleware = nollupDevServer(app, configClone, {
    hot: true,
    verbose: false,
    watch: false,
    onBundle: e => {
      if (e.code === 'BUNDLE_END') nollupFiles = Object.keys(e.files)
    },
    ...options,
  })

  const get = (t, url) =>
    new Promise(resolve => {
      const req = { url }

      const res = {
        writeHead: t.spy(),
        write: t.spy(),
        end: t.spy(() => {
          resolve({ next, res })
        }),
      }

      const next = t.spy(() => {
        resolve({ next, res })
      })

      middleware(req, res, next)
    }).then(({ next, res }) => {
      // next.hasBeenCalled(0, 'next has not been called')
      // res.end.hasBeenCalled(1, 'response was sent')
      return t.ok(res.end.calls.length > 0, `get ${url}`)
    })

  // const publicPath = path.resolve(options.contentBase)
  const publicPath = 'dist'

  const urls = files.map(file => {
    const fileWithHash = file.replace(/-[\da-f]+\.js$/, '-[hash].js')
    const url = '/' + path.relative(publicPath, fileWithHash)
    const relativeFile = path.relative(process.cwd(), file)
    return { relativeFile, url }
  })

  await Promise.all(
    urls.map(async x => {
      const { relativeFile, url } = x
      x.result = await t.test(`get ${relativeFile} at ${url}`, t => get(t, url))
    })
  )

  if (CUSTOM_REPORT) {
    console.log(`\n${`=== ${title} ===`.padEnd(80, '=')}\n`)
    console.log(options)
    console.log(config)
    console.log('Rollup:')
    const pass = ok =>
      ok ? '\x1b[0m\x1b[32m✔\x1b[0m' : '\x1b[0m\x1b[31m ⚠\x1b[0m'
    console.log(
      urls
        .map(x => `${pass(x.result.pass)}  '${x.relativeFile}' => ${x.url}`)
        .join('\n')
    )
    if (nollupFiles) {
      console.log('Nollup:')
      console.log(nollupFiles)
    }
    console.log()
    console.log()
  }
}

macro.title = (x, y) => x || y

test(
  macro,
  'output.file: simple main.js',
  {
    contentBase: 'dist',
  },
  {
    input: 'src/main.js',
    inlineDynamicImports: true,
    output: {
      file: 'dist/bundle.js',
      format: 'es',
    },
  }
)

test(
  macro,
  'output.file: nested main.js',
  {
    contentBase: 'dist',
  },
  {
    input: 'src/main.js',
    inlineDynamicImports: true,
    output: {
      file: 'dist/app/bundle.js',
      format: 'es',
    },
  }
)

test(
  macro,
  'output.dir: simple main.js',
  {
    contentBase: 'dist',
  },
  {
    input: 'src/main.js',
    output: {
      dir: 'dist',
      format: 'es',
    },
  }
)

test(
  macro,
  'output.dir: nested main.js',
  {
    contentBase: 'dist',
    // baseUrl: 'app',
  },
  {
    input: 'src/main.js',
    inlineDynamicImports: true,
    output: {
      dir: 'dist/app',
      format: 'es',
    },
  }
)

test(
  macro,
  'output.dir + entryFileNames',
  {
    contentBase: 'dist',
    // baseUrl: 'app',
  },
  {
    input: 'src/a/main.js',
    output: {
      dir: 'dist/app',
      entryFileNames: 'app/[name].js',
      format: 'es',
    },
  }
)

test(
  macro,
  'output.dir: entrypoints conflict',
  {
    contentBase: 'dist',
  },
  {
    input: ['src/a/main.js', 'src/a/b/main.js'],
    output: {
      dir: 'dist/app',
      format: 'es',
      // entryFileNames: '[name].js',
    },
  }
)

test(
  macro,
  'output.dir: chunk conflict',
  {
    contentBase: 'dist',
  },
  {
    input: ['src/main.js', 'src/second.js'],
    output: {
      dir: 'dist/app',
      format: 'es',
    },
  }
)

test(
  macro,
  'output.dir: chunk conflict without hashes',
  {
    contentBase: 'public',
    baseUrl: 'dist',
  },
  {
    input: ['src/main.js', 'src/second.js'],
    output: {
      dir: 'dist/app',
      format: 'es',
      chunkFileNames: '[name].js',
    },
  }
)

test(
  macro,
  'public dir: serve static from /dist, build to /dist',
  {
    contentBase: 'dist',
  },
  {
    input: 'src/a/main.js',
    output: {
      dir: 'dist/app',
      format: 'es',
    },
  }
)

test(
  macro,
  'public dir: serve static from /public, build to /dist',
  {
    contentBase: 'public',
    // means: trim this from output.dir to form a file's URL
    baseUrl: 'dist',
  },
  {
    input: 'src/a/main.js',
    output: {
      dir: 'dist/app',
      format: 'es',
    },
  }
)
