import React from 'react'
import {
  Text,
  StyleSheet,
  ScrollView,
  Button
} from 'react-native'

const LINKS = [{
  title: 'Explore dat',
  link: 'dat://explore.beakerbrowser.com/'
}, {
  title: 'Dat Project Homepage',
  link: 'dat://datproject.org'
}, {
  title: 'Beaker Browser Homepage',
  link: 'dat://beakerbrowser.com/'
}, {
  title: "RangerMauve's Blog",
  link: 'dat://rangermauve.hashbase.io/posts/'
}]

export default function Welcome ({ navigateTo }) {
  return (
    <ScrollView>
      <Text style={styles.spacer}>Enter a `dat://` URl and hit Go!</Text>
      <Text style={styles.spacer}>Or click one of these links:</Text>
      {LINKS.map((info) => <Button key={info.link} title={info.title} onPress={() => navigateTo(info.link)} style={styles.spacer} />)}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  spacer: {
    marginBottom: 16
  }
})
