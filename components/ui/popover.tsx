import * as PopoverPrimitive from '@rn-primitives/popover'
import {
  createContext,
  Fragment,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ComponentProps,
} from 'react'
import { Platform, StyleSheet } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { FullWindowOverlay as RNFullWindowOverlay } from 'react-native-screens'

import { NativeOnlyAnimatedView } from '@/components/ui/native-only-animated-view'
import { TextClassContext } from '@/components/ui/text'
import { cn } from '@/lib/utils'

type PopoverRole = 'dialog' | 'menu'
type AutoFocusHandler = (event: Event) => void

type PopoverA11yValue = {
  ariaLabel?: string
  ariaLabelledBy?: string
  ariaDescribedBy?: string
  onOpenAutoFocus?: AutoFocusHandler
  onCloseAutoFocus?: AutoFocusHandler
  role: PopoverRole
  setRole: (role: PopoverRole) => void
}

const PopoverA11yContext = createContext<PopoverA11yValue | null>(null)

function usePopoverA11y(): PopoverA11yValue {
  const value = useContext(PopoverA11yContext)
  if (!value) {
    throw new Error('Popover subcomponents must be rendered inside <Popover>.')
  }
  return value
}

const FullWindowOverlay = Platform.OS === 'ios' ? RNFullWindowOverlay : Fragment

type PopoverProps = ComponentProps<typeof PopoverPrimitive.Root> & {
  ariaLabel?: string
  ariaLabelledBy?: string
  ariaDescribedBy?: string
  onOpenAutoFocus?: AutoFocusHandler
  onCloseAutoFocus?: AutoFocusHandler
}

function Popover({
  ariaLabel,
  ariaLabelledBy,
  ariaDescribedBy,
  onOpenAutoFocus,
  onCloseAutoFocus,
  children,
  ...rootProps
}: PopoverProps) {
  const [role, setRole] = useState<PopoverRole>('dialog')

  useEffect(() => {
    if (__DEV__ && ariaLabel === undefined && ariaLabelledBy === undefined) {
      console.warn(
        'Popover: pass `ariaLabel` or `ariaLabelledBy` for an accessible name, or `ariaLabel=""` to opt out.',
      )
    }
  }, [ariaLabel, ariaLabelledBy])

  const value = useMemo<PopoverA11yValue>(
    () => ({
      ariaLabel,
      ariaLabelledBy,
      ariaDescribedBy,
      onOpenAutoFocus,
      onCloseAutoFocus,
      role,
      setRole,
    }),
    [ariaLabel, ariaLabelledBy, ariaDescribedBy, onOpenAutoFocus, onCloseAutoFocus, role],
  )

  return (
    <PopoverA11yContext.Provider value={value}>
      <PopoverPrimitive.Root {...rootProps}>{children}</PopoverPrimitive.Root>
    </PopoverA11yContext.Provider>
  )
}

function PopoverTrigger(props: ComponentProps<typeof PopoverPrimitive.Trigger>) {
  const { role } = usePopoverA11y()
  // aria-haspopup is a web-only DOM attribute; RN's prop types don't model it.
  const webProps = Platform.OS === 'web' ? ({ 'aria-haspopup': role } as object) : null
  return <PopoverPrimitive.Trigger {...webProps} {...props} />
}

type PopoverContentProps = Omit<
  ComponentProps<typeof PopoverPrimitive.Content>,
  'accessibilityRole' | 'role'
> & {
  portalHost?: string
  accessibilityRole?: PopoverRole
}

function PopoverContent({
  className,
  align = 'center',
  sideOffset = 4,
  portalHost,
  accessibilityRole = 'dialog',
  ...props
}: PopoverContentProps) {
  const { ariaLabel, ariaLabelledBy, ariaDescribedBy, onOpenAutoFocus, onCloseAutoFocus, setRole } =
    usePopoverA11y()

  useEffect(() => {
    setRole(accessibilityRole)
  }, [accessibilityRole, setRole])

  // aria-describedby and onCloseAutoFocus are web-only — absent from the native API surface.
  const webProps =
    Platform.OS === 'web'
      ? ({ 'aria-describedby': ariaDescribedBy, onCloseAutoFocus } as object)
      : null

  return (
    <PopoverPrimitive.Portal hostName={portalHost}>
      <FullWindowOverlay>
        <PopoverPrimitive.Overlay style={Platform.select({ native: StyleSheet.absoluteFill })}>
          <NativeOnlyAnimatedView entering={FadeIn.duration(200)} exiting={FadeOut}>
            <TextClassContext.Provider value="text-fg-primary">
              <PopoverPrimitive.Content
                align={align}
                sideOffset={sideOffset}
                role={accessibilityRole}
                aria-label={ariaLabel}
                aria-labelledby={ariaLabelledBy}
                onOpenAutoFocus={onOpenAutoFocus}
                {...webProps}
                className={cn(
                  'z-50 w-72 rounded-md border border-border bg-bg-overlay p-4 outline-none',
                  // Web fade-in — native uses reanimated FadeIn.
                  Platform.select({ web: 'animate-fade-in' }),
                  className,
                )}
                {...props}
              />
            </TextClassContext.Provider>
          </NativeOnlyAnimatedView>
        </PopoverPrimitive.Overlay>
      </FullWindowOverlay>
    </PopoverPrimitive.Portal>
  )
}

export { Popover, PopoverContent, PopoverTrigger }
export type { PopoverRole }
