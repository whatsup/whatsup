import { Emitter, EmitIterator } from '../src/emitter'
import { ConsumerQuery } from '../src/query'

class TestEmitter extends Emitter<string> {
    async *collector() {
        yield 'Hello'
    }
}

describe('Emitter', () => {
    let emitter: TestEmitter
    let iterator: EmitIterator<string>

    it('create new emitter without errors', () => {
        emitter = new TestEmitter()
    })

    it('should return ConsumerQuery', async () => {
        iterator = emitter[Symbol.asyncIterator]()
        const { done, value } = await iterator.next()

        expect(done).toBeFalsy()
        expect(value).toBeInstanceOf(ConsumerQuery)
    })

    it('should call consumer.getSubatom and return it result', async () => {
        const fakeConsumer = {
            getSubatom: jest.fn(function () {
                return {
                    async *[Symbol.asyncIterator]() {
                        return yield fakeConsumer
                    },
                }
            }),
        }

        const { done, value } = await iterator.next(fakeConsumer)

        expect(done).toBeFalsy()
        expect(value).toBe(fakeConsumer)
        expect(fakeConsumer.getSubatom).toBeCalledWith(emitter)
    })

    it('should return FakeResult', async () => {
        const { done, value } = await iterator.next('FakeResult')

        expect(done).toBeTruthy()
        expect(value).toBe('FakeResult')
    })
})
