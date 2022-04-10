import { set } from '../src/set'
import { autorun } from '../src/reactions'

describe('Set', () => {
    it(`should react on change`, () => {
        const mock = jest.fn()
        const s = set([1, 2, 3])

        expect(s.has(1)).toBeTruthy()

        expect([...s['hasMap'].values()].every((v) => v === null)).toBeTruthy()

        const dispose = autorun(() => mock(s.has(5)))

        expect([...s['hasMap'].values()].every((v) => v === null)).toBeFalsy()

        expect(mock).toBeCalledTimes(1)
        expect(mock).toBeCalledWith(false)

        s.add(6)

        expect(mock).toBeCalledTimes(1)

        s.add(5)

        expect(mock).toBeCalledTimes(2)
        expect(mock).toBeCalledWith(true)

        s.delete(2)

        expect(mock).toBeCalledTimes(2)

        s.delete(5)

        expect(mock).toBeCalledTimes(3)
        expect(mock).toBeCalledWith(false)

        expect([...s['hasMap'].values()].every((v) => v === null)).toBeFalsy()

        dispose()

        expect([...s['hasMap'].values()].every((v) => v === null)).toBeTruthy()
    })

    it(`size`, () => {
        const mock = jest.fn()
        const s = set([1, 2, 3])

        autorun(() => mock(s.size))

        expect(mock).toBeCalledWith(3)

        s.add(6)

        expect(mock).toBeCalledWith(4)

        s.delete(5)

        expect(mock).toBeCalledTimes(2)
        expect(mock).toBeCalledWith(4)

        s.delete(2)

        expect(mock).toBeCalledWith(3)
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
})
