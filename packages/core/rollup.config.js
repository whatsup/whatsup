import { babel } from '@rollup/plugin-babel'
import resolve from '@rollup/plugin-node-resolve'
import clear from 'rollup-plugin-delete'
import pkg from './package.json'

const extensions = ['.ts', '.tsx']

export default [
    {
        input: 'src/index.ts',
        output: [
            {
                file: pkg.main,
                format: 'cjs',
                sourcemap: true,
            },
            {
                file: pkg.module,
                format: 'esm',
                sourcemap: true,
            },
        ],
        plugins: [
            resolve({
                extensions,
            }),
            babel({
                babelHelpers: 'bundled',
                extensions,
            }),
            clear({
                targets: 'dist/*',
                runOnce: true,
            }),
        ],
    },
]
