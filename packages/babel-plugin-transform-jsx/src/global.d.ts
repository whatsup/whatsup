declare module '@babel/plugin-syntax-jsx' {
    const defaultExport: any
    export default defaultExport
}

declare module '@babel/helper-module-imports' {
    import { Node, NodePath } from '@babel/core'
    import { Identifier } from '@babel/types'

    type ImportOptions = {
        importedSource?: string | null
        importedType?: 'es6' | 'commonjs'
        importedInterop?: 'babel' | 'node' | 'compiled' | 'uncompiled'
        importingInterop?: 'babel' | 'node'
        ensureLiveReference?: boolean
        ensureNoContext?: boolean
    }

    export function addNamed<T extends Node>(
        path: NodePath<T>,
        name: string,
        importedSource: string,
        opts: ImportOptions
    ): Identifier

    const defaultExport: any
    export default defaultExport
}
