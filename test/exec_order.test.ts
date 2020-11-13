import { fractal } from '../src/fractal'
import { fraction } from '../src/fraction'
import { stream } from '../src/runners'

describe('Execution order', () => {
    const delay = (time: number) => new Promise((r) => setTimeout(r, time))

    it('normal updating from bottom to up', async () => {
        const ids = [] as number[]
        const App = fractal(async function* _App() {
            while (true) {
                ids.push(1)
                yield yield* One
            }
        })
        const One = fractal(async function* _One() {
            while (true) {
                ids.push(2)
                yield yield* Two
            }
        })
        const Two = fractal(async function* _Two() {
            while (true) {
                ids.push(3)
                yield yield* Hub
            }
        })
        const Hub = fraction(1)
        const st = await stream(App)

        expect((await st.next()).value).toBe(1)
        expect(ids).toEqual(expect.arrayContaining([1, 2, 3]))

        Hub.set(2)

        expect((await st.next()).value).toBe(2)
        expect(ids).toEqual(expect.arrayContaining([1, 2, 3, 3, 2, 1]))
    })

    it('non-blocking parallel updating', async () => {
        const ids = [] as number[]
        const Trigger1 = fraction(1)
        const Trigger2 = fraction(2)
        const App = fractal(async function* _App() {
            while (true) {
                ids.push(1)
                yield `${yield* One}:${yield* Two}`
            }
        })
        const One = fractal(async function* _One() {
            while (true) {
                ids.push(2)
                yield yield* Trigger1
            }
        })
        const Two = fractal(async function* _Two() {
            while (true) {
                ids.push(3)
                yield yield* Trigger2
            }
        })

        const st = stream(App)

        expect((await st.next()).value).toBe('1:2')
        expect(ids).toEqual(expect.arrayContaining([1, 2, 3]))

        Trigger1.set(
            new Promise<number>((r) => setTimeout(() => r(11), 600)) as any
        )
        Trigger2.set(
            new Promise<number>((r) => setTimeout(() => r(22), 300)) as any
        )

        expect((await st.next()).value).toBe('1:22')
        expect(ids).toEqual(expect.arrayContaining([1, 2, 3, 3, 1]))

        expect((await st.next()).value).toBe('11:22')
        expect(ids).toEqual(expect.arrayContaining([1, 2, 3, 3, 1, 2, 1]))
    })

    it('delegation', async () => {
        const mock = jest.fn((v) => v)
        const ids = [] as number[]
        const Trigger1 = fraction(1)
        const Trigger2 = fraction(1)
        const Top = fractal(async function* _App() {
            while (true) {
                ids.push(1)
                yield mock(yield* Middle)
            }
        })
        const Middle = fractal(async function* _One() {
            while (true) {
                ids.push(2)
                yield* Trigger1
                yield Bottom
            }
        })
        const Bottom = fractal(async function* _Two() {
            while (true) {
                ids.push(3)
                yield yield* Trigger2
            }
        })

        const st = stream(Top)

        await st.next()

        expect(mock).lastCalledWith(1)
        expect(ids).toEqual(expect.arrayContaining([1, 2, 3]))

        Trigger2.set(2)

        await st.next()

        expect(mock).lastCalledWith(2)
        expect(ids).toEqual(expect.arrayContaining([1, 2, 3, 3, 1]))

        Trigger1.set(2)
        await delay(100)

        expect(mock).lastCalledWith(2)
        expect(ids).toEqual(expect.arrayContaining([1, 2, 3, 3, 1, 3, 2, 1]))
    })
})
