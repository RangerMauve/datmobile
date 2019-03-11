import React, { Component } from 'react'
import {
  StyleSheet,
  View,
  TextInput,
  Button,
  BackHandler,
  Linking
} from 'react-native'

import RNFS from 'react-native-fs'
import Dat from './react-native-dat'
import storage from 'random-access-rn-file'

import Welcome from './Pages/Welcome'
import Loading from './Pages/Loading'
import Directory from './Pages/Directory'
import File from './Pages/File'
import Image from './Pages/Image'
import Markdown from './Pages/Markdown'
import HTML from './Pages/HTML'
import Browser from './Pages/Browser'

import DatContentLoader from './DatContentLoader'
import DatURL from './DatURL'

const PAGE_MAPPING = {
  'browser': Browser,
  'welcome': Welcome,
  'directory': Directory,
  'file': File,
  'image': Image,
  'markdown': Markdown,
  'html': HTML,
  'loading': Loading
}

const DAT_PROTOCOL = 'dat://'

export default class App extends Component {
  constructor (props) {
    super(props)

    this.state = {
      page: 'welcome',
      url: 'dat://',
      data: null
    }

    this.history = []

    this.dat = new Dat({
      db: (path) => {
        const finalPath = RNFS.CachesDirectoryPath + '/' + path
        return storage(finalPath)
      }
    })

    this.input = null

    this.navigateTo = (url) => {
      this.history.push(this.state.url)
      // Navigating
      if((url + '') === 'dat://') {
        this.setState({
          url,
          page: 'welcome'
        })
      } else {
        this.setState({
          url,
          page: 'browser'
        })
      }
    }

    this.goBack = () => {
      const url = this.history.pop()
      this.navigateTo(url)
      this.history.pop()
    }

    this.navigateToCurrentURL = () => {
      this.navigateTo(this.state.url)
    }
    this.setInputRef = (input) => {
      this.input = input
    }
  }

  componentDidMount () {
    BackHandler.addEventListener('hardwareBackPress', () => {
      if (!this.history.length) return false

      this.goBack()

      return true
    })

    Linking.getInitialURL().then((url) => {
      if (url) {
        this.navigateTo(url)
      }
    }).catch(err => console.error('An error occurred', err))
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
            title='Back'
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
            title='Go'
            onPress={() => this.navigateToCurrentURL()}
          />
        </View>
        <View style={styles.container}>
          <RenderComponent url={this.state.url} navigateTo={this.navigateTo} dat={this.dat} />
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
