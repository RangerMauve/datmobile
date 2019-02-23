import React from 'react'
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
} from 'react-native'

import EasyMarkdown from 'react-native-easy-markdown';

export default function Markdown (props) {
  const data = props.data
  const url = props.url

  return (
    <ScrollView>
      <EasyMarkdown>{data}</EasyMarkdown>
    </ScrollView>
  )
}
