import React from 'react'
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
} from 'react-native'

export default function File (props) {
  const data = props.data
  const url = props.url

  return (
    <ScrollView>
      <Text>{data}</Text>
    </ScrollView>
  )
}
