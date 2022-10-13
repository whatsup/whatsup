import { build } from './builder'

interface ActionFactory {
    <T, A>(cb: (...args: A[]) => T): (...args: A[]) => T
    (target: Object, prop: string, descriptor: PropertyDescriptor): void
}

export const action: ActionFactory = <T>(...args: any[]): any => {
    if (args.length === 1) {
        const [cb] = args as [(...args: any[]) => T]

        return <A>(...args: A[]) => build(() => cb(...args))
    }

    const [, , descriptor] = args as [Object, string, PropertyDescriptor]
    const original = descriptor.value as (...args: any[]) => T

    return {
        value(...args: any[]) {
            return build(() => original.apply(this, args))
        },
        configurable: false,
    }
}

export const runInAction = <T>(cb: () => T) => {
    return build(() => cb())
}
