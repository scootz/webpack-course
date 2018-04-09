import React from "react"
import { renderToString } from "react-dom/server"
import { StaticRouter } from "react-router"
import Routes from "../components/Routes"

import { flushChunkNames } from "react-universal-component/server"
import flushChunks from "webpack-flush-chunks"
import configureStore from "../store"
import { Provider } from "react-redux"
import { fetchArticle } from "../actions"

const store = configureStore()

const loadArticle = (site, slug) => {
  return store.dispatch(fetchArticle(site, slug))
}

export default ({ clientStats }) => (req, res) => {
  const site = req.headers.host.split(":")[0].split(".")[0]
  const slug = req.path.split("/").reverse()[0]
  const context = { site }
  const names = flushChunkNames().concat([`css/${site}-theme-css`])

  const { js, styles, cssHash } = flushChunks(clientStats, {
    chunkNames: names
  })

  if (req.path === "/article/post") {
    const promise = loadArticle(site, slug)
    new Promise((resolve, reject) => {
      promise.then(resolve).catch(e => {
        resolve
      })
    }).then(_ => {
      res.send(`
        <html>
          <head>
            ${styles}
          </head>
          <body>
            <div id="react-root">${renderToString(
              <Provider store={store}>
                <StaticRouter location={req.url} context={context}>
                  <Routes />
                </StaticRouter>
              </Provider>
            )}</div>
            ${js}
          </body>
        </html>
      `)
    })
  } else {
    res.send(`
      <html>
        <head>
          ${styles}
        </head>
        <body>
          <div id="react-root">${renderToString(
            <Provider store={store}>
              <StaticRouter location={req.url} context={context}>
                <Routes />
              </StaticRouter>
            </Provider>
          )}</div>
          ${js}
        </body>
      </html>
    `)
  }
}
