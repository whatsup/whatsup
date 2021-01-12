import { cause } from '../src/cause'
import { whatsUp } from '../src/observer'

describe('Defer', () => {
    const delay = <T>(t: number) => new Promise<T>((r) => setTimeout(r, t))

    it(`should trigger context.update`, async () => {
        const mock = jest.fn()

        const cau = cause(function* (ctx) {
            ctx.defer(() => delay(300))
            yield 'Hello'
            yield 'World'
        })

        whatsUp(cau, mock)

        expect(mock).lastCalledWith('Hello')

        await delay(400)

        expect(mock).lastCalledWith('World')
    })

    it(`should return {done, value}`, async () => {
        const mock = jest.fn()

        const cau = cause(function* (ctx) {
            const result = ctx.defer(() => new Promise((r) => setTimeout(() => r('World'), 300)))
            yield { ...result }
            yield { ...result }
        })

        whatsUp(cau, mock)

        expect(mock.mock.calls[0][0]).toEqual({ done: false })

        await new Promise((r) => setTimeout(r, 400))

        expect(mock.mock.calls[1][0]).toEqual({ done: true, value: 'World' })
    })

    it(`should serve scopes`, async () => {
        const mock = jest.fn()

        const cau = cause(function* (ctx) {
            // this
            //                      and this
            // is
            //                      is
            // sync
            //                      async
            // flow
            //                      flow
            //
            let str = ''
            str += 'this '
            ctx.defer(async () => delay(0).then(() => (str += 'and this ')))
            str += 'is '
            ctx.defer(async () => delay(0).then(() => (str += 'is ')))
            str += 'sync '
            ctx.defer(async () => delay(0).then(() => (str += 'async ')))
            str += 'flow '
            ctx.defer(async () => delay(0).then(() => (str += 'flow ')))

            const result = ctx.defer(async () => str)

            yield str
            yield result.value
        })

        whatsUp(cau, mock)

        expect(mock).lastCalledWith('this is sync flow ')

        await new Promise((r) => setTimeout(r, 400))

        expect(mock).lastCalledWith('this is sync flow and this is async flow ')
    })

    it(`should preserves the order of scopes`, async () => {
        const mock = jest.fn()

        let a0: string, a1: string, a2: string, a3: string
        let b0: string, b1: string, b2: string, b3: string

        const cau = cause(function* (ctx) {
            let str = ''

            a0 = str += 'this '
            ctx.defer(async () => delay(0).then(() => (b0 = str += 'and this ')))
            a1 = str += 'is '
            ctx.defer(async () => delay(0).then(() => (b1 = str += 'is ')))
            a2 = str += 'sync '
            ctx.defer(async () => delay(0).then(() => (b2 = str += 'async ')))
            a3 = str += 'flow '
            ctx.defer(async () => delay(0).then(() => (b3 = str += 'flow ')))

            yield str
            yield ''
        })

        whatsUp(cau, mock)

        expect(mock).lastCalledWith('this is sync flow ')

        await new Promise((r) => setTimeout(r, 100))

        expect(a0!).toBe('this ')
        expect(a1!).toBe('this is ')
        expect(a2!).toBe('this is sync ')
        expect(a3!).toBe('this is sync flow ')
        expect(b0!).toBe('this is sync flow and this ')
        expect(b1!).toBe('this is sync flow and this is ')
        expect(b2!).toBe('this is sync flow and this is async ')
        expect(b3!).toBe('this is sync flow and this is async flow ')
    })
})
