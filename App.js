import React, { Component } from 'react'
import {
  StyleSheet,
  View,
  TextInput,
  Button,
  BackHandler,
  Linking,
} from 'react-native'

import Welcome from './Pages/Welcome'
import Loading from './Pages/Loading'
import Directory from './Pages/Directory'
import File from './Pages/File'
import Image from './Pages/Image'
import Markdown from './Pages/Markdown'

import DatContentLoader from './DatContentLoader'
import DatURL from './DatURL'

const PAGE_MAPPING = {
  'welcome': Welcome,
  'directory': Directory,
  'file': File,
  'image': Image,
  'markdown': Markdown,
  'loading': Loading,
}

const GATEWAY = 'wss://gateway.mauve.moe'

export default class App extends Component {
  constructor (props) {
    super(props)

    this.state = {
      page: 'welcome',
      url: 'dat://',
      data: null
    }

    this.history = []
    this.input = null

    this.contentLoader = new DatContentLoader(GATEWAY)

    this.navigateTo = async (url) => {
      console.log(`Navigating: ${url}`)
      if(url === 'dat://') {
        this.setState({
          page: 'welcome',
          data: 'null',
          url: url,
        })
      } else if (url.startsWith('dat://')) {
        this.history.push(this.state.url)
        this.setState({
          url: url,
          page: 'loading'
        })
        const isFile = await this.contentLoader.isFile(url)
        if (isFile) {
          const parsed = new DatURL(url)
          const mimeType = parsed.mimeType

          if(mimeType.includes('image')) {
            const buffer = await this.contentLoader.getAsBinary(url)
            const imageURI = `data:${mimeType};base64,${buffer.toString('base64')}`
            console.log(`Image URI: ${imageURI}`)
            this.setState({
              page: 'image',
              data: imageURI
            })
          } else {
            const text = await this.contentLoader.getAsText(url)
            if(mimeType.includes('markdown')) {
              this.setState({
                page: 'markdown',
                data: text
              })
            } else {
              this.setState({
                page: 'file',
                data: text
              })
            }
          }
        } else {
          const files = await this.contentLoader.getFolderContents(url)
          this.setState({
            page: 'directory',
            data: files
          })
        }
      } else {
        this.navigateTo(new DatURL(this.state.url).relative(url).toString())
      }
    }

    this.goBack = () => {
      const url = this.history.pop()
      this.navigateTo(url)
      this.history.pop()
    }

    this.onChangeURL = (url) => {
      this.setState({ url })
    }

    this.navigateToCurrentURL = () => {
      this.navigateTo(this.state.url)
    }
    this.setInputRef = (input) => {
      this.input = input
    }
  }

  componentDidMount() {
    BackHandler.addEventListener('hardwareBackPress', () => {
      if(!this.history.length) return false

      this.goBack()

      return true
    })

    Linking.getInitialURL().then((url) => {
       if (url) {
         this.navigateTo(url)
       }
    }).catch(err => console.error('An error occurred', err));
  }

  render () {
    let RenderComponent = Loading

    const page = this.state.page

    const gotComponent = PAGE_MAPPING[page]
    if (gotComponent) RenderComponent = gotComponent

    return (
      <View style={styles.container}>
        <View style={styles.navigation}>
          <Button
            title="Back"
            onPress={() => this.goBack()}
          />
          <TextInput
            style={styles.flex}
            value={this.state.url}
            autoCapitalize='none'
            autoCorrect={false}
            textContentType='URL'
            onChangeText={this.onChangeURL}
            onSubmitEditing={this.navigateToCurrentURL}
            ref={this.setInputRef}
          />
          <Button
            title="Go"
            onPress={() => this.navigateToCurrentURL()}
          />
        </View>
        <View style={styles.container}>
          <RenderComponent url={this.state.url} data={this.state.data} navigateTo={this.navigateTo} />
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: '#F5FCFF'
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  flex: {
    flex: 1
  }
})
