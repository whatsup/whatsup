import { Context, createContext, contextCapture } from '../src/context'
import { Bubble } from '../src/typings'
import { ContextQuery } from '../src/queries'
import { Fractal } from '../src/fractal'

describe('Context', () => {
    const generator = async function* () {} as <T>() => AsyncIterator<Bubble<T>, T>
    let root: Context<any>
    let child: Context<any>

    it('create root context without errors', () => {
        root = createContext<string>(null, generator, { name: 'Root' })
        expect(root).toEqual(expect.objectContaining({ name: 'Root', generator }))
    })

    it('create child context without errors', () => {
        child = createContext<string>(root, generator, { name: 'Child' })
        expect(child).toEqual(expect.objectContaining({ name: 'Child', generator }))
    })

    it('root is a proto of child context', () => {
        expect(Object.getPrototypeOf(child)).toBe(root)
    })

    describe('context capture', () => {
        const createFakeFractal = () => {
            return {
                async *[Symbol.asyncIterator]() {
                    return yield ContextQuery
                },
            } as Fractal<any>
        }

        it('expected root context', () => {
            const Target = createFakeFractal()
            const captured = contextCapture(Target, root)
            const iterator = captured()

            expect(iterator.next()).resolves.toStrictEqual({ done: true, value: root })
        })
    })
})
