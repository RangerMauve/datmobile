import React from 'react'
import {
  StyleSheet,
  View
} from 'react-native'

import { ProtocolWebView } from '../react-native-protocol-webview'

export default function ProtocolViewTest (props) {
  const { url } = props
  return (
    <View style={styles.webview}>
      <ProtocolWebView
        style={styles.webview}
        source={{ uri: url }}
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
