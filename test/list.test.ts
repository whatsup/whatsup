import { fraction } from '../src/fraction'
import { list } from '../src/list'
import { stream } from '../src/runners'

describe('List', () => {
    const li = list<number>()
    const st = stream(li)

    it(`should return 1, 2, 3`, async () => {
        li.insert(1, 2, 3)
        expect((await st.next()).value).toEqual([1, 2, 3])
    })

    it(`should return 1, 2, 3, 4, 5`, async () => {
        li.insert(4, 5)
        expect((await st.next()).value).toEqual([1, 2, 3, 4, 5])
    })

    it(`should return 1, 2, 5`, async () => {
        li.delete(3, 4)
        expect((await st.next()).value).toEqual([1, 2, 5])
    })

    it(`should return 1, 2, 3, 4, 6, 5`, async () => {
        li.insertAt(2, 3, 4, 6)
        expect((await st.next()).value).toEqual([1, 2, 3, 4, 6, 5])
    })

    it(`should return 1, 2, 3, 4`, async () => {
        li.deleteAt(4, 2)
        expect((await st.next()).value).toEqual([1, 2, 3, 4])
    })

    it(`should return 1, 2, 4`, async () => {
        li.deleteAt(2)
        expect((await st.next()).value).toEqual([1, 2, 4])
    })

    it(`should return 4, 2, 1`, async () => {
        li.reverse()
        expect((await st.next()).value).toEqual([4, 2, 1])
    })

    it(`should return 4, 2, 8, 1`, async () => {
        li.insertAt(2, fraction(8) as any)
        expect((await st.next()).value).toEqual([4, 2, 8, 1])
    })

    it(`should return 1, 2, 4, 8`, async () => {
        li.sort((a, b) => a - b)
        expect((await st.next()).value).toEqual([1, 2, 4, 8])
    })
})
