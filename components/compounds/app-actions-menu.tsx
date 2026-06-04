import { useRouter } from 'expo-router'

import { AppActionsMenuPure } from '@/components/compounds/app-actions-menu-pure'
import { appSettingsStore } from '@/lib/stores'

// Connected variant the chrome screens mount as `<AppActionsMenu />`. Reads the
// diagnostics gate through the selector (never a snapshot) and owns the
// Diagnostics-Hub navigation, so screens pass nothing.
export function AppActionsMenu() {
  const router = useRouter()
  const diagnosticsEnabled = appSettingsStore.useAppSettings((s) => s.diagnostics.enabled)
  return (
    <AppActionsMenuPure
      diagnosticsEnabled={diagnosticsEnabled}
      onOpenDiagnosticsHub={() => router.push('/diagnostics')}
    />
  )
}
