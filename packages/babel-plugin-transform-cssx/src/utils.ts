import genericNames from 'generic-names'
import { IS_PRODUCTION } from './constants'

export const generateScopedName = genericNames(IS_PRODUCTION ? '[hash:base64:8]' : '[name]__[local]--[hash:base64:5]')
