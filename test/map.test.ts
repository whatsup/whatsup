import { map } from '../src/map'
import { autorun } from '../src/reactions'

describe('Map', () => {
    it(`has`, () => {
        const mock = jest.fn()
        const m = map([
            [1, '1'],
            [2, '2'],
            [3, '3'],
        ])

        expect(m.has(1)).toBeTruthy()

        expect([...m['hasMap'].values()].every((v) => v === null)).toBeTruthy()

        const dispose = autorun(() => mock(m.has(5)))

        expect([...m['hasMap'].values()].every((v) => v === null)).toBeFalsy()

        expect(mock).toBeCalledTimes(1)
        expect(mock).toBeCalledWith(false)

        m.set(6, '6')

        expect(mock).toBeCalledTimes(1)

        m.set(5, '5')

        expect(mock).toBeCalledTimes(2)
        expect(mock).toBeCalledWith(true)

        m.delete(2)

        expect(mock).toBeCalledTimes(2)

        m.delete(5)

        expect(mock).toBeCalledTimes(3)
        expect(mock).toBeCalledWith(false)

        expect([...m['hasMap'].values()].every((v) => v === null)).toBeFalsy()

        dispose()

        expect([...m['hasMap'].values()].every((v) => v === null)).toBeTruthy()
    })

    it(`get`, () => {
        const mock = jest.fn()
        const m = map()

        expect(m.get(4)).toBeUndefined()

        expect(m['dataMap'].size).toBe(0)

        const dispose = autorun(() => mock(m.get(4)))

        expect(m['dataMap'].size).toBe(0)
        expect(m['hasMap'].size).toBe(1)

        expect(mock).toBeCalledTimes(1)
        expect(mock).toBeCalledWith(undefined)

        m.set(6, '6')

        expect(mock).toBeCalledTimes(1)

        m.set(4, '4')

        expect(mock).toBeCalledTimes(2)
        expect(mock).toBeCalledWith('4')

        m.delete(6)

        expect(mock).toBeCalledTimes(2)

        m.delete(4)

        expect(mock).toBeCalledTimes(3)
        expect(mock).toBeCalledWith(undefined)

        expect(m['dataMap'].size).toBe(1)
        expect(m['hasMap'].size).toBe(1)

        dispose()

        expect(m['dataMap'].size).toBe(0)
        expect(m['hasMap'].size).toBe(0)
    })

    it(`size`, () => {
        const mock = jest.fn()
        const m = map([
            [1, '1'],
            [2, '2'],
            [3, '3'],
        ])

        autorun(() => mock(m.size))

        expect(mock).toBeCalledWith(3)

        m.set(6, '6')

        expect(mock).toBeCalledWith(4)

        m.delete(5)

        expect(mock).toBeCalledTimes(2)
        expect(mock).toBeCalledWith(4)

        m.delete(2)

        expect(mock).toBeCalledWith(3)

        m.clear()

        expect(mock).toBeCalledWith(0)
    })

    it(`Symbol.iterator`, () => {
        let r = [] as [number, string][]
        const m = map([
            [1, '1'],
            [2, '2'],
            [3, '3'],
        ])

        autorun(() => (r = [...m]))

        expect(r).toEqual([
            [1, '1'],
            [2, '2'],
            [3, '3'],
        ])

        m.set(4, '4')

        expect(r).toEqual([
            [1, '1'],
            [2, '2'],
            [3, '3'],
            [4, '4'],
        ])

        m.delete(1)

        expect(r).toEqual([
            [2, '2'],
            [3, '3'],
            [4, '4'],
        ])
    })

    it(`entries`, () => {
        let r = [] as [number, string][]
        const m = map([
            [1, '1'],
            [2, '2'],
            [3, '3'],
        ])

        autorun(() => (r = [...m.entries()]))

        expect(r).toEqual([
            [1, '1'],
            [2, '2'],
            [3, '3'],
        ])

        m.set(4, '4')

        expect(r).toEqual([
            [1, '1'],
            [2, '2'],
            [3, '3'],
            [4, '4'],
        ])

        m.delete(1)

        expect(r).toEqual([
            [2, '2'],
            [3, '3'],
            [4, '4'],
        ])
    })

    it(`forEach`, () => {
        let r = [] as [number, string][]
        const m = map([
            [1, '1'],
            [2, '2'],
            [3, '3'],
        ])

        autorun(() => {
            const acc = [] as [number, string][]

            m.forEach((k, v) => acc.push([k, v]))

            r = acc
        })

        expect(r).toEqual([
            [1, '1'],
            [2, '2'],
            [3, '3'],
        ])

        m.set(4, '4')

        expect(r).toEqual([
            [1, '1'],
            [2, '2'],
            [3, '3'],
            [4, '4'],
        ])

        m.delete(1)

        expect(r).toEqual([
            [2, '2'],
            [3, '3'],
            [4, '4'],
        ])
    })
})
