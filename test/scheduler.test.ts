import { action } from '../src/scheduler'
import { conse } from '../src/conse'
import { cause } from '../src/cause'
import { whatsUp } from '../src/whatsUp'

describe('Scheduler', () => {
    it(`Should run every change in personal transaction`, () => {
        const mock = jest.fn()
        const a = conse('a')
        const b = conse('b')
        const c = cause(function* () {
            while (true) {
                yield `${yield* a}${yield* b}c`
            }
        })
        whatsUp(c, mock)

        expect(mock).toBeCalledTimes(1)
        expect(mock).lastCalledWith('abc')

        a.set('A')
        b.set('B')

        expect(mock).toBeCalledTimes(3)
        expect(mock).nthCalledWith(2, 'Abc')
        expect(mock).nthCalledWith(3, 'ABc')
    })

    it(`Should run all changes in single transaction`, () => {
        const mock = jest.fn()
        const a = conse('a')
        const b = conse('b')
        const c = cause(function* () {
            while (true) {
                yield `${yield* a}${yield* b}c`
            }
        })
        whatsUp(c, mock)

        expect(mock).toBeCalledTimes(1)
        expect(mock).lastCalledWith('abc')

        action(() => {
            a.set('A')
            b.set('B')
        })
        expect(mock).toBeCalledTimes(2)
        expect(mock).nthCalledWith(2, 'ABc')
    })

    it(`Should create slave transaction when call 'transaction' inside transaction`, () => {
        const mockB = jest.fn()
        const mockC = jest.fn()
        const a = conse('a')
        const b = cause(function* () {
            while (true) {
                c.set(`${yield* a}b`)
                yield `${yield* a}b`
            }
        })
        const c = conse('c')

        whatsUp(c, mockC)

        expect(mockC).toBeCalledTimes(1)
        expect(mockC).lastCalledWith('c')

        whatsUp(b, mockB)

        expect(mockB).toBeCalledTimes(1)
        expect(mockB).lastCalledWith('ab')

        a.set('A')

        expect(mockB).toBeCalledTimes(2)
        expect(mockB).lastCalledWith('Ab')
        expect(mockC).toBeCalledTimes(3)
        expect(mockC).lastCalledWith('Ab')
    })

    it(`Should create & add atoms to current slave transaction when call 'transaction' inside transaction`, () => {
        const mockB = jest.fn()
        const mockC = jest.fn()
        const mockD = jest.fn()
        const a = conse('a')
        const b = cause(function* () {
            while (true) {
                c.set(`${yield* a}b`)
                d.set(`${yield* a}b`)
                yield `${yield* a}b`
            }
        })
        const c = conse('c')
        const d = conse('d')

        whatsUp(d, mockD)

        expect(mockD).toBeCalledTimes(1)
        expect(mockD).lastCalledWith('d')

        whatsUp(c, mockC)

        expect(mockC).toBeCalledTimes(1)
        expect(mockC).lastCalledWith('c')

        whatsUp(b, mockB)

        expect(mockB).toBeCalledTimes(1)
        expect(mockB).lastCalledWith('ab')

        a.set('A')

        expect(mockB).toBeCalledTimes(2)
        expect(mockB).lastCalledWith('Ab')
        expect(mockD).toBeCalledTimes(3)
        expect(mockD).lastCalledWith('Ab')
        expect(mockD).toBeCalledTimes(3)
        expect(mockD).lastCalledWith('Ab')
    })

    describe('should recalc only dirty streams', () => {
        const mock = jest.fn()
        const mockWallet = jest.fn()
        const mockUser = jest.fn()
        const Balance = conse(100)
        const Name = conse<string>('John')
        const Wallet = cause(function* () {
            while (true) {
                mockWallet()
                yield `Wallet ${yield* Balance}`
            }
        })
        const User = cause(function* () {
            while (true) {
                mockUser()
                yield `User ${yield* Name}`
            }
        })
        const App = cause(function* () {
            while (true) yield `App ${yield* User} ${yield* Wallet}`
        })

        whatsUp(App, mock)

        it(`mock to be called 1 time with "App User John Wallet 100"`, () => {
            expect(mock).toBeCalledTimes(1)
            expect(mockWallet).toBeCalledTimes(1)
            expect(mockUser).toBeCalledTimes(1)
            expect(mock).lastCalledWith('App User John Wallet 100')
        })

        it(`"Barry" as Name and mockWallet to not be called`, () => {
            Name.set('Barry')
            expect(mock).toBeCalledTimes(2)
            expect(mockWallet).toBeCalledTimes(1)
            expect(mockUser).toBeCalledTimes(2)
            expect(mock).lastCalledWith('App User Barry Wallet 100')
        })

        it(`"200" as Balance and mockUser to not be called`, () => {
            Balance.set(200)
            expect(mock).toBeCalledTimes(3)
            expect(mockWallet).toBeCalledTimes(2)
            expect(mockUser).toBeCalledTimes(2)
            expect(mock).lastCalledWith('App User Barry Wallet 200')
        })
    })
})
