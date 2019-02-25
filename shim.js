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
    const l = this.length;
    for(let i = 0; i < l; i++) {
      this[i] = n
    }
  };
}

if (!Math.clz32) Math.clz32 = function(x) {
  // Let n be ToUint32(x).
  // Let p be the number of leading zero bits in
  // the 32-bit binary representation of n.
  // Return p.
  if (x == null || x === 0) {
    return 32;
  }
   return 31 - (Math.log(x >>> 0) / Math.LN2 | 0); // the "| 0" acts like math.floor
};
