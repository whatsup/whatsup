import { observable } from '../src/observable'
import { computed } from '../src/computed'
import { autorun } from '../src/reactions'

describe('Builder', () => {
    it(`Should run every change in personal process`, () => {
        const mock = jest.fn()
        const a = observable('a')
        const b = observable('b')
        const c = computed(function* () {
            while (true) {
                yield `${a()}${b()}c`
            }
        })

        autorun(() => mock(c()))

        expect(mock).toBeCalledTimes(1)
        expect(mock).lastCalledWith('abc')

        a('A')
        b('B')

        expect(mock).toBeCalledTimes(3)
        expect(mock).nthCalledWith(2, 'Abc')
        expect(mock).nthCalledWith(3, 'ABc')
    })

    it(`Should create slave process when call 'build' inside process`, () => {
        const mockB = jest.fn()
        const mockC = jest.fn()
        const a = observable('a')
        const b = computed(function* () {
            while (true) {
                c(`${a()}b`)
                yield `${a()}b`
            }
        })
        const c = observable('c')

        autorun(() => mockC(c()))

        expect(mockC).toBeCalledTimes(1)
        expect(mockC).lastCalledWith('c')

        autorun(() => mockB(b()))

        expect(mockB).toBeCalledTimes(1)
        expect(mockB).lastCalledWith('ab')

        a('A')

        expect(mockB).toBeCalledTimes(2)
        expect(mockB).lastCalledWith('Ab')
        expect(mockC).toBeCalledTimes(3)
        expect(mockC).lastCalledWith('Ab')
    })

    it(`Should create & add atoms to current slave process when call 'build' inside process`, () => {
        const mockB = jest.fn()
        const mockC = jest.fn()
        const mockD = jest.fn()
        const a = observable('a')
        const b = computed(function* () {
            while (true) {
                c(`${a()}c`)
                d(`${a()}d`)
                yield `${a()}b`
            }
        })
        const c = observable('c')
        const d = observable('d')

        autorun(() => mockC(c()))

        expect(mockC).toBeCalledTimes(1)
        expect(mockC).lastCalledWith('c')

        autorun(() => mockD(d()))

        expect(mockD).toBeCalledTimes(1)
        expect(mockD).lastCalledWith('d')

        autorun(() => mockB(b()))

        expect(mockB).toBeCalledTimes(1)
        expect(mockB).lastCalledWith('ab')

        expect(mockC).toBeCalledTimes(2)
        expect(mockC).lastCalledWith('ac')
        expect(mockD).toBeCalledTimes(2)
        expect(mockD).lastCalledWith('ad')

        a('A')

        expect(mockB).toBeCalledTimes(2)
        expect(mockB).lastCalledWith('Ab')
        expect(mockC).toBeCalledTimes(3)
        expect(mockC).lastCalledWith('Ac')
        expect(mockD).toBeCalledTimes(3)
        expect(mockD).lastCalledWith('Ad')
    })

    describe('should recalc only dirty atoms', () => {
        const mock = jest.fn()
        const mockWallet = jest.fn()
        const mockUser = jest.fn()
        const balance = observable(100)
        const name = observable<string>('John')
        const wallet = computed(function* () {
            while (true) {
                mockWallet()
                yield `Wallet ${balance()}`
            }
        })
        const user = computed(function* () {
            while (true) {
                mockUser()
                yield `User ${name()}`
            }
        })
        const app = computed(function* () {
            while (true) yield `App ${user()} ${wallet()}`
        })

        autorun(() => mock(app()))

        it(`mock to be called 1 time with "App User John Wallet 100"`, () => {
            expect(mock).toBeCalledTimes(1)
            expect(mockWallet).toBeCalledTimes(1)
            expect(mockUser).toBeCalledTimes(1)
            expect(mock).lastCalledWith('App User John Wallet 100')
        })

        it(`"Barry" as Name and mockWallet to not be called`, () => {
            name('Barry')
            expect(mock).toBeCalledTimes(2)
            expect(mockWallet).toBeCalledTimes(1)
            expect(mockUser).toBeCalledTimes(2)
            expect(mock).lastCalledWith('App User Barry Wallet 100')
        })

        it(`"200" as Balance and mockUser to not be called`, () => {
            balance(200)
            expect(mock).toBeCalledTimes(3)
            expect(mockWallet).toBeCalledTimes(2)
            expect(mockUser).toBeCalledTimes(2)
            expect(mock).lastCalledWith('App User Barry Wallet 200')
        })
    })
})
