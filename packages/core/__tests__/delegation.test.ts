import { delegate } from '../src/delegation'
import { computed } from '../src/computed'
import { observable } from '../src/observable'
import { autorun, reaction } from '../src/reactions'

describe('Delegating', () => {
    describe('test delegation', () => {
        const mock1 = jest.fn((v) => v)
        const mock2 = jest.fn((v) => v)
        const trigger1 = observable(1)
        const trigger2 = observable(2)
        const trigger3 = observable(3)
        const one = computed(function* () {
            while (true) {
                if (mock1(trigger1()) > 0) {
                    yield delegate(two)
                } else {
                    yield delegate(trigger3)
                }
            }
        })
        const two = computed(function* () {
            while (true) yield trigger2()
        })
        const app = computed(function* () {
            return mock2(one())
        })

        autorun(() => app())

        it(`mock1 to be called with "1" mock2 to be called with "2"`, () => {
            expect(mock1).toBeCalledTimes(1)
            expect(mock1).lastCalledWith(1)
            expect(mock2).toBeCalledTimes(1)
            expect(mock2).lastCalledWith(2)
        })

        it(`change trigger2 - mock1 not to be called, mock2 to be called with "22"`, () => {
            trigger2(22)
            expect(mock1).toBeCalledTimes(1)
            expect(mock2).toBeCalledTimes(2)
            expect(mock2).lastCalledWith(22)
        })

        it(`change trigger1 - mock1 to be called with "11", mock2 not to be called`, () => {
            trigger1(11)
            expect(mock1).toBeCalledTimes(2)
            expect(mock1).lastCalledWith(11)
            expect(mock2).toBeCalledTimes(2)
            expect(mock2).lastCalledWith(22)
        })

        it(`change trigger1 - mock1 to be called with "-11", mock2 to be called with "3"`, () => {
            trigger1(-11)
            expect(mock1).toBeCalledTimes(3)
            expect(mock1).lastCalledWith(-11)
            expect(mock2).toBeCalledTimes(3)
            expect(mock2).lastCalledWith(3)
        })
    })

    describe('test when executor throw excepton', () => {
        const mock1 = jest.fn((v) => v)
        const mock2 = jest.fn((v) => v)
        const trigger1 = observable(false)
        const trigger2 = observable(2)
        const one = computed(function* () {
            while (true) {
                if (trigger1()) {
                    yield delegate(two as any)
                } else {
                    yield delegate(trigger2)
                }
            }
        })
        const two = computed(function* () {
            throw 'TWO_ERROR'
        })
        const app = computed(function* () {
            return one()
        })

        reaction(() => app(), mock1, mock2)

        it(`mock1 to be called with "1"`, () => {
            expect(mock1).toBeCalledTimes(1)
            expect(mock1).lastCalledWith(2, undefined)
        })

        it(`change trigger2 - mock2 to be called with "22"`, () => {
            trigger2(22)
            expect(mock1).toBeCalledTimes(2)
            expect(mock1).lastCalledWith(22, 2)
        })

        it(`change trigger1 - mock1 not to be called, mock2 to be called 1 time with "TWO_ERROR"`, () => {
            trigger1(true)
            expect(mock1).toBeCalledTimes(2)
            expect(mock1).lastCalledWith(22, 2)
            expect(mock2).toBeCalledTimes(1)
            expect(mock2).lastCalledWith('TWO_ERROR')
        })

        it(`change trigger1 - mock1 to be called with "22", mock2 not to be called`, () => {
            trigger1(false)
            expect(mock1).toBeCalledTimes(3)
            expect(mock1).lastCalledWith(22, 22)
            expect(mock2).toBeCalledTimes(1)
            expect(mock2).lastCalledWith('TWO_ERROR')
        })
    })

    describe('test when executor throw delegation', () => {
        const mock1 = jest.fn((v) => v)
        const mock2 = jest.fn((v) => v)
        const trigger1 = observable(false)
        const trigger2 = observable(2)
        const trigger3 = observable(3)
        const one = computed(function* () {
            while (true) {
                if (trigger1()) {
                    throw delegate(two)
                } else {
                    yield delegate(trigger2)
                }
            }
        })
        const two = computed(function* () {
            return trigger3()
        })
        const app = computed(function* () {
            return one()
        })

        reaction(() => app(), mock1, mock2)

        it(`mock1 to be called with "2"`, () => {
            expect(mock1).toBeCalledTimes(1)
            expect(mock1).lastCalledWith(2, undefined)
        })

        it(`change trigger2 - mock2 to be called with "22"`, () => {
            trigger2(22)
            expect(mock1).toBeCalledTimes(2)
            expect(mock1).lastCalledWith(22, 2)
        })

        it(`change trigger1 - mock1 not to be called, mock2 to be called mock2 with Delegation`, () => {
            trigger1(true)
            expect(mock1).toBeCalledTimes(2)
            expect(mock1).lastCalledWith(22, 2)
            expect(mock2).toBeCalledTimes(1)
            expect(mock2).lastCalledWith(delegate(two))
        })

        it(`change trigger1 - mock1 to be called with "22", mock2 not to be called`, () => {
            trigger1(false)
            expect(mock1).toBeCalledTimes(3)
            expect(mock1).lastCalledWith(22, 22)
            expect(mock2).toBeCalledTimes(1)
            expect(mock2).lastCalledWith(delegate(two))
        })
    })
})
