import React from 'react'
import {
  StyleSheet,
  Text,
  View,
  Button,
  ScrollView,
} from 'react-native'

export default function Directory (props) {
  const data = props.data
  const navigateTo = props.navigateTo

  const buttons = data.map((file) => {
    const fileName = `./${file}`
    const label = `Navigate to ${file}`
    return (
      <Button
        key={file}
        title={fileName}
        onPress={() => navigateTo(fileName)}
        accessibilityLabel={label}
      />
    )
  })

  return (
    <ScrollView>
      {buttons}
    </ScrollView>
  )
}
