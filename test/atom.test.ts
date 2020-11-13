import { Emitter } from '../src/emitter'
import { Atom } from '../src/atom'

const delay = (time: number) => new Promise((r) => setTimeout(r, time))

describe('Atom', () => {
    const callCheck = jest.fn()
    const destroyCheck = jest.fn()

    class TestEmitter extends Emitter<string> {
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
    const emitter = new TestEmitter()
    const atom = new Atom(emitter)

    it('should throw error when update call before activate', async () => {
        expect(atom.update()).rejects.toThrow()
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
        const iterator = atom[Symbol.asyncIterator]()

        const { done, value } = await iterator.next()

        expect(done).toBeFalsy()
        expect(value).toBe(atom)
    })

    it('should call callCheck when rebuild called', async () => {
        await atom.rebuild(atom)

        expect(callCheck).toBeCalledTimes(3)
    })

    it('should return same atom for emitter', () => {
        const emitter2 = new TestEmitter()
        const sub1 = atom.getSubatom(emitter2)
        const sub2 = atom.getSubatom(emitter2)

        expect(sub1).toBe(sub2)
    })

    it('should throw error when source arg of private createSubatom is not Emitter || Delegation', () => {
        expect(() => atom['createSubatom'](null as any)).toThrowError()
    })
})
