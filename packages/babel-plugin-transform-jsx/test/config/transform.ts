import './init'
import { transform as babelTransform } from '@babel/core'
import plugin from '../../src'

export function transform(input: string) {
    return babelTransform(input, { plugins: [plugin] })!.code
}
