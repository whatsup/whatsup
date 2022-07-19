import './init'
import { resolve } from 'path'
import { transformFileSync } from '@babel/core'
import plugin from '../../src'

export function transform(path: string) {
    const sourceRoot = resolve(__dirname, '../__fixtures__')
    const filename = resolve(sourceRoot, path)

    return transformFileSync(filename, { plugins: [plugin], sourceRoot })!.code
}
