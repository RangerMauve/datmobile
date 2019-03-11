import React, { Component } from 'react'
import {
  StyleSheet,
  View
} from 'react-native'

import { ProtocolWebView } from '../react-native-protocol-webview'

import resolveDatPath from 'resolve-dat-path'

import { PassThrough }  from 'stream'

import mime from 'mime/lite'

const DAT_REGEX = /dat:\/\/([^/]+)\/?(.*)?/i

function parseDatURL(url) {
  const matches = url.match(DAT_REGEX)
  if (!matches) throw new TypeError(`Invalid dat URL: ${url}`)

  let key = matches[1]
  let version = null
  if (key.includes('+')) {
    [key, version] = key.split('+')
  }
  const path = matches[2] || ''

  return {key, path, version}
}

function showText(message, statusCode, cb) {
  const stream = new PassThrough()

  cb({
    mimeType: 'text/html',
    statusCode: statusCode,
    data: stream,
  })

  stream.push(message)
  stream.push(null)
}

function showError(archive, request, err, cb) {
  showText(`
<!DOCTYPE html>
<meta name="viewport" content="width=device-width">
<h1>Something went wrong:</h1>
<p>
${err.message}
</p>
`, 500, cb)
}

function showDirectory(archive, request, resolvedPath, cb) {
  archive.readdir(resolvedPath, (err, items) => {
    const listing = `
<!DOCTYPE html>
<meta charset="utf-8" />
<title>dat://${archive.key.toString('hex')}</title>
<meta name="viewport" content="width=device-width" />
<h1>${resolvedPath}</h1>
<ul>
  <li>
    <a href="../">../</a>
  </li>
  <li>
    <a href="/">/</a>
  </li>
  ${items.map((item) => `
    <li>
      <a href="./${item}">./${item}</a>
    </li>
  `).join('\n')}
</ul>
`

    console.log('Showing', listing)
    showText(listing, 200, cb)
  })
}

function showFile(archive, request, resolvedPath, cb) {
  console.log(`loading dat://${archive.key.toString('hex')}${resolvedPath}`)

  const stream = archive.createReadStream(resolvedPath)

  const mimeType = mime.getType(resolvedPath)

  cb({
    data: stream,
    statusCode: 200,
    mimeType
  })
}

class Deferred {
  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
    })
  }
  then (...args) {
    return this.promise.then(...args)
  }
}

function loadContent(dat, request, cb) {
  const { url } = request
  const {key, path} = parseDatURL(url)
  // console.log('Running stream protocol handler', request)
  dat.get(`dat://${key}`).then((archive) => {
    // console.log('Got archive')
    resolveDatPath(archive, path, (err, resolution) => {
      // console.log(`Resolved path ${resolution}`)
      if(err) return showError(archive, request, new Error("Not found"));

      const resolvedPath = resolution.path
      const type = resolution.type
      if(type === 'directory') return showDirectory(archive, request, resolvedPath, cb)
      if(type === 'file') return showFile(archive, request, resolvedPath, cb)

      // This should never happen
      return showError(archive, request, new Error("Not found"), cb)
    })
  })
}

export class DatWebView extends Component{
  static currentRequest = null

  static initialize = (dat) => {
    ProtocolWebView.registerStreamProtocol('dat', (request, cb) => {
      loadContent(dat, request, cb)
    })
  }

  render () {
    return (
      <ProtocolWebView {...this.props} />
    )
  }
}

ProtocolWebView.registerStringProtocol('foobar', (request, cb) => {
  cb({
    mimeType: "text/html",
    data: `
    <!DOCTYPE html>
    <meta name="viewport" content="width=device-width">
    <h1>Hello World!</h1>
    <div>${request.url}</div>
    `
  })
})
