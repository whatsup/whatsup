import { fractal } from '../src/fractal'

describe('Creating', () => {
    it('create new fractal without errors', () => {
        fractal(async function* _Frac() {
            return 'Hello!'
        })
    })

    it('create new fractal with args in generator and throw error', () => {
        const func = () =>
            fractal(async function* _Frac(arg: any) {
                arg
                return 'Hello!'
            } as any)

        expect(func).toThrow()
    })

    it('call fractal and throw error', () => {
        const Frac = fractal(async function* _Frac() {
            return 'Hello!'
        })

        expect(Frac).toThrow()
    })
})

describe('Naming', () => {
    it('fractal has name "User"', () => {
        const Frac = fractal(async function* User() {
            return 'Hello!'
        })
        expect(Frac.name).toBe('User')
    })

    it('fractal has default name "Fractal"', () => {
        const Frac = fractal(async function* () {
            return 'Hello!'
        })
        expect(Frac.name).toBe('Fractal')
    })
})

describe('Convert to string', () => {
    const Frac = fractal(async function* User() {
        return 'Hello!'
    })

    it('.toString() method return [fractal User]', () => {
        expect(`${Frac}`).toBe(`[fractal User]`)
    })
})
