import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { PortalHost } from '@rn-primitives/portal'
import { Stack } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { KeyboardProvider } from 'react-native-keyboard-controller'

import { DensityProvider } from '@/lib/density/density-provider'
import { ThemeProvider } from '@/lib/themes/theme-provider'
import '@/global.css'

export default function RootLayout() {
  return (
    // eslint-disable-next-line react-native/no-inline-styles -- GestureHandlerRootView isn't NativeWind-wrapped; documented full-screen root pattern.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <ThemeProvider>
          <DensityProvider>
            {/* BottomSheetModalProvider must sit inside ThemeProvider — its
                internal portal re-mounts gorhom sheet children, and React
                context only propagates through that portal if the provider
                is an ancestor of the portal host. */}
            <BottomSheetModalProvider>
              <Stack screenOptions={{ headerShown: false }} />
              <PortalHost />
            </BottomSheetModalProvider>
          </DensityProvider>
        </ThemeProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  )
}
