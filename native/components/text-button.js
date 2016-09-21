import React from 'react'
import {
  View,
  Text,
  TouchableWithoutFeedback,
} from 'react-native'
import m from '../m.js'

const defaultStyle = {
  /* Put the padding and margin on the options so the click targets are larger */
  paddingVertical: 14,
  paddingHorizontal: 20,
}

const textStyle = {
  fontWeight: '600',
  fontSize: 14,
}

const getColor = (disabled, type) => {)
  if (disabled) {
    return '#CCC'
  } else if (type === 'bad') {
    return '#E33'
  } else if (type === 'secondary') {
    return '#4C4C4C'
  } else {
    return '#02b0c6'
  }
}

const TextButton = (props) => {
  const color = getColor(props.disabled, props.type);

  return (
    <TouchableWithoutFeedback
      onPress={ props.disabled ? () => {} : props.onClick }
      key={ props.label }
    >
      <View style={ defaultStyle } >
        <Text style={m(textStyle, { color })}>
          { props.label.toUpperCase() }
        </Text>
      </View>
    </TouchableWithoutFeedback>
  )
}

export default TextButton