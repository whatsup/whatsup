import { fractal } from '../src/fractal'
import { fraction } from '../src/fraction'
import { live } from '../src/runners'
import { LiveFrame } from '../src/frame'

describe('Reactions', () => {
    const delay = (time: number) => new Promise((r) => setTimeout(r, time))

    describe('test reactions with initial values', () => {
        const mock = jest.fn((v) => v)
        const Name = fraction('John')
        const Age = fraction(33)
        const User = fractal(async function* _User() {
            while (true) yield mock(`User ${yield* Name} ${yield* Age}`)
        })

        it(`mock called 1 time with "User John 33"`, async () => {
            await live(User)
            expect(mock).toBeCalledTimes(1)
            expect(mock).lastCalledWith('User John 33')
        })
    })

    describe('react only on connected fractals', () => {
        const mock = jest.fn((v) => v)
        const Switch = fraction(true)
        const Name = fraction('John')
        const User = fractal(async function* _User() {
            while (true) {
                yield mock(`User ${(yield* Switch) ? yield* Name : 'Default'}`)
            }
        })

        let frame: LiveFrame<string>

        it(`mock called with "User John"`, async () => {
            frame = await live(User)
            expect(mock).toBeCalledTimes(1)
            expect(mock).lastCalledWith('User John')
        })

        it(`change Switch to "false" and mock to be called with "User Default"`, async () => {
            Switch.use(false)
            frame = await frame.next
            expect(mock).toBeCalledTimes(2)
            expect(mock).lastCalledWith('User Default')
        })

        it(`change name to "Barry" and mock not to be called`, async () => {
            Name.use('Barry')
            await delay(100)
            expect(mock).toBeCalledTimes(2)
        })

        it(`change Switch to "true" and mock to be called with "User Barry"`, async () => {
            Switch.use(true)
            frame = await frame.next
            expect(mock).toBeCalledTimes(3)
            expect(mock).lastCalledWith('User Barry')
        })

        it(`change name to "Jessy" and mock to be called with "User Jessy"`, async () => {
            Name.use('Jessy')
            frame = await frame.next
            expect(mock).toBeCalledTimes(4)
            expect(mock).lastCalledWith('User Jessy')
        })
    })

    describe('test reactions on unique values only', () => {
        const mock = jest.fn((v) => v)
        const Name = fraction<string>('John')
        const User = fractal(async function* _User() {
            while (true) yield mock(`User ${yield* Name}`)
        })

        let frame: LiveFrame<string>

        it(`mock to be called 1 time with "User John"`, async () => {
            frame = await live(User)
            expect(mock).toBeCalledTimes(1)
            expect(mock).lastCalledWith('User John')
        })

        it(`again use "John" as Name and mock to not be called`, async () => {
            Name.use('John')
            delay(100)
            expect(mock).toBeCalledTimes(1)
            expect(mock).lastCalledWith('User John')
        })

        it(`use "Barry" as Name and mock to be called 1 time with "User Barry"`, async () => {
            Name.use('Barry')
            frame = await frame.next
            expect(mock).toBeCalledTimes(2)
            expect(mock).lastCalledWith('User Barry')
        })
    })

    describe('test delegation', () => {
        const mock1 = jest.fn((v) => v)
        const mock2 = jest.fn((v) => v)
        const Trigger1 = fraction(1)
        const Trigger2 = fraction(2)
        const One = fractal(async function* _One() {
            while (true) {
                mock1(yield* Trigger1)
                yield Two
            }
        })
        const Two = fractal(async function* _Two() {
            while (true) yield yield* Trigger2
        })
        const App = fractal(async function* _App() {
            return mock2(yield* One)
        })

        it(`mock1 to be called with "1" mock2 to be called with "2"`, async () => {
            await live(App)
            expect(mock1).toBeCalledTimes(1)
            expect(mock1).lastCalledWith(1)
            expect(mock2).toBeCalledTimes(1)
            expect(mock2).lastCalledWith(2)
        })

        it(`change Trigger2 - mock1 not to be called, mock2 to be called with "22"`, async () => {
            Trigger2.use(22)
            await delay(100)
            expect(mock1).toBeCalledTimes(1)
            expect(mock2).toBeCalledTimes(2)
            expect(mock2).lastCalledWith(22)
        })

        it(`change Trigger1 - mock1 to be called with "11", mock2 to be called with "22"`, async () => {
            Trigger1.use(11)
            await delay(100)
            expect(mock1).toBeCalledTimes(2)
            expect(mock1).lastCalledWith(11)
            expect(mock2).toBeCalledTimes(3)
            expect(mock2).lastCalledWith(22)
        })
    })
})
