import { createKey } from '@whatsup/jsx'
import { Navigator, RootNavigator } from './navigator'

export const NAVIGATOR = createKey<Navigator>(new RootNavigator())
