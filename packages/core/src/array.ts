import { createAtom, Atom } from './atom'
import { build } from './builder'

export class ArrayProxyHandler<T = unknown> implements ProxyHandler<T[]> {
    /* @internal */
    readonly atom: Atom<T[]>

    constructor(target: T[]) {
        this.atom = createAtom(() => target)
    }

    get(target: T[], prop: PropertyKey, receiver: any) {
        if (typeof prop === 'string' && (prop === 'length' || !isNaN(prop as any))) {
            const target = this.atom.get()
            return Reflect.get(target, prop, receiver)
        }

        if (
            prop === 'flat' ||
            prop === 'flatMap' ||
            prop === 'includes' ||
            prop === 'concat' ||
            prop === 'join' ||
            prop === 'slice' ||
            prop === 'every' ||
            prop === 'some' ||
            prop === 'forEach' ||
            prop === 'map' ||
            prop === 'filter' ||
            prop === 'reduce' ||
            prop === 'reduceRight' ||
            prop === 'indexOf' ||
            prop === 'lastIndexOf' ||
            prop === 'toString' ||
            prop === 'toLocaleString' ||
            prop === 'values' ||
            prop === Symbol.iterator
        ) {
            return (...args: any[]) => {
                const target = this.atom.get()
                const method = Reflect.get(target, prop, receiver)

                return method.apply(target, args)
            }
        }

        if (
            prop === 'push' ||
            prop === 'pop' ||
            prop === 'shift' ||
            prop === 'unshift' ||
            prop === 'reverse' ||
            prop === 'sort' ||
            prop === 'splice'
        ) {
            return (...args: any[]) => {
                const method = Reflect.get(target, prop, receiver)
                const result = method.apply(target, args)

                build((p) => {
                    for (const observer of this.atom.observers) {
                        p.rebuild(observer)
                    }
                })

                return result
            }
        }
    }

    set(target: T[], prop: PropertyKey, value: any, receiver: any) {
        if (typeof prop === 'string' && (prop === 'length' || !isNaN(prop as any))) {
            const result = Reflect.set(target, prop, value, receiver)

            build((p) => {
                for (const observer of this.atom.observers) {
                    p.rebuild(observer)
                }
            })

            return result
        }
        return Reflect.set(target, prop, value, receiver)
    }

    getPrototypeOf() {
        return Array.prototype
    }
}

export const array = <T>(items: T[] = []) => {
    const target = items.slice()
    const handler = new ArrayProxyHandler(target)

    return new Proxy(target, handler) as T[]
}
