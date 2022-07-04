import { set } from '../src/set'
import { autorun } from '../src/reactions'

describe('Set', () => {
    it(`should react on change`, () => {
        const mock = jest.fn()
        const s = set([1, 2, 3])

        expect(s.has(0)).toBeFalsy()

        expect(s.has(1)).toBeTruthy()

        expect([...s['hasMap'].values()].every((v) => v === null)).toBeTruthy()

        const dispose = autorun(() => mock(s.has(5)))

        expect([...s['hasMap'].values()].every((v) => v === null)).toBeFalsy()

        expect(mock).toBeCalledTimes(1)
        expect(mock).lastCalledWith(false)

        s.add(6)

        expect(mock).toBeCalledTimes(1)

        s.add(5)

        expect(mock).toBeCalledTimes(2)
        expect(mock).lastCalledWith(true)

        s.delete(2)

        expect(mock).toBeCalledTimes(2)

        s.delete(5)

        expect(mock).toBeCalledTimes(3)
        expect(mock).lastCalledWith(false)

        s.add(5)

        expect(mock).toBeCalledTimes(4)
        expect(mock).lastCalledWith(true)

        expect([...s['hasMap'].values()].every((v) => v === null)).toBeFalsy()

        dispose()

        expect([...s['hasMap'].values()].every((v) => v === null)).toBeTruthy()

        expect(s.has(5)).toBeTruthy()
    })

    it(`dispose trigger when set has item`, () => {
        let r = false
        const s = set([1, 2, 3])

        const dispose = autorun(() => (r = s.has(1)))

        expect(r).toBeTruthy()

        dispose()

        expect(s['hasMap'].get(1)).toBeNull()
    })

    it(`dispose trigger when set not has item`, () => {
        let r = false
        const s = set([1, 2, 3])

        const dispose = autorun(() => (r = s.has(1)))

        expect(r).toBeTruthy()

        s.delete(1)

        dispose()

        expect(s['hasMap'].has(1)).toBeFalsy()
    })

    it(`has outside building`, () => {
        let r = false

        const s = set([1, 2, 3])

        expect(s.has(1)).toBeTruthy()

        const dispose1 = autorun(() => (r = s.has(1)))
        const dispose2 = autorun(() => (r = s.has(1)))

        expect(r).toBeTruthy()

        expect(s.has(1)).toBeTruthy()

        expect([...s]).toEqual([1, 2, 3])

        dispose1()

        expect(r).toBeTruthy()

        expect(s.has(1)).toBeTruthy()

        expect([...s]).toEqual([1, 2, 3])

        dispose2()

        expect(r).toBeTruthy()

        expect(s.has(1)).toBeTruthy()

        expect([...s]).toEqual([1, 2, 3])
    })

    it(`size`, () => {
        const mock = jest.fn()
        const s = set([1, 2, 3])

        autorun(() => mock(s.size))

        expect(mock).lastCalledWith(3)

        s.add(6)

        expect(mock).lastCalledWith(4)

        s.delete(5)

        expect(mock).toBeCalledTimes(2)
        expect(mock).lastCalledWith(4)

        s.delete(2)

        expect(mock).lastCalledWith(3)

        s.clear()

        expect(mock).lastCalledWith(0)
    })

    it(`Symbol.iterator`, () => {
        let r = [] as number[]
        const s = set([1, 2, 3])

        autorun(() => (r = [...s]))

        expect(r).toEqual([1, 2, 3])

        s.add(4)

        expect(r).toEqual([1, 2, 3, 4])

        s.delete(1)

        expect(r).toEqual([2, 3, 4])
    })

    it(`values`, () => {
        let r = [] as number[]
        const s = set([1, 2, 3])

        autorun(() => (r = [...s.values()]))

        expect(r).toEqual([1, 2, 3])

        s.add(4)

        expect(r).toEqual([1, 2, 3, 4])

        s.delete(1)

        expect(r).toEqual([2, 3, 4])
    })

    it(`keys`, () => {
        let r = [] as number[]
        const s = set([1, 2, 3])

        autorun(() => (r = [...s.keys()]))

        expect(r).toEqual([1, 2, 3])

        s.add(4)

        expect(r).toEqual([1, 2, 3, 4])

        s.delete(1)

        expect(r).toEqual([2, 3, 4])
    })

    it(`entries`, () => {
        let r = [] as [number, number][]
        const s = set([1, 2, 3])

        autorun(() => (r = [...s.entries()]))

        expect(r).toEqual([
            [1, 1],
            [2, 2],
            [3, 3],
        ])

        s.add(4)

        expect(r).toEqual([
            [1, 1],
            [2, 2],
            [3, 3],
            [4, 4],
        ])

        s.delete(1)

        expect(r).toEqual([
            [2, 2],
            [3, 3],
            [4, 4],
        ])
    })

    it(`forEach`, () => {
        let r = [] as [number, number][]
        const s = set([1, 2, 3])

        autorun(() => {
            const acc = [] as [number, number][]

            s.forEach((i1, i2) => acc.push([i1, i2]))

            r = acc
        })

        expect(r).toEqual([
            [1, 1],
            [2, 2],
            [3, 3],
        ])

        s.add(4)

        expect(r).toEqual([
            [1, 1],
            [2, 2],
            [3, 3],
            [4, 4],
        ])

        s.delete(1)

        expect(r).toEqual([
            [2, 2],
            [3, 3],
            [4, 4],
        ])
    })

    it(`other`, () => {
        const s = set()

        expect(s.toString()).toBe('[object ObservableSet]')
        expect(s.toLocaleString()).toBe('[object ObservableSet]')
        expect(s[Symbol.toStringTag]).toBe('ObservableSet')
    })
})
