import Hyperdrive from 'hyperdrive'
import ram from 'random-access-memory'
import crypto from 'hypercore-crypto'
import DatDNSAPI from 'dat-dns'
import DiscoverySwarm from 'discovery-swarm'
import HypercoreProtocol from 'hypercore-protocol'
import DatEncoding from 'dat-encoding'
import { EventEmitter } from 'events'
import krpc from 'k-rpc'
import sha1 from 'simple-sha1'

import SWARM_DEFAULTS from 'dat-swarm-defaults'

const DEFAULT_OPTIONS = {
  sparse: true
}

const DEFAULT_DNS_HOST = 'dns.dns-over-https.com'
const DEFAULT_DNS_PATH = '/dns-query'

const DEFAULT_DNS_OPTS = {
  dnsHost: DEFAULT_DNS_HOST,
  dnsPath: DEFAULT_DNS_PATH
}

const DAT_SWARM_PORT = 3282

/**
 * The Dat object. Manages multiple repositories in
 * a single discovery-swarm instance.
 * @param {Object} opts   Default options to use for the dat.
 */
export default class Dat extends EventEmitter {
  async resolveName (url) {
    return this.dns.resolveName(url)
  }

  constructor (opts) {
    super()
    this.opts = Object.assign({}, DEFAULT_OPTIONS, opts || {})

    if (!this.opts.id) this.opts.id = crypto.randomBytes(32)

    this.archives = []

    this.dns = DatDNSAPI(Object.assign({}, DEFAULT_DNS_OPTS, this.opts))

    const swarmOpts = SWARM_DEFAULTS({
      hash: false,
      stream: (info) => this._createReplicationStream(info)
    })

    swarmOpts.dht.krpc = krpc({
      isIP: () => true,
      idLength: Buffer.from(sha1.sync(Buffer.from('')), 'hex').length
    })

    this.swarm = new DiscoverySwarm(swarmOpts)

    this._opening = new Promise((resolve, reject) => {
      this.swarm.listen(DAT_SWARM_PORT, (err) => {
        if (err) return reject(err)
        this._opening = null
        resolve()
      })
    })
  }

  // Based on beaker-core https://github.com/beakerbrowser/beaker-core/blob/54726a042dc0f72773a9e147c87f8072a9d7a39a/dat/daemon/index.js#L531
  _createReplicationStream (info) {
    console.log('Got peer', info)
    const stream = new HypercoreProtocol({
      id: this.opts.id,
      live: true,
      encrypt: true
    })

    stream.peerInfo = info

    stream.on('error', (e) => console.log(e))

    if (info.channel) this._replicateWith(stream, info.channel)

    return stream
  }

  _replicateWith (stream, discoveryKey) {
    const discoveryKeyString = DatEncoding.encode(discoveryKey)
    const archive = this.archives.find((archive) => DatEncoding.encode(archive.discoveryKey) === discoveryKeyString)

    // Unknown archive
    if (!archive) return

    archive.replicate({ stream, live: true })
  }

  /**
   * Returns a repo with the given url. Returns undefined
   * if no repository is found with that url.
   * @param  {url} url      The url of the repo.
   * @return {Promise<Repo>}  The repo object with the corresponding url.
   */
  async get (url) {
    const key = await this.resolveName(url)
    const stringkey = DatEncoding.encode(key)

    const archive = this.archives.find((archive) => DatEncoding.encode(archive.key) === stringkey)
    if (archive) return archive
    return this._add(key)
  }

  async _add (key, opts) {
    if (this.destroyed) throw new Error('client is destroyed')

    await this._opening

    if (!opts) opts = {}

    const finalOpts = Object.assign({}, this.opts, opts)

    if (!key) {
      const keyPair = crypto.keyPair()
      key = keyPair.publicKey
      finalOpts.secretKey = keyPair.secretKey
    }

    const stringkey = DatEncoding.encode(key)

    const db = (file) => {
      const db = finalOpts.db || ram
      return db(stringkey + '/' + file)
    }

    const archive = new Hyperdrive(db, key, finalOpts)

    this.archives.push(archive)

    return new Promise((resolve, reject) => {
      archive.ready(() => {
        archive.metadata.update((err) => {
          if (err) reject(err)
          else resolve(archive)
          this.emit('repo', archive)
        })

        this.swarm.join(archive.discoveryKey, {
          announce: true
        })
      })
    })
  }

  async create (opts) {
    return this._add(null, opts)
  }

  async has (url) {
    const key = await this.resolveName(url)
    const stringkey = DatEncoding.encode(key)

    const archive = this.archives.find((archive) => DatEncoding.encode(archive.key) === stringkey)

    return !!archive
  }

  /**
   * Closes the dat, the swarm, and all underlying repo instances.
   */
  async close () {
    if (this.destroyed) {
      return
    }
    this.destroyed = true

    await new Promise((resolve, reject) => {
      this.swarm.close((err) => {
        if (err) reject(err)
        else resolve()
      })
    })

    await Promise.all(this.archives.map((archive) => {
      return new Promise(resolve => archive.close(resolve))
    }))

    this.repos = null

    this.emit('close')
  }

  destroy () {
    return this.close()
  }
}
