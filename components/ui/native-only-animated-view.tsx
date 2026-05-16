import type { ComponentProps, ReactNode, RefAttributes } from 'react'
import { Platform } from 'react-native'
import Animated from 'react-native-reanimated'

function NativeOnlyAnimatedView(
  props: ComponentProps<typeof Animated.View> & RefAttributes<typeof Animated.View>,
) {
  if (Platform.OS === 'web') {
    return <>{props.children as ReactNode}</>
  }
  return <Animated.View {...props} />
}

export { NativeOnlyAnimatedView }
