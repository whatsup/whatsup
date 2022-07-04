import { autorun } from '../src/reactions'
import { rebuild } from '../src/rebuild'
import { createAtom } from '../src/atom'

describe('Rebuild', () => {
    it(`Should force rebuild atom`, () => {
        const mock1 = jest.fn()
        const atom = createAtom(() => mock1())

        autorun(() => atom.get())

        expect(mock1).toBeCalledTimes(1)

        rebuild(atom)

        expect(mock1).toBeCalledTimes(2)
    })
})
