import { autorun, reaction } from '../src/reactions'
import { computed } from '../src/computed'
import { observable } from '../src/observable'

describe('Reactions', () => {
    describe('Reaction', () => {
        it(`should call onData callback when data received`, () => {
            const dataMock = jest.fn()
            const errMock = jest.fn()
            const data = observable(1)
            const target = computed(() => data.get())

            reaction(() => target.get(), dataMock, errMock)

            expect(dataMock).toBeCalledWith(1, undefined)

            data.set(2)

            expect(dataMock).toBeCalledWith(2, 1)

            expect(errMock).not.toBeCalled()
        })

        it(`should call onError callback when error received`, () => {
            const dataMock = jest.fn()
            const errMock = jest.fn()
            const target = computed(() => {
                throw 'Error'
            })

            reaction(() => target.get(), dataMock, errMock)

            expect(dataMock).not.toBeCalled()
            expect(errMock).toBeCalledWith('Error')
        })

        it(`should not call callbacks when disposed`, () => {
            const mock = jest.fn()
            const data = observable(1)
            const target = computed(() => data.get())
            const disposer = reaction(() => target.get(), mock)

            expect(mock).toBeCalledWith(1, undefined)

            disposer()
            data.set(2)

            expect(mock).toBeCalledTimes(1)
            expect(mock).toBeCalledWith(1, undefined)
        })
    })

    describe('Autorun', () => {
        it(`should call callback when depencencies changed`, () => {
            const mock = jest.fn()
            const one = observable(1)

            autorun(() => mock(one.get()))

            expect(mock).toBeCalledWith(1)

            one.set(2)

            expect(mock).toBeCalledWith(2)
        })

        it(`should not call callback when disposed`, () => {
            const mock = jest.fn()
            const one = observable(1)
            const disposer = autorun(() => mock(one.get()))

            expect(mock).toBeCalledWith(1)

            disposer()
            one.set(2)

            expect(mock).toBeCalledTimes(1)
            expect(mock).toBeCalledWith(1)
        })
    })
})
