import React from 'react'
import {
  Text,
  ScrollView
} from 'react-native'

export default function File (props) {
  const data = props.data

  return (
    <ScrollView>
      <Text>{data}</Text>
    </ScrollView>
  )
}
