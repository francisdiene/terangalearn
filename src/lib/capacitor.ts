/**
 * Utilitaires Capacitor — chargés uniquement sur mobile
 * Importer dans _app ou layout racine
 */

export const isCapacitor = () =>
  typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.()

export const getPlatform = (): 'android' | 'ios' | 'web' => {
  if (typeof window === 'undefined') return 'web'
  const cap = (window as any).Capacitor
  if (!cap?.isNativePlatform?.()) return 'web'
  return cap.getPlatform() as 'android' | 'ios'
}

/**
 * Initialise les plugins Capacitor (SplashScreen, StatusBar, App)
 * À appeler une seule fois au démarrage de l'app
 */
export async function initCapacitor() {
  if (!isCapacitor()) return

  try {
    const { SplashScreen } = await import('@capacitor/splash-screen')
    await SplashScreen.hide()
  } catch {}

  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    await StatusBar.setStyle({ style: Style.Light })
    await StatusBar.setBackgroundColor({ color: '#ffffff' })
  } catch {}

  // Gestion bouton retour Android
  try {
    const { App } = await import('@capacitor/app')
    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back()
      } else {
        App.exitApp()
      }
    })
  } catch {}
}
