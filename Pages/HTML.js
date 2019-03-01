import React from 'react'
import {
  StyleSheet,
  View
} from 'react-native'

import { WebView } from 'react-native-webview'

export default function Markdown (props) {
  const data = props.data
  const url = props.url

  return (
    <View style={styles.webview}>
      <WebView
        baseUrl={url}
        style={styles.webview}
        source={{ html: data }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  webview: {
    flex: 1,
    alignSelf: 'stretch',
    overflow: 'hidden'
  }
})
