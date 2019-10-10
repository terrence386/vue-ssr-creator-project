const server = require('express')()
const express = require('express')
const path = require('path')
const fs = require('fs')
const LRU = require('lru-cache')
const microcache = require('route-cache')
const isProd = process.env.NODE_ENV === 'production'
const useMicroCache = process.env.MICRO_CACHE !== 'false'
const resolve = file => path.resolve(__dirname, file)
const { createBundleRenderer } = require('vue-server-renderer')
const setupDevServer = require('./config/setup-dev-server')
console.log('isProd',isProd)

const compression = require('compression')
const serverInfo =
  `express/${require('express/package.json').version} ` +
  `vue-server-renderer/${require('vue-server-renderer/package.json').version}`
  let renderer
  let readyPromise
  const templatePath = resolve('./index.template.html')
//   const createApp = require('./app')
function createRenderer (bundle, options) {
    // https://github.com/vuejs/vue/blob/dev/packages/vue-server-renderer/README.md#why-use-bundlerenderer
    return createBundleRenderer(bundle, Object.assign(options, {
      // for component caching
      cache: LRU({
        max: 1000,
        maxAge: 1000 * 60 * 15
      }),
    //   // this is only needed when vue-server-renderer is npm-linked
      basedir: resolve('./dist'),
    //   // recommended for performance
      runInNewContext: false
    }))
    // return createBundleRenderer(bundle, options)
  }
  
//   const template = fs.readFileSync(templatePath, 'utf-8')
    // const bundle = require('./dist/vue-ssr-server-bundle.json')
  
  if (isProd) {
    // In production: create server renderer using template and built server bundle.
    // The server bundle is generated by vue-ssr-webpack-plugin.
    const template = fs.readFileSync(templatePath, 'utf-8')
    const bundle = require('./dist/vue-ssr-server-bundle.json')
    // The client manifests are optional, but it allows the renderer
    // to automatically infer preload/prefetch links and directly add <script>
    // tags for any async chunks used during render, avoiding waterfall requests.
    const clientManifest = require('./dist/vue-ssr-client-manifest.json')
    renderer = createRenderer(bundle, {
      template,
      clientManifest
    })
  } else {
    // In development: setup the dev server with watch and hot-reload,
    // and create a new renderer on bundle / index template update.
    readyPromise = setupDevServer(
        server,
      templatePath,
      (bundle, options) => {
        renderer = createBundleRenderer(bundle, options)
      }
    )
  }
  const serve = (path, cache) => express.static(resolve(path), {
    maxAge: cache && isProd ? 1000 * 60 * 60 * 24 * 30 : 0
  })
  server.use(compression({ threshold: 0 }))
  server.use(microcache.cacheSeconds(1, req => useMicroCache && req.originalUrl))
  server.use('/public', serve('./public', true))
//   server.use('/vue-ssr-client-manifest.json', serve('./vue-ssr-client-manifest.json', true))
//   server.use('/dist', serve('./dist', true))
function render (req, res) {
    const s = Date.now()
  
    res.setHeader("Content-Type", "text/html")
    res.setHeader("Server", serverInfo)
  
    const handleError = err => {
      if (err.url) {
        res.redirect(err.url)
      } else if(err.code === 404) {
        res.status(404).send('404 | Page Not Found')
      } else {
        // Render Error Page or Redirect
        res.status(500).send('500 | Internal Server Error')
        console.error(`error during render : ${req.url}`)
        console.error(err.stack)
      }
    }
    const context = {
      title: 'hello world', // default title
      url: req.url
    }
        renderer.renderToString((err, html) => {
            if (err) {
              return handleError(err)
            }
            res.send(html)
            if (!isProd) {
              console.log(`whole request: ${Date.now() - s}ms`)
            }
          })
    
  }
server.use('*', (req, res) => {
    readyPromise.then(() => render(req, res))
  })

const port = process.env.PORT || 9080
server.listen(port,()=>{
    console.log(`server started at localhost:${port}`)
})