/* global __DEV__, localStorage, Uint8Array */

require('es6-symbol/implement')
if (typeof __dirname === 'undefined') global.__dirname = '/'
if (typeof __filename === 'undefined') global.__filename = ''
if (typeof process === 'undefined') {
  global.process = require('process')
} else {
  const bProcess = require('process')
  for (var p in bProcess) {
    if (!(p in process)) {
      process[p] = bProcess[p]
    }
  }
}

process.browser = false
if (typeof Buffer === 'undefined') global.Buffer = require('buffer').Buffer

// global.location = global.location || { port: 80 }
const isDev = typeof __DEV__ === 'boolean' && __DEV__
process.env['NODE_ENV'] = isDev ? 'development' : 'production'
if (typeof localStorage !== 'undefined') {
  localStorage.debug = isDev ? '*' : ''
}

// If using the crypto shim, uncomment the following line to ensure
// crypto is loaded first, so it can populate global.crypto
require('crypto')

if (!Uint8Array.prototype.fill) {
  Uint8Array.prototype.fill = function (n) {
    const l = this.length
    for (let i = 0; i < l; i++) {
      this[i] = n
    }
  }
}

if (!Math.clz32) {
  Math.clz32 = function (x) {
  // Let n be ToUint32(x).
  // Let p be the number of leading zero bits in
  // the 32-bit binary representation of n.
  // Return p.
    if (x == null || x === 0) {
      return 32
    }
    return 31 - (Math.log(x >>> 0) / Math.LN2 | 0) // the "| 0" acts like math.floor
  }
}

const Response = require('@tradle/react-native-http/lib/response')

if (!Response.prototype.setEncoding) {
  Response.prototype.setEncoding = function (encoding) {
    this.__encoding = encoding
  }

  Response.prototype._emitData = function (res) {
    var respBody = this.getResponse(res)
    if (respBody.length > this.offset) {
      var rawData = respBody.slice(this.offset)
      var data = this.__encoding === 'utf-8' ? rawData : Buffer.from(rawData)

      this.emit('data', data)
      this.offset = respBody.length
    }
  }
}

// Shim DNS functionality
var DNS = require('dns')
var DNSClient = DNS.Client
var dns = new DNSClient()

const DNS_CACHE = {}

DNSClient.prototype.lookup = function (hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options
    options = null
  }

  if (DNS_CACHE[hostname]) return setTimeout(() => callback(null, DNS_CACHE[hostname]), 0)

  this.resolve(hostname, options, (err, addresses) => {
    if (err) callback(err)
    else if (!addresses.length) callback(new Error(`No DNS entry found for ${hostname}`))
    else {
      const resolved = addresses[0]
      DNS_CACHE[hostname] = resolved
      callback(null, resolved)
    }
  })
}

Object.keys(DNSClient.prototype).forEach((name) => {
  const value = dns[name]
  if (typeof value === 'function') {
    DNS[name] = (...args) => dns[name](...args)
  } else {
    DNS[name] = dns[name]
  }
})

// Shim react-native-udp to use random ports
const UdpSocket = require('react-native-udp/UdpSocket')

const _bindSocket = UdpSocket.prototype.bind

let PORT_COUNT = 15000

UdpSocket.prototype.bind = function (port, address, callback) {
  if (!address && callback) {
    address = callback
    callback = null
  }
  if (!port) port = PORT_COUNT++

  console.log('udp bind', port, address, callback)

  return _bindSocket.call(this, port, address, callback)
}
