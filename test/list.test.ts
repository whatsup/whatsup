import { watch } from '../src'
import { list } from '../src/list'

describe('List', () => {
    let result: number[]
    const li = list<number>()

    watch(li, (r) => (result = r))

    it(`should return 1, 2, 3`, async () => {
        li.insert(1, 2, 3)
        expect(result).toEqual([1, 2, 3])
    })

    it(`should return 1, 2, 3, 4, 5`, async () => {
        li.insert(4, 5)
        expect(result).toEqual([1, 2, 3, 4, 5])
    })

    it(`should return 1, 2, 5`, async () => {
        li.delete(3, 4)
        expect(result).toEqual([1, 2, 5])
    })

    it(`should return 1, 2, 3, 4, 6, 5`, async () => {
        li.insertAt(2, 3, 4, 6)
        expect(result).toEqual([1, 2, 3, 4, 6, 5])
    })

    it(`should return 1, 2, 3, 4`, async () => {
        li.deleteAt(4, 2)
        expect(result).toEqual([1, 2, 3, 4])
    })

    it(`should return 1, 2, 4`, async () => {
        li.deleteAt(2)
        expect(result).toEqual([1, 2, 4])
    })

    it(`should return 4, 2, 1`, async () => {
        li.reverse()
        expect(result).toEqual([4, 2, 1])
    })

    it(`should return 1, 2, 4, 8`, async () => {
        li.sort((a, b) => a - b)
        expect(result).toEqual([1, 2, 4])
    })
})
