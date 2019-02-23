import React from 'react'
import {
  Text,
  StyleSheet,
  ScrollView,
  Button,
} from 'react-native'

const LINKS = [{
  title: 'Dat Project Homepage',
  link: 'dat://60c525b5589a5099aa3610a8ee550dcd454c3e118f7ac93b7d41b6b850272330',
}, {
  title:"Beaker Browser Homepage",
  link: "dat://8bb99a0ac0d56131e61bd4bfea74ced9bc2c603e78e4eb72e8dd2fd6f33743cd/",
}, {
  title: "RangerMauve's Blog",
  link: 'dat://0a9e202b8055721bd2bc93b3c9bbc03efdbda9cfee91f01a123fdeaadeba303e/posts/'
}]

export default function Welcome ({navigateTo}) {

  return (
    <ScrollView>
      <Text style={styles.spacer}>Enter a `dat://` URl and hit Go!</Text>
      <Text style={styles.spacer}>Or click one of these links:</Text>
      {LINKS.map((info) => <Button key={info.link} title={info.title} onPress={() => navigateTo(info.link)} style={styles.spacer}/>)}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  spacer: {
    marginBottom: 16
  }
})
