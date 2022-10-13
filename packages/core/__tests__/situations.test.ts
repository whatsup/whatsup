import { autorun } from '../src/reactions'
import { computed } from '../src/computed'
import { observable } from '../src/observable'

describe('Situations', () => {
    describe('test reactions with initial values', () => {
        const mock = jest.fn()
        const name = observable('John')
        const age = observable(33)
        const user = computed(function* () {
            while (true) yield `user ${name()} ${age()}`
        })

        autorun(() => mock(user()))

        it(`mock called 1 time with "user John 33"`, () => {
            expect(mock).toBeCalledTimes(1)
            expect(mock).lastCalledWith('user John 33')
        })
    })

    describe('react only on connected computeds', () => {
        const mock = jest.fn()
        const toggle = observable(true)
        const name = observable('John')
        const user = computed(function* () {
            while (true) {
                yield `user ${toggle() ? name() : 'Default'}`
            }
        })

        autorun(() => mock(user()))

        it(`mock called with "user John"`, () => {
            expect(mock).toBeCalledTimes(1)
            expect(mock).lastCalledWith('user John')
        })

        it(`change toggle to "false" and mock to be called with "user Default"`, () => {
            toggle(false)
            expect(mock).toBeCalledTimes(2)
            expect(mock).lastCalledWith('user Default')
        })

        it(`change name to "Barry" and mock not to be called`, () => {
            name('Barry')
            expect(mock).toBeCalledTimes(2)
        })

        it(`change toggle to "true" and mock to be called with "user Barry"`, () => {
            toggle(true)
            expect(mock).toBeCalledTimes(3)
            expect(mock).lastCalledWith('user Barry')
        })

        it(`change name to "Jessy" and mock to be called with "user Jessy"`, () => {
            name('Jessy')
            expect(mock).toBeCalledTimes(4)
            expect(mock).lastCalledWith('user Jessy')
        })
    })

    describe('test reactions on unique values only', () => {
        const mock = jest.fn()
        const name = observable<string>('John')
        const user = computed(function* () {
            while (true) yield `user ${name()}`
        })

        autorun(() => mock(user()))

        it(`mock to be called 1 time with "user John"`, () => {
            expect(mock).toBeCalledTimes(1)
            expect(mock).lastCalledWith('user John')
        })

        it(`again use "John" as name and mock to not be called`, () => {
            name('John')
            expect(mock).toBeCalledTimes(1)
            expect(mock).lastCalledWith('user John')
        })

        it(`use "Barry" as name and mock to be called 1 time with "user Barry"`, () => {
            name('Barry')
            expect(mock).toBeCalledTimes(2)
            expect(mock).lastCalledWith('user Barry')
        })
    })

    it('diamond test', () => {
        const mock = jest.fn()
        const one = observable(1)
        const two = computed(() => one() + 1)
        const three = computed(() => two() * 2)
        const four = computed(() => two() * 3)

        autorun(() => mock(three() + four()))

        expect(mock).toBeCalledTimes(1)
        expect(mock).lastCalledWith(10)

        one(2)

        expect(mock).toBeCalledTimes(2)
        expect(mock).lastCalledWith(15)
    })
})
