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
        expect(mock).lastCalledWith(false)

        m.set(6, '6')

        expect(mock).toBeCalledTimes(1)

        m.set(5, '5')

        expect(mock).toBeCalledTimes(2)
        expect(mock).lastCalledWith(true)

        m.delete(2)

        expect(mock).toBeCalledTimes(2)

        m.delete(5)

        expect(mock).toBeCalledTimes(3)
        expect(mock).lastCalledWith(false)

        m.set(5, '5')

        expect(mock).toBeCalledTimes(4)
        expect(mock).lastCalledWith(true)

        expect([...m['hasMap'].values()].every((v) => v === null)).toBeFalsy()

        dispose()

        expect(m.has(5)).toBeTruthy()

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
        expect(mock).lastCalledWith(undefined)

        m.set(6, '6')

        expect(mock).toBeCalledTimes(1)
        expect(m.get(6)).toBe('6')

        m.set(4, '4')

        expect(mock).toBeCalledTimes(2)
        expect(mock).lastCalledWith('4')
        expect(m.get(4)).toBe('4')

        m.delete(6)

        expect(mock).toBeCalledTimes(2)

        m.delete(4)

        expect(mock).toBeCalledTimes(3)
        expect(mock).lastCalledWith(undefined)

        m.set(4, '44')

        expect(mock).toBeCalledTimes(4)
        expect(mock).lastCalledWith('44')

        m.set(4, '444')

        expect(mock).toBeCalledTimes(5)
        expect(mock).lastCalledWith('444')

        m.delete(4)

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

        expect(mock).lastCalledWith(3)

        m.set(6, '6')

        expect(mock).lastCalledWith(4)

        m.delete(5)

        expect(mock).toBeCalledTimes(2)
        expect(mock).lastCalledWith(4)

        m.delete(2)

        expect(mock).lastCalledWith(3)

        m.clear()

        expect(mock).lastCalledWith(0)
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

        m.set(1, '11')

        expect(r).toEqual([
            [1, '11'],
            [2, '2'],
            [3, '3'],
        ])

        m.set(4, '4')

        expect(r).toEqual([
            [1, '11'],
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

    it(`values`, () => {
        let r = [] as string[]
        const m = map([
            [1, '1'],
            [2, '2'],
            [3, '3'],
        ])

        autorun(() => (r = [...m.values()]))

        expect(r).toEqual(['1', '2', '3'])

        m.set(4, '4')

        expect(r).toEqual(['1', '2', '3', '4'])

        m.delete(1)

        expect(r).toEqual(['2', '3', '4'])
    })

    it(`keys`, () => {
        let r = [] as number[]
        const m = map([
            [1, '1'],
            [2, '2'],
            [3, '3'],
        ])

        autorun(() => (r = [...m.keys()]))

        expect(r).toEqual([1, 2, 3])

        m.set(4, '4')

        expect(r).toEqual([1, 2, 3, 4])

        m.delete(1)

        expect(r).toEqual([2, 3, 4])
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

    it(`other`, () => {
        const m = map()

        expect(m.toString()).toBe('[object ObservableMap]')
        expect(m.toLocaleString()).toBe('[object ObservableMap]')
        expect(m[Symbol.toStringTag]).toBe('ObservableMap')
    })
})
