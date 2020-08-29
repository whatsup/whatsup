import { fractal } from '../src/fractal'
import { factor } from '../src/factor'
import { live } from '../src'

describe('Factors', () => {
    it('branch set "plain" and expect "plain"', async () => {
        const branch = factor<'plain' | 'jsx'>()
        const Top = fractal(async function* _App() {
            yield* branch('plain')
            return yield* Bottom
        })
        const Bottom = fractal(async function* _One() {
            return yield* branch
        })

        const frame = await live(Top)

        expect(frame.data).toBe('plain')
    })
    it('branch with default value "plain" expect "plain"', async () => {
        const branch = factor<'plain' | 'jsx'>('plain')
        const Top = fractal(async function* _App() {
            return yield* Bottom
        })
        const Bottom = fractal(async function* _One() {
            return yield* branch
        })

        const frame = await live(Top)

        expect(frame.data).toBe('plain')
    })
    it('branch set "plain" and expect it .is("plain") === true', async () => {
        const branch = factor<'plain' | 'jsx'>()

        const Top = fractal(async function* _App() {
            yield* branch('plain')
            return yield* Bottom
        })
        const Bottom = fractal(async function* _One() {
            return yield* branch.is('plain')
        })

        const frame = await live(Top)

        expect(frame.data).toBe(true)
    })
    it('branch set "plain" and redefine it to "jsx" in middle level', async () => {
        const branch = factor<'plain' | 'jsx'>()
        const Top = fractal(async function* _App() {
            yield* branch('plain')
            return yield* Middle
        })
        const Middle = fractal(async function* _One() {
            yield* branch('jsx')
            return `${yield* branch}|${yield* Bottom}`
        })
        const Bottom = fractal(async function* _One() {
            return yield* branch
        })

        const frame = await live(Top)

        expect(frame.data).toBe('plain|jsx')
    })
    it('branch with default value "plain" set "jsx" and reset it in back to default middle level', async () => {
        const branch = factor<'plain' | 'jsx'>('plain')
        const Top = fractal(async function* _App() {
            yield* branch('jsx')
            return yield* Middle
        })
        const Middle = fractal(async function* _One() {
            yield* branch()
            return `${yield* branch}|${yield* Bottom}`
        })

        const Bottom = fractal(async function* _One() {
            return yield* branch
        })

        const frame = await live(Top)

        expect(frame.data).toBe('jsx|plain')
    })
    it('branch set "plain" & "jsx" in parallel contexts', async () => {
        const branch = factor<'plain' | 'jsx'>()
        const Top = fractal(async function* _App() {
            return `${yield* One}|${yield* Two}`
        })
        const One = fractal(async function* _One() {
            yield* branch('plain')
            return yield* Bottom
        })
        const Two = fractal(async function* _One() {
            yield* branch('jsx')
            return yield* Bottom
        })
        const Bottom = fractal(async function* _One() {
            return yield* branch
        })

        const frame = await live(Top)

        expect(frame.data).toBe('plain|jsx')
    })
    it('test set branch with delegation', async () => {
        const branch = factor<'plain' | 'jsx'>()
        const Top = fractal(async function* _App() {
            return yield* Middle
        })
        const Middle = fractal(async function* _One() {
            yield* branch('plain')
            return Bottom
        })
        const Bottom = fractal(async function* _One() {
            return yield* branch
        })

        const frame = await live(Top)

        expect(frame.data).toBe('plain')
    })
})
