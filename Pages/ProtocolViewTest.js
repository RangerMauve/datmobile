import React from 'react'
import {
  StyleSheet,
  View
} from 'react-native'

import { ProtocolWebView } from '../react-native-protocol-webview'

ProtocolWebView.registerStringProtocol('foobar', (request, cb) => {
  cb({
    mimeType: "text/html",
    data: `
    <h1>Hello World!</h1>
    <div>${request.url}</div>
    `
  })
})

export default function ProtocolViewTest (props) {
  const { url, dat } = props
  return (
    <View style={styles.webview}>
      <ProtocolWebView
        baseUrl={url}
        style={styles.webview}
        source={{ uri: 'foobar://example.com' }}
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
