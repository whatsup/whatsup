export type ContextQuery = typeof ContextQuery
export const ContextQuery = Symbol('Get parent context')

export type BuilderQuery = typeof BuilderQuery
export const BuilderQuery = Symbol('Get builder')

export function isContextQuery(arg: any): arg is ContextQuery {
    return arg === ContextQuery
}

export function isBuilderQuery(arg: any): arg is BuilderQuery {
    return arg === BuilderQuery
}
