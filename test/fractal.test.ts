import { fractal, isFractal } from '../src/fractal'
import { ContextQuery, BuilderQuery } from '../src/queries'
import { createContext } from '../src/context'
import { livening, executing } from '../src/builders'
import { LiveFrame, Frame } from '../src/frame'
import { isAsyncGenerator } from '../src/utils'

describe('Fractal', () => {
    it('isFractal', () => {
        const Frac = fractal(async function* Hello() {
            return 'Hello!'
        })

        expect(isFractal(Frac)).toBeTruthy()
        expect(isFractal({})).toBeFalsy()
        expect(isFractal(function () {})).toBeFalsy()
        expect(isFractal(void 0)).toBeFalsy()
        expect(isFractal(null)).toBeFalsy()
        expect(isFractal('primitive')).toBeFalsy()
        expect(isFractal({})).toBeFalsy()
    })

    describe('yield loop live', () => {
        const result = 'Hello'
        const Frac = fractal(async function* _Frac() {
            while (true) yield result
        })
        const generator = async function* () {
            while (true) yield yield* Frac
        }
        const context = createContext(null, generator, { name: 'Root', delegation: true })
        const iterator = Frac[Symbol.asyncIterator]()

        it('yield loop live: need Context', async () => {
            const exp = { value: ContextQuery, done: false }
            await expect(iterator.next()).resolves.toStrictEqual(exp)
        })

        it('yield loop live: need Builder', async () => {
            const exp = { value: BuilderQuery, done: false }
            await expect(iterator.next(context)).resolves.toStrictEqual(exp)
        })

        it('yield loop live: yield LiveFrame', async () => {
            const exp = { value: new LiveFrame(result, new Promise(() => {})), done: false }
            await expect(iterator.next(livening)).resolves.toStrictEqual(exp)
        })

        it('yield loop live: return result', async () => {
            const exp = { value: result, done: true }
            await expect(iterator.next(result)).resolves.toStrictEqual(exp)
        })
    })

    describe('yield loop exec', () => {
        const result = 'Hello'
        const Frac = fractal(async function* _Frac() {
            while (true) yield result
        })
        const generator = async function* () {
            while (true) yield yield* Frac
        }
        const context = createContext(null, generator, { name: 'Root' })
        const iterator = Frac[Symbol.asyncIterator]()

        it('yield loop exec: need Context', async () => {
            const exp = { value: ContextQuery, done: false }
            await expect(iterator.next()).resolves.toStrictEqual(exp)
        })

        it('yield loop exec: need Builder', async () => {
            const exp = { value: BuilderQuery, done: false }
            await expect(iterator.next(context)).resolves.toStrictEqual(exp)
        })

        it('yield loop exec: yield Frame', async () => {
            const exp = { value: new Frame(result), done: false }
            await expect(iterator.next(executing)).resolves.toStrictEqual(exp)
        })

        it('yield loop exec: return result', async () => {
            const exp = { value: result, done: true }
            await expect(iterator.next(result)).resolves.toStrictEqual(exp)
        })
    })

    describe('return (no loop) live', () => {
        const result = 'Hello'
        const Frac = fractal(async function* _Frac() {
            return result
        })
        const generator = async function* () {
            while (true) yield yield* Frac
        }
        const context = createContext(null, generator, { name: 'Root' })
        const iterator = Frac[Symbol.asyncIterator]()

        it('return (no loop) live: need Context', async () => {
            const exp = { value: ContextQuery, done: false }
            await expect(iterator.next()).resolves.toStrictEqual(exp)
        })

        it('return (no loop) live: need Builder', async () => {
            const exp = { value: BuilderQuery, done: false }
            await expect(iterator.next(context)).resolves.toStrictEqual(exp)
        })

        it('return (no loop) live: yield LiveFrame', async () => {
            const exp = { value: new LiveFrame(result, new Promise(() => {})), done: false }
            await expect(iterator.next(livening)).resolves.toStrictEqual(exp)
        })

        it('return (no loop) live: return result', async () => {
            const exp = { value: result, done: true }
            await expect(iterator.next(result)).resolves.toStrictEqual(exp)
        })
    })

    describe('return (no loop) exec', () => {
        const result = 'Hello'
        const Frac = fractal(async function* _Frac() {
            return result
        })
        const generator = async function* () {
            while (true) yield yield* Frac
        }
        const context = createContext(null, generator, { name: 'Root' })
        const iterator = Frac[Symbol.asyncIterator]()

        it('return (no loop) exec: need Context', async () => {
            const exp = { value: ContextQuery, done: false }
            await expect(iterator.next()).resolves.toStrictEqual(exp)
        })

        it('return (no loop) exec: need Builder', async () => {
            const exp = { value: BuilderQuery, done: false }
            await expect(iterator.next(context)).resolves.toStrictEqual(exp)
        })

        it('return (no loop) exec: yield Frame', async () => {
            const exp = { value: new Frame(result), done: false }
            await expect(iterator.next(executing)).resolves.toStrictEqual(exp)
        })

        it('return (no loop) exec: return result', async () => {
            const exp = { value: result, done: true }
            await expect(iterator.next(result)).resolves.toStrictEqual(exp)
        })
    })

    describe('flatten nested fractal', () => {
        const result = 'Hello'
        const Nested = fractal(async function* _Frac() {
            while (true) yield result
        })
        const Frac = fractal(async function* _Frac() {
            while (true) yield yield* Nested
        })
        const generator = async function* () {
            while (true) yield yield* Frac
        }
        const context = createContext(null, generator, { name: 'Root' })
        const iterator = Frac[Symbol.asyncIterator]()

        // skip check ContextQuery
        iterator.next()
        iterator.next(context)

        it('flatten nested fractal: yield Frame', async () => {
            const exp = { value: new Frame(result), done: false }
            await expect(iterator.next(executing)).resolves.toStrictEqual(exp)
        })

        it('flatten nested fractal: return result', async () => {
            const exp = { value: result, done: true }
            await expect(iterator.next(result)).resolves.toStrictEqual(exp)
        })
    })

    describe('convert nested fractal to capture generator (delegation option by default is true)', () => {
        const Nested = fractal(async function* _Frac() {
            while (true) yield null
        })
        const Frac = fractal(async function* _Frac() {
            while (true) yield Nested
        })
        const generator = async function* () {
            while (true) yield yield* Frac
        }
        const context = createContext(null, generator, { name: 'Root' })
        const iterator = Frac[Symbol.asyncIterator]()

        // skip check ContextQuery
        iterator.next()
        iterator.next(context)

        it(`return Frame with generator`, async () => {
            const result = await iterator.next(executing)
            const frame = (result.value as unknown) as Frame<any>
            expect(isAsyncGenerator(frame.data)).toBeTruthy()
        })
    })

    describe('return Fractal as is when delegation option is false', () => {
        const Nested = fractal(async function* _Frac() {
            while (true) yield null
        })
        const Frac = fractal(
            async function* _Frac() {
                while (true) yield Nested
            },
            { delegation: false }
        )
        const generator = async function* () {
            while (true) yield yield* Frac
        }
        const context = createContext(null, generator, { name: 'Root' })
        const iterator = Frac[Symbol.asyncIterator]()

        // skip check ContextQuery
        iterator.next()
        iterator.next(context)

        it(`return Frame with Fractal`, async () => {
            const result = await iterator.next(executing)
            const frame = (result.value as unknown) as Frame<any>
            expect(frame.data).toBe(Nested)
        })
    })
})
