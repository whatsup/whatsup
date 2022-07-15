import { babel } from '@rollup/plugin-babel'
import resolve from '@rollup/plugin-node-resolve'
import autoExternal from 'rollup-plugin-auto-external'
import clear from 'rollup-plugin-delete'

const extensions = ['.ts', '.tsx']

export default [
    {
        input: 'src/index.ts',
        output: [
            {
                file: './dist/index.js',
                format: 'cjs',
                sourcemap: true,
            },
        ],
        plugins: [
            autoExternal(),
            resolve({
                extensions,
                modulesOnly: true,
            }),
            babel({
                extensions,
                babelHelpers: 'bundled',
            }),
            clear({
                targets: 'dist/*',
                runOnce: true,
            }),
        ],
    },
]
