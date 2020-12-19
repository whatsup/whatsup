import { conse } from '../src/conse'
import { cause } from '../src/cause'
import { watch } from '../src/watcher'

describe('Watcher', () => {
    it(`should call onError when error`, () => {
        const dataMock = jest.fn()
        const errMock = jest.fn()
        const Num = conse(1)
        const Err = cause(function* () {
            while (true) {
                const n = yield* Num
                if (n < 0) {
                    throw 'Num less than 0'
                }
                yield yield* Num
            }
        })

        watch(Err, dataMock, errMock)

        expect(dataMock).toBeCalledTimes(1)
        expect(errMock).toBeCalledTimes(0)
        expect(dataMock).lastCalledWith(1)

        Num.set(-1)

        expect(dataMock).toBeCalledTimes(1)
        expect(errMock).toBeCalledTimes(1)
        expect(errMock).lastCalledWith('Num less than 0')
    })
})
