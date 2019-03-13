import React, { Component } from 'react'
import {
  StyleSheet,
  View
} from 'react-native'

import { DatWebView } from '../react-native-dat-webview'

export default class Browser extends Component {
  constructor (props) {
    super(props)

    this.onLoadStart = ({ nativeEvent }) => {
      const { url } = nativeEvent
      this.props.navigateTo(url)
    }
  }

  render () {
    const { url, dat } = this.props
    return (
      <View style={styles.webview}>
        <DatWebView
          style={styles.webview}
          source={{ uri: url }}
          dat={dat}
          onLoadStart={this.onLoadStart}
        />
      </View>
    )
  }
}
const styles = StyleSheet.create({
  webview: {
    flex: 1,
    alignSelf: 'stretch',
    overflow: 'hidden'
  }
})
