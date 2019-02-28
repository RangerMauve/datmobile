import React from 'react'
import {
  ScrollView,
} from 'react-native'

import EasyMarkdown from 'react-native-easy-markdown';

export default function Markdown (props) {
  const data = props.data

  return (
    <ScrollView>
      <EasyMarkdown>{data}</EasyMarkdown>
    </ScrollView>
  )
}
