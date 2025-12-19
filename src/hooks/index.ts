// Hooks de autenticação
export * from './useAuth';

// Hooks de tema
export * from './useTheme';

// Hooks de API e React Query
export * from './useApi';

// Hooks de formulários
export * from './useForm';

// Hooks de armazenamento
export * from './useStorage';

// Hooks utilitários
export * from './useUtils';

// Re-exportações organizadas por categoria
export {
  // Autenticação
  useAuth,
  useIsAuthenticated,
  useUserProfile,
  useUserStats,
  useIsEmailVerified,
  useHasCompletedOnboarding as useIsOnboardingComplete,
  useHasActiveSubscription as useIsSubscribed,
  useCanAccessPremium as useIsPremium,
  useCanAccessVIP as useIsVip,
  useUserPreferences as useAuthUserPreferences,
  useIsUserOnline as useUserOnlineStatus,
  useUserAvatar,
  useUserDisplayName,
  useCanEdit,
  useCanDelete,
  useIsAdmin,
  useIsModerator
} from './useAuth';

export {
  // Tema
  useTheme,
  useSystemTheme,
  useEffectiveTheme,
  useIsLightTheme,
  useIsDarkTheme,
  useToggleTheme as useThemeToggle,
  useThemeClass,
  useThemeStyles as useThemeStyle,
  useThemeColors,
  useSystemThemeChange,
  useThemePreferences as useThemePersistence,
  useApplyTheme as useThemeDocumentEffect,
  usePrefersReducedMotion as useReducedMotion,
  usePrefersHighContrast as useHighContrast
} from './useTheme';

export {
  // API e React Query
  useApiQuery,
  useApiMutation,
  useInfiniteApiQuery,
  useSearchQuery,
  useInvalidateQueries,
  useQueryCache,
  useOptimisticUpdate,
  useBackgroundSync,
  useRetryQuery,
  useConnectionStatus,
  useDependentQuery,
  useParallelQueries,
  usePollingQuery
} from './useApi';

export {
  // Formulários
  useForm,
  useValidation,
  useMultiStepForm,
  useAutoSave
} from './useForm';

export {
  // Armazenamento
  useLocalStorage,
  useSessionStorage,
  useStorageSync,
  useCacheStorage,
  useUserPreferences,
  useNavigationHistory,
  useFormDraft,
  useAppSettings,
  useStorageCapacity
} from './useStorage';

export {
  // Utilitários
  useDebounce,
  useThrottle,
  useClickOutside,
  useKeyPress,
  useHotkeys,
  useMediaQuery,
  useScreenSize,
  useClipboard,
  useOnlineStatus,
  usePageVisibility,
  useIdle,
  useGeolocation,
  useInfiniteScroll,
  useScrollDirection,
  useTimeout,
  useInterval,
  usePrevious,
  useToggle,
  useCounter,
  useArray
} from './useUtils';
