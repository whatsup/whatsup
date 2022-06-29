import { createKey } from '@whatsup/jsx'
import { Navigation, RootNavigation } from './navigation'

export const NAVIGATION = createKey<Navigation>(new RootNavigation())
