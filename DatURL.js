import pathAPI from 'path'
import mime from 'mime/lite'

const DAT_REGEX = /dat:\/\/([^/]+)\/?(.*)?/i
const DAT_PROTOCOL = 'dat://'

export default class DatURL {
  constructor (url) {
    if(url instanceof DatURL) url = url.toString()
    const matches = url.match(DAT_REGEX)
    if (!matches) throw new TypeError(`Invalid dat URL: ${url}`)

    let key = matches[1]
    let version = null
    if (key.includes('+')) {
      [key, version] = key.split('+')
    }
    const path = matches[2] || ''

    this.key = key
    this.path = path
    this.version = version
  }

  relative (url) {
    const stringURL = url.toString()
    if (stringURL.indexOf(DAT_PROTOCOL) === 0) {
      return new DatURL(url)
    } else {
      const newPath = pathAPI.resolve(this.path, stringURL)
      return new DatURL(`${DAT_PROTOCOL}${this.key}${newPath}`)
    }
  }

  toString () {
    const versionText = this.version ? `+${this.version}` : ''
    return `${DAT_PROTOCOL}${this.key}${versionText}/${this.path}`
  }

  get mimeType () {
    return mime.getType(this.path)
  }

  static isDatURL (url) {
    return url && url.matches(DatURL)
  }
}
