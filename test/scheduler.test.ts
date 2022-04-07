import { action } from '../src/scheduler'
import { observable } from '../src/observable'
import { computed } from '../src/computed'
import { whatsUp } from '../src/whatsup'

describe('Scheduler', () => {
    it(`Should run every change in personal transaction`, () => {
        const mock = jest.fn()
        const a = observable('a')
        const b = observable('b')
        const c = computed(function* () {
            while (true) {
                yield `${a.get()}${b.get()}c`
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
        const a = observable('a')
        const b = observable('b')
        const c = computed(function* () {
            while (true) {
                yield `${a.get()}${b.get()}c`
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
        const a = observable('a')
        const b = computed(function* () {
            while (true) {
                c.set(`${a.get()}b`)
                yield `${a.get()}b`
            }
        })
        const c = observable('c')

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
        const a = observable('a')
        const b = computed(function* () {
            while (true) {
                c.set(`${a.get()}c`)
                d.set(`${a.get()}d`)
                yield `${a.get()}b`
            }
        })
        const c = observable('c')
        const d = observable('d')

        whatsUp(c, mockC)

        expect(mockC).toBeCalledTimes(1)
        expect(mockC).lastCalledWith('c')

        whatsUp(d, mockD)

        expect(mockD).toBeCalledTimes(1)
        expect(mockD).lastCalledWith('d')

        whatsUp(b, mockB)

        expect(mockB).toBeCalledTimes(1)
        expect(mockB).lastCalledWith('ab')

        expect(mockC).toBeCalledTimes(2)
        expect(mockC).lastCalledWith('ac')
        expect(mockD).toBeCalledTimes(2)
        expect(mockD).lastCalledWith('ad')

        a.set('A')

        expect(mockB).toBeCalledTimes(2)
        expect(mockB).lastCalledWith('Ab')
        expect(mockC).toBeCalledTimes(3)
        expect(mockC).lastCalledWith('Ac')
        expect(mockD).toBeCalledTimes(3)
        expect(mockD).lastCalledWith('Ad')
    })

    describe('should recalc only dirty streams', () => {
        const mock = jest.fn()
        const mockWallet = jest.fn()
        const mockUser = jest.fn()
        const balance = observable(100)
        const name = observable<string>('John')
        const wallet = computed(function* () {
            while (true) {
                mockWallet()
                yield `Wallet ${balance.get()}`
            }
        })
        const user = computed(function* () {
            while (true) {
                mockUser()
                yield `User ${name.get()}`
            }
        })
        const app = computed(function* () {
            while (true) yield `App ${user.get()} ${wallet.get()}`
        })

        whatsUp(app, mock)

        it(`mock to be called 1 time with "App User John Wallet 100"`, () => {
            expect(mock).toBeCalledTimes(1)
            expect(mockWallet).toBeCalledTimes(1)
            expect(mockUser).toBeCalledTimes(1)
            expect(mock).lastCalledWith('App User John Wallet 100')
        })

        it(`"Barry" as Name and mockWallet to not be called`, () => {
            name.set('Barry')
            expect(mock).toBeCalledTimes(2)
            expect(mockWallet).toBeCalledTimes(1)
            expect(mockUser).toBeCalledTimes(2)
            expect(mock).lastCalledWith('App User Barry Wallet 100')
        })

        it(`"200" as Balance and mockUser to not be called`, () => {
            balance.set(200)
            expect(mock).toBeCalledTimes(3)
            expect(mockWallet).toBeCalledTimes(2)
            expect(mockUser).toBeCalledTimes(2)
            expect(mock).lastCalledWith('App User Barry Wallet 200')
        })
    })
})
