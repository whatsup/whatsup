import { observable } from '../src/observable'
import { computed } from '../src/computed'
import { whatsUp } from '../src/whatsup'

describe('Watcher', () => {
    it(`should call onerror when error`, () => {
        const dataMock = jest.fn()
        const errMock = jest.fn()
        const num = observable(1)
        const err = computed(function* () {
            while (true) {
                const n = num.get()
                if (n < 0) {
                    throw 'num less than 0'
                }
                yield num.get()
            }
        })

        whatsUp(err, dataMock, errMock)

        expect(dataMock).toBeCalledTimes(1)
        expect(errMock).toBeCalledTimes(0)
        expect(dataMock).lastCalledWith(1)

        num.set(-1)

        expect(dataMock).toBeCalledTimes(1)
        expect(errMock).toBeCalledTimes(1)
        expect(errMock).lastCalledWith('num less than 0')
    })
})
