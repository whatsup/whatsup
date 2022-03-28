import { whatsUp } from '../src/whatsup'
import { computed } from '../src/computed'

describe('whatsUp', () => {
    it(`should call onData callback when data received`, () => {
        const dataMock = jest.fn()
        const errMock = jest.fn()
        const target = computed(function* () {
            yield 'Data'
        })

        whatsUp(target, dataMock, errMock)

        expect(dataMock).toBeCalledWith('Data')
        expect(errMock).not.toBeCalled()
    })

    it(`should call onError callback when error received`, () => {
        const dataMock = jest.fn()
        const errMock = jest.fn()
        const target = computed(function* () {
            throw 'Error'
        })

        whatsUp(target, dataMock, errMock)

        expect(dataMock).not.toBeCalled()
        expect(errMock).toBeCalledWith('Error')
    })
})
