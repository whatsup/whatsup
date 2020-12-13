import resolve from '@rollup/plugin-commonjs'
import commonjs from '@rollup/plugin-node-resolve'
import typescript from 'rollup-plugin-typescript2'
import autoExternal from 'rollup-plugin-auto-external'
import clear from 'rollup-plugin-delete'
import pkg from './package.json'

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
        plugins: [autoExternal(), resolve(), commonjs(), typescript(), clear({ targets: './dist' })],
    },
]
