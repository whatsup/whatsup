import { factor } from '../src/factor'
import { fractal } from '../src/fractal'
import { fraction } from '../src/fraction'
import { Mutator } from '../src/mutator'
import { live, stream } from '../src/runners'
import { tmp } from '../src/temporary'

describe('Situations', () => {
    const delay = (time: number) => new Promise((r) => setTimeout(r, time))

    describe('test reactions with initial values', () => {
        const mock = jest.fn((v) => v)
        const Name = fraction('John')
        const Age = fraction(33)
        const User = fractal(async function* () {
            while (true) yield mock(`User ${yield* Name} ${yield* Age}`)
        })

        it(`mock called 1 time with "User John 33"`, async () => {
            live(User)
            await delay(100)
            expect(mock).toBeCalledTimes(1)
            expect(mock).lastCalledWith('User John 33')
        })
    })

    describe('react only on connected fractals', () => {
        const mock = jest.fn((v) => v)
        const Switch = fraction(true)
        const Name = fraction('John')
        const User = fractal(async function* () {
            while (true) {
                yield mock(`User ${(yield* Switch) ? yield* Name : 'Default'}`)
            }
        })

        it(`mock called with "User John"`, async () => {
            live(User)
            await delay(100)
            expect(mock).toBeCalledTimes(1)
            expect(mock).lastCalledWith('User John')
        })

        it(`change Switch to "false" and mock to be called with "User Default"`, async () => {
            Switch.set(false)
            await delay(100)
            expect(mock).toBeCalledTimes(2)
            expect(mock).lastCalledWith('User Default')
        })

        it(`change name to "Barry" and mock not to be called`, async () => {
            Name.set('Barry')
            await delay(100)
            expect(mock).toBeCalledTimes(2)
        })

        it(`change Switch to "true" and mock to be called with "User Barry"`, async () => {
            Switch.set(true)
            await delay(100)
            expect(mock).toBeCalledTimes(3)
            expect(mock).lastCalledWith('User Barry')
        })

        it(`change name to "Jessy" and mock to be called with "User Jessy"`, async () => {
            Name.set('Jessy')
            await delay(100)
            expect(mock).toBeCalledTimes(4)
            expect(mock).lastCalledWith('User Jessy')
        })
    })

    describe('test reactions on unique values only', () => {
        const mock = jest.fn((v) => v)
        const Name = fraction<string>('John')
        const User = fractal(async function* () {
            while (true) yield mock(`User ${yield* Name}`)
        })

        it(`mock to be called 1 time with "User John"`, async () => {
            live(User)
            await delay(100)
            expect(mock).toBeCalledTimes(1)
            expect(mock).lastCalledWith('User John')
        })

        it(`again use "John" as Name and mock to not be called`, async () => {
            Name.set('John')
            await delay(100)
            expect(mock).toBeCalledTimes(1)
            expect(mock).lastCalledWith('User John')
        })

        it(`use "Barry" as Name and mock to be called 1 time with "User Barry"`, async () => {
            Name.set('Barry')
            await delay(100)
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
        const One = fractal(async function* () {
            while (true) {
                if (mock1(yield* Trigger1) > 0) {
                    yield Two
                } else {
                    yield Trigger3
                }
            }
        })
        const Two = fractal(async function* () {
            while (true) yield yield* Trigger2
        })
        const App = fractal(async function* () {
            return mock2(yield* One)
        })

        it(`mock1 to be called with "1" mock2 to be called with "2"`, async () => {
            live(App)
            await delay(100)
            expect(mock1).toBeCalledTimes(1)
            expect(mock1).lastCalledWith(1)
            expect(mock2).toBeCalledTimes(1)
            expect(mock2).lastCalledWith(2)
        })

        it(`change Trigger2 - mock1 not to be called, mock2 to be called with "22"`, async () => {
            Trigger2.set(22)
            await delay(100)
            expect(mock1).toBeCalledTimes(1)
            expect(mock2).toBeCalledTimes(2)
            expect(mock2).lastCalledWith(22)
        })

        it(`change Trigger1 - mock1 to be called with "11", mock2 not to be called`, async () => {
            Trigger1.set(11)
            await delay(100)
            expect(mock1).toBeCalledTimes(2)
            expect(mock1).lastCalledWith(11)
            expect(mock2).toBeCalledTimes(2)
            expect(mock2).lastCalledWith(22)
        })

        it(`change Trigger1 - mock1 to be called with "-11", mock2 to be called with "3"`, async () => {
            Trigger1.set(-11)
            await delay(100)
            expect(mock1).toBeCalledTimes(3)
            expect(mock1).lastCalledWith(-11)
            expect(mock2).toBeCalledTimes(3)
            expect(mock2).lastCalledWith(3)
        })
    })

    describe('test fast rebuilding & resynchronization', () => {
        const mock = jest.fn((v) => v)
        const Input = fraction(11)
        const Output = fractal(async function* () {
            while (true) {
                yield mock(yield* Input)
            }
        })

        it(`mock to be called 1 time with "11"`, async () => {
            live(Output)
            await delay(100)
            expect(mock).toBeCalledTimes(1)
            expect(mock).lastCalledWith(11)
        })

        it(`mock to be called 2 time with "33"`, async () => {
            Input.set(22)
            Input.set(33)
            await delay(100)
            expect(mock).toBeCalledTimes(2)
            expect(mock).lastCalledWith(33)
        })
    })

    describe('test mutators & streams & temporary values', () => {
        const destroyMock = jest.fn()
        class Increment extends Mutator<number> {
            mutate(prev = 0) {
                return prev + 1
            }
        }
        const Output = fractal(async function* () {
            try {
                while (true) {
                    await delay(100)
                    yield tmp(new Increment())
                }
            } finally {
                destroyMock()
            }
        })

        const st = stream(Output)

        it(`should return 1`, async () => {
            expect((await st.next()).value).toBe(1)
        })

        it(`should return 2`, async () => {
            expect((await st.next()).value).toBe(2)
        })

        it(`should return 3`, async () => {
            expect((await st.next()).value).toBe(3)
        })

        it(`should destroy & mock call`, async () => {
            st.return()
            await delay(150)
            expect(destroyMock).toBeCalledTimes(1)
        })
    })

    describe('context manipulations', () => {
        const mock1 = jest.fn()
        const mock2 = jest.fn()
        const mock3 = jest.fn()
        const fac = factor('default')
        const One = fractal(async function* (ctx) {
            ctx!.set(fac, 'hello')
            mock1(ctx!.get(fac))

            while (true) {
                yield yield* Two
            }
        })
        const Two = fractal(async function* (ctx) {
            mock2(ctx!.get(fac))
            ctx!.set(fac, 'world')

            while (true) {
                yield Thr
            }
        })
        const Thr = fractal(async function* (ctx) {
            mock3(ctx!.get(fac))

            while (true) {
                yield ''
            }
        })

        it(`should mock1 to be called with "default"`, async () => {
            live(One)
            await delay(100)

            expect(mock1).toBeCalledTimes(1)
            expect(mock1).lastCalledWith('default')
        })

        it(`should mock2 to be called with "hello"`, async () => {
            expect(mock2).toBeCalledTimes(1)
            expect(mock2).lastCalledWith('hello')
        })

        it(`should mock3 to be called with "world"`, async () => {
            expect(mock3).toBeCalledTimes(1)
            expect(mock3).lastCalledWith('world')
        })
    })

    // describe('error catching', () => {
    //     const mock = jest.fn()
    //     const Toggle = fraction(false)
    //     const One = fractal(async function* () {
    //         while (true) {
    //             if (yield* Toggle) {
    //                 throw 'Error'
    //             }
    //             yield 'Hello'
    //         }
    //     })
    //     const Two = fractal(async function* () {
    //         try {
    //             while (true) {
    //                 yield mock(yield* One)
    //             }
    //         } catch (e) {
    //             mock(e)
    //         }
    //     })

    //     it(`should call mock with "Hello"`, async () => {
    //         live(Two)
    //         await delay(100)
    //         expect(mock).toBeCalledTimes(1)
    //         expect(mock).lastCalledWith('Hello')
    //     })

    //     it(`should catch error`, async () => {
    //         Toggle.set(true)
    //         await delay(100)
    //         expect(mock).toBeCalledTimes(2)
    //         expect(mock).lastCalledWith('Error')
    //     })
    // })
})
