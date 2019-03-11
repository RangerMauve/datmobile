import React from 'react'
import {
  StyleSheet,
  View
} from 'react-native'

import { DatWebView } from '../react-native-dat-webview'

export default function Browser (props) {
  const { url, dat } = props
  return (
    <View style={styles.webview}>
      <DatWebView
        style={styles.webview}
        source={{ uri: url }}
        dat={dat}
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
