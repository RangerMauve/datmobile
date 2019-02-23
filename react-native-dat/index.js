import Hyperdrive from 'hyperdrive'
import ram from 'random-access-memory'
import websocket from 'websocket-stream'
import encoding from 'dat-encoding'
import crypto from 'hypercore-crypto'
import pump from 'pump'

const DEFAULT_WEBSOCKET_RECONNECT = 1000
const DAT_PROTOCOL = 'dat://'

const DEFAULT_OPTIONS = {
  sparse: true
}

export default class Repo extends Hyperdrive {
  constructor (url, opts = {}) {
    const finalOpts = Object.assign({}, DEFAULT_OPTIONS, opts)
    let key = null
    if (url) {
      key = encoding.decode(url)
    } else {
      const keyPair = crypto.keyPair()
      key = keyPair.publicKey
      opts.secretKey = keyPair.secretKey
    }

    const db = (file) => {
      const db = finalOpts.db || ram
      return db(key.toString('hex') + '/' + file)
    }

    super(db, key, finalOpts)

    this.opts = finalOpts

    this.ready(() => {
      this._createWebsocket()
    })
  }

  _createWebsocket () {
    if (!this.opts.gateway) return
    const servers = [].concat(this.opts.gateway)

    if (!servers.length) return

    const server = chooseRandom(servers)

    const url = server + '/' + this.key.toString('hex')

    this.websocket = websocket(url)

    this.websocket.once('error', (e) => {
      console.error(e)
      setTimeout(() => {
        this._createWebsocket(server)
      }, DEFAULT_WEBSOCKET_RECONNECT)
    })

    this.websocket.once('close', () => console.log('closed websocket'))

    this._replicate(this.websocket)
  }

  _replicate (stream) {
    pump(stream, this.replicate({
      sparse: true,
      live: true
    }), stream)
  }

  close (cb) {
    if (this.websocket) {
      this.websocket.end()
      this.websocket = null
    }

    super.close(cb)
  }

  destroy (cb) {
    this.close(cb)
  }
}

function chooseRandom (list) {
  return list[Math.floor(Math.random() * list.length)]
}
