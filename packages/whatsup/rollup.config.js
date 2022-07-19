import { babel } from '@rollup/plugin-babel'
import resolve from '@rollup/plugin-node-resolve'
import autoExternal from 'rollup-plugin-auto-external'

const extensions = ['.ts', '.tsx']

export default ['core', 'jsx', 'cssx', 'route'].map((pkg) => ({
    input: `src/${pkg}.ts`,
    output: {
        file: `dist/${pkg}.js`,
        format: 'esm',
        sourcemap: true,
    },
    plugins: [
        autoExternal(),
        resolve({
            extensions,
        }),
        babel({
            extensions,
            babelHelpers: 'bundled',
        }),
    ],
}))
