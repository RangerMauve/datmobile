import Hyperdrive from 'hyperdrive'
import ram from 'random-access-memory'
import websocket from 'websocket-stream'
import encoding from 'dat-encoding'
import crypto from 'hypercore-crypto'
import pump from 'pump'
import datDNSAPI from 'dat-dns'
import DiscoverySwarm from 'discovery-swarm'
import SWARM_DEFAULTS from 'dat-swarm-defaults'

const DEFAULT_WEBSOCKET_RECONNECT = 1000

const DEFAULT_OPTIONS = {
  sparse: true
}

export default class Repo extends Hyperdrive {
  static async resolveDNS(url) {
    return datDNS.resolveName(url)
  }

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

    console.log('Connecting to:', url)

    this.websocket = websocket(url)

    this.websocket.once('error', (e) => {
      console.log('Error', e.stack)
    })

    this.websocket.once('close', () => {
      setTimeout(() => {
        this._createWebsocket(server)
      }, DEFAULT_WEBSOCKET_RECONNECT)
    })

    this._replicate(this.websocket)
  }

  _replicate (stream) {
    pump(stream, this.replicate({
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
