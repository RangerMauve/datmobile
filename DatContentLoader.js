import Dat from './react-native-dat'
import DatURL from './DatURL'

export default class DatContentLoader {
  constructor () {
    this.dat = new Dat()
  }

  async isFile (url) {
    const parsed = new DatURL(url)
    const dat = await this.dat.get(url)

    return new Promise((resolve, reject) => {
      dat.stat(parsed.path, (err, stat) => {
        if (err) return reject(err)
        resolve(stat.isFile())
      })
    })
  }

  async getAsText (url) {
    const parsed = new DatURL(url)
    const dat = await this.dat.get(url)

    return new Promise((resolve, reject) => {
      dat.readFile(parsed.path, 'utf-8', (err, data) => {
        if (err) return reject(err)
        resolve(data)
      })
    })
  }

  async getAsDataURI (url) {
    const parsed = new DatURL(url)
    const mimeType = parsed.mimeType

    const buffer = await this.getAsBinary(url)
    return `data:${mimeType};base64,${buffer.toString('base64')}`
  }

  async getAsBinary (url) {
    const parsed = new DatURL(url)
    const dat = await this.dat.get(url)

    return new Promise((resolve, reject) => {
      dat.readFile(parsed.path, (err, data) => {
        if (err) return reject(err)
        resolve(data)
      })
    })
  }

  async getFolderContents (url) {
    const parsed = new DatURL(url)
    const dat = await this.dat.get(url)

    return new Promise((resolve, reject) => {
      dat.readdir(parsed.path, (err, files) => {
        if (err) return reject(err)
        resolve(files)
      })
    })
  }

  close () {
    return this.dat.close()
  }
}
