import { Fractal } from '../src/fractal'
import { Atom } from '../src/atom'

const delay = (time: number) => new Promise((r) => setTimeout(r, time))

describe('Atom', () => {
    const callCheck = jest.fn()
    const destroyCheck = jest.fn()

    class TestFractal extends Fractal<string> {
        async *collector() {
            try {
                while (true) {
                    callCheck()
                    yield 'Hello'
                }
            } finally {
                destroyCheck()
            }
        }
    }
    const testFractal = new TestFractal()
    const atom = new Atom(testFractal)

    it('should throw error when update call before activate', async () => {
        expect(() => atom.update()).toThrow()
    })

    it('should activate & calculate data', async () => {
        await atom.activate()

        expect(callCheck).toBeCalledTimes(1)
        expect(atom.getData()).toBe('Hello')
    })

    it('should ignore next activate calls', async () => {
        await atom.activate()
        expect(callCheck).toBeCalledTimes(1)
    })

    it('should have revision 1', () => {
        expect(atom.getRevision()).toBe(1)
    })

    it('should reset props & call return method on iterator when destroy', async () => {
        atom.destroy()

        expect(atom.getData()).toBeUndefined()
        expect(atom.getRevision()).toBe(0)
        expect(atom['activityId']).toBe(0)
        await delay(100)
        expect(destroyCheck).toBeCalledTimes(1)
    })

    it('should be reactivated & return this when it iterate', async () => {
        const iterator = atom.emit()

        const { done, value } = await iterator.next()

        expect(done).toBeFalsy()
        expect(value).toBe(atom)
    })

    it('should call callCheck when rebuild called', async () => {
        await atom.update()

        expect(callCheck).toBeCalledTimes(3)
    })

    it('should return same atom for fractal', () => {
        const fractal2 = new TestFractal()
        const sub1 = atom.getSubatom(fractal2)
        const sub2 = atom.getSubatom(fractal2)

        expect(sub1).toBe(sub2)
    })

    it('should throw error when source arg of private createSubatom is not Fractal || Delegation', () => {
        expect(() => atom['createSubatom'](null as any)).toThrowError()
    })
})
