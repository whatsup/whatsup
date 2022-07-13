import { autorun, reaction } from '../src/reactions'
import { computed } from '../src/computed'
import { observable } from '../src/observable'

describe('Reactions', () => {
    describe('Reaction', () => {
        it(`should call onData callback when data received`, () => {
            const dataMock = jest.fn()
            const errMock = jest.fn()
            const data = observable(1)
            const target = computed(() => data())

            reaction(() => target(), dataMock, errMock)

            expect(dataMock).lastCalledWith(1, undefined)

            data(2)

            expect(dataMock).lastCalledWith(2, 1)

            expect(errMock).not.toBeCalled()
        })

        it(`should call onError callback when error received`, () => {
            const dataMock = jest.fn()
            const errMock = jest.fn()
            const target = computed(() => {
                throw 'Error'
            })

            reaction(() => target(), dataMock, errMock)

            expect(dataMock).not.toBeCalled()
            expect(errMock).lastCalledWith('Error')
        })

        it(`should not call callbacks when disposed`, () => {
            const mock = jest.fn()
            const data = observable(1)
            const target = computed(() => data())
            const disposer = reaction(() => target(), mock)

            expect(mock).lastCalledWith(1, undefined)

            disposer()
            data(2)

            expect(mock).toBeCalledTimes(1)
            expect(mock).lastCalledWith(1, undefined)
        })
    })

    describe('Autorun', () => {
        it(`should call callback when depencencies changed`, () => {
            const mock = jest.fn()
            const one = observable(1)

            autorun(() => mock(one()))

            expect(mock).lastCalledWith(1)

            one(2)

            expect(mock).lastCalledWith(2)
        })

        it(`should not call callback when disposed`, () => {
            const mock = jest.fn()
            const one = observable(1)
            const disposer = autorun(() => mock(one()))

            expect(mock).lastCalledWith(1)

            disposer()
            one(2)

            expect(mock).toBeCalledTimes(1)
            expect(mock).lastCalledWith(1)
        })
    })
})
