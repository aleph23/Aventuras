import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { PortalHost } from '@rn-primitives/portal'
import { Stack } from 'expo-router'
import { useEffect } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { KeyboardProvider } from 'react-native-keyboard-controller'

import '@/global.css'
import { db, ensureAppSettingsSingleton, useDbMigrations } from '@/lib/db'
import { DensityProvider } from '@/lib/density'
import { useDiagnosticsHydration } from '@/lib/diagnostics'
import { ThemeProvider } from '@/lib/themes'

export default function RootLayout() {
  const { success, error } = useDbMigrations()

  // Set the diagnostics master gate once migrations are applied. Resilient to
  // the settings row not existing yet (defaults OFF; dev build forces ON).
  useDiagnosticsHydration(success)

  // Seed the app_settings singleton (idempotent) once migrations are applied —
  // native after useMigrations succeeds, desktop after the main process has
  // migrated. Fire-and-forget: no M1 shell depends on it being present yet.
  useEffect(() => {
    if (success) void ensureAppSettingsSingleton(db)
  }, [success])

  // First render blocks until migrations finish — acceptable for M1 (no real
  // data, fast). Loading-state UX is a later concern.
  if (error) throw error
  if (!success) return null

  return (
    // eslint-disable-next-line react-native/no-inline-styles -- GestureHandlerRootView isn't NativeWind-wrapped; documented full-screen root pattern.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <ThemeProvider>
          <DensityProvider>
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
