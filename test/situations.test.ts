import { observable } from '../src/observable'
import { factor } from '../src/factor'
import { fractal } from '../src/fractal'
import { fraction } from '../src/fraction'
import { Mutator } from '../src/mutator'
import { watch } from '../src/watcher'

describe('Situations', () => {
    describe('test reactions with initial values', () => {
        const mock = jest.fn()
        const Name = fraction('John')
        const Age = fraction(33)
        const User = fractal(function* () {
            while (true) yield `User ${yield* Name} ${yield* Age}`
        })

        watch(User, mock)

        it(`mock called 1 time with "User John 33"`, () => {
            expect(mock).toBeCalledTimes(1)
            expect(mock).lastCalledWith('User John 33')
        })
    })

    describe('react only on connected fractals', () => {
        const mock = jest.fn()
        const Switch = fraction(true)
        const Name = fraction('John')
        const User = fractal(function* () {
            while (true) {
                yield `User ${(yield* Switch) ? yield* Name : 'Default'}`
            }
        })

        watch(User, mock)

        it(`mock called with "User John"`, () => {
            expect(mock).toBeCalledTimes(1)
            expect(mock).lastCalledWith('User John')
        })

        it(`change Switch to "false" and mock to be called with "User Default"`, () => {
            Switch.set(false)
            expect(mock).toBeCalledTimes(2)
            expect(mock).lastCalledWith('User Default')
        })

        it(`change name to "Barry" and mock not to be called`, () => {
            Name.set('Barry')
            expect(mock).toBeCalledTimes(2)
        })

        it(`change Switch to "true" and mock to be called with "User Barry"`, () => {
            Switch.set(true)
            expect(mock).toBeCalledTimes(3)
            expect(mock).lastCalledWith('User Barry')
        })

        it(`change name to "Jessy" and mock to be called with "User Jessy"`, () => {
            Name.set('Jessy')
            expect(mock).toBeCalledTimes(4)
            expect(mock).lastCalledWith('User Jessy')
        })
    })

    describe('test reactions on unique values only', () => {
        const mock = jest.fn()
        const Name = fraction<string>('John')
        const User = fractal(function* () {
            while (true) yield `User ${yield* Name}`
        })

        watch(User, mock)

        it(`mock to be called 1 time with "User John"`, () => {
            expect(mock).toBeCalledTimes(1)
            expect(mock).lastCalledWith('User John')
        })

        it(`again use "John" as Name and mock to not be called`, () => {
            Name.set('John')
            expect(mock).toBeCalledTimes(1)
            expect(mock).lastCalledWith('User John')
        })

        it(`use "Barry" as Name and mock to be called 1 time with "User Barry"`, () => {
            Name.set('Barry')
            expect(mock).toBeCalledTimes(2)
            expect(mock).lastCalledWith('User Barry')
        })
    })

    describe('test delegation', () => {
        const mock1 = jest.fn((v) => v)
        const mock2 = jest.fn((v) => v)
        const Trigger1 = fraction(1)
        const Trigger2 = fraction(2)
        const Trigger3 = fraction(3)
        const One = fractal(function* () {
            while (true) {
                if (mock1(yield* Trigger1) > 0) {
                    yield Two
                } else {
                    yield Trigger3
                }
            }
        })
        const Two = fractal(function* () {
            while (true) yield yield* Trigger2
        })
        const App = fractal(function* () {
            return mock2(yield* One)
        })

        watch(App, () => {})

        it(`mock1 to be called with "1" mock2 to be called with "2"`, () => {
            expect(mock1).toBeCalledTimes(1)
            expect(mock1).lastCalledWith(1)
            expect(mock2).toBeCalledTimes(1)
            expect(mock2).lastCalledWith(2)
        })

        it(`change Trigger2 - mock1 not to be called, mock2 to be called with "22"`, () => {
            Trigger2.set(22)
            expect(mock1).toBeCalledTimes(1)
            expect(mock2).toBeCalledTimes(2)
            expect(mock2).lastCalledWith(22)
        })

        it(`change Trigger1 - mock1 to be called with "11", mock2 not to be called`, () => {
            Trigger1.set(11)
            expect(mock1).toBeCalledTimes(2)
            expect(mock1).lastCalledWith(11)
            expect(mock2).toBeCalledTimes(2)
            expect(mock2).lastCalledWith(22)
        })

        it(`change Trigger1 - mock1 to be called with "-11", mock2 to be called with "3"`, () => {
            Trigger1.set(-11)
            expect(mock1).toBeCalledTimes(3)
            expect(mock1).lastCalledWith(-11)
            expect(mock2).toBeCalledTimes(3)
            expect(mock2).lastCalledWith(3)
        })
    })

    describe('test mutators', () => {
        let result: any
        const destroyMock = jest.fn()
        const Kickstarter = observable(1)
        class Increment extends Mutator<number> {
            mutate(prev = 0) {
                return prev + 1
            }
        }
        const Output = fractal(function* () {
            try {
                while (true) {
                    yield* Kickstarter
                    yield new Increment()
                }
            } finally {
                destroyMock()
            }
        })

        const destroy = watch(Output, (r) => (result = r))

        it(`should return 1`, () => {
            expect(result).toBe(1)
        })

        it(`should return 2`, () => {
            Kickstarter.set(2)
            expect(result).toBe(2)
        })

        it(`should return 3`, () => {
            Kickstarter.set(3)
            expect(result).toBe(3)
        })

        it(`should destroy & mock call`, () => {
            destroy()
            expect(destroyMock).toBeCalledTimes(1)
        })
    })

    describe('context manipulations', () => {
        const mock1 = jest.fn()
        const mock2 = jest.fn()
        const mock3 = jest.fn()
        const fac = factor('default')
        const One = fractal(function* (ctx) {
            ctx!.set(fac, 'hello')
            mock1(ctx!.get(fac))

            while (true) {
                yield yield* Two
            }
        })
        const Two = fractal(function* (ctx) {
            mock2(ctx!.get(fac))
            ctx!.set(fac, 'world')

            while (true) {
                yield Thr
            }
        })
        const Thr = fractal(function* (ctx) {
            mock3(ctx!.get(fac))

            while (true) {
                yield ''
            }
        })

        watch(One, () => {})

        it(`should mock1 to be called with "default"`, () => {
            expect(mock1).toBeCalledTimes(1)
            expect(mock1).lastCalledWith('default')
        })

        it(`should mock2 to be called with "hello"`, () => {
            expect(mock2).toBeCalledTimes(1)
            expect(mock2).lastCalledWith('hello')
        })

        it(`should mock3 to be called with "world"`, () => {
            expect(mock3).toBeCalledTimes(1)
            expect(mock3).lastCalledWith('world')
        })
    })
})
