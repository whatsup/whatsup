import { fraction, isFraction, Fraction } from '../src/fraction'
import { fractal } from '../src/fractal'
import { live } from '../src/runners'

describe('Fraction', () => {
    it('isFraction', () => {
        const Frac = fraction(null)

        expect(isFraction(Frac)).toBeTruthy()
        expect(isFraction({})).toBeFalsy()
        expect(isFraction(function () {})).toBeFalsy()
        expect(isFraction(void 0)).toBeFalsy()
        expect(isFraction(null)).toBeFalsy()
        expect(isFraction('primitive')).toBeFalsy()
        expect(isFraction({})).toBeFalsy()
    })

    it('use fractal as input of fraction', async () => {
        const One = fractal(async function* _One() {
            return 'One'
        })
        const Two = fractal(async function* _Two() {
            return 'Two'
        })
        const Hub = fraction(One)
        const App = fractal(async function* _App() {
            return yield* Hub
        })

        let frame = await live(App)

        expect(frame.data).toBe('One')

        Hub.use(Two)

        frame = await frame.next

        expect(frame.data).toBe('Two')
    })

    it('use promise as input of fraction', async () => {
        const Hub = fraction<string>('One')
        const App = fractal(async function* _App() {
            return yield* Hub
        })

        let frame = await live(App)

        expect(frame.data).toBe('One')

        Hub.use(
            new Promise<string>((r) => setTimeout(() => r('Two'), 300))
        )

        frame = await frame.next

        expect(frame.data).toBe('Two')
    })

    it('use promise with fractal as input of fraction', async () => {
        const Hub = fraction<string>('One')
        const App = fractal(async function* _App() {
            return yield* Hub
        })

        let frame = await live(App)

        expect(frame.data).toBe('One')

        Hub.use(
            new Promise<Fraction<string>>((r) => setTimeout(() => r(fraction('Two')), 300))
        )

        frame = await frame.next

        expect(frame.data).toBe('Two')
    })
})
