import { whatsUp } from '../src/whatsup'
import { Observable } from '../src/observable'
import { Computed } from '../src/computed'

describe('Computed', () => {
    it(`should react on observable change`, () => {
        const mock = jest.fn()
        const observable = new Observable(1)
        const computed = new Computed(() => observable.get() + 1)

        whatsUp(computed as any, mock)

        expect(mock).toBeCalledWith(2)

        observable.set(2)

        expect(mock).toBeCalledWith(3)
    })

    it(`no react after disposed`, () => {
        const mock = jest.fn()
        const observable = new Observable(1)
        const computed = new Computed(() => {
            mock()
            return observable.get() + 1
        })

        const dispose = whatsUp(computed as any)

        expect(mock).toBeCalledTimes(1)

        observable.set(2)

        expect(mock).toBeCalledTimes(2)

        dispose()

        observable.set(3)

        expect(mock).toBeCalledTimes(2)
    })

    it(`no recalc when observed`, () => {
        const mock = jest.fn()
        const observable = new Observable(1)
        const computed = new Computed(() => {
            mock()
            return observable.get() + 1
        })

        const dispose = whatsUp(computed as any)

        expect(mock).toBeCalledTimes(1)

        computed.get()

        expect(mock).toBeCalledTimes(1)

        dispose()

        computed.get()

        expect(mock).toBeCalledTimes(2)
    })

    it(`recalc when not observed`, () => {
        const mock = jest.fn()
        const observable = new Observable(1)
        const computed = new Computed(() => {
            mock()
            return observable.get() + 1
        })

        computed.get()

        expect(mock).toBeCalledTimes(1)

        computed.get()

        expect(mock).toBeCalledTimes(2)

        whatsUp(computed as any)

        expect(mock).toBeCalledTimes(3)

        computed.get()

        expect(mock).toBeCalledTimes(3)
    })

    it(`should react on many observables`, () => {
        const mock = jest.fn()
        const one = new Observable(1)
        const two = new Observable(2)
        const computed = new Computed(() => one.get() + two.get())

        whatsUp(computed as any, mock)

        expect(mock).toBeCalledWith(3)

        one.set(2)

        expect(mock).toBeCalledWith(4)

        two.set(3)

        expect(mock).toBeCalledWith(5)
    })
})
