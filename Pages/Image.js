import React, {Component} from 'react'
import {
  StyleSheet,
  Image,
  ActivityIndicator,
  View,
} from 'react-native'

export default class ImageFile extends Component {
  constructor(props) {
    super(props)

    this.state = {
      layout: null
    }

    this.handleLayoutSet = ({nativeEvent}) => {
      const {layout} = nativeEvent
      console.log('Layout', layout)
      this.setState({layout})
    }
  }
  render () {
    if(!this.state.layout) {
      return (
        <View style={styles.container} onLayout={this.handleLayoutSet}>
          <ActivityIndicator />
        </View>
      )
    }

    const data = this.props.data

    return (
      <View style={styles.container} onLayout={this.handleLayoutSet}>
        <Image style={{
          width: this.state.layout.width,
          height: this.state.layout.height,
          resizeMode: 'contain',
        }} source={{uri: data}} />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  image: {
    width: 100,
    height: 100,
    resizeMode: 'contain'
  },
  container: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center'
  }
})
