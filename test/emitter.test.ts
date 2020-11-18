import { Fractal, CollectIterator } from '../src/fractal'
import { ConsumerQuery } from '../src/query'

class TestFractal extends Fractal<string> {
    async *collector() {
        yield 'Hello'
    }
}

describe('Fractal', () => {
    let testFractal: TestFractal
    let iterator: CollectIterator<string>

    it('create new fractal without errors', () => {
        testFractal = new TestFractal()
    })

    it('should return ConsumerQuery', async () => {
        iterator = testFractal[Symbol.asyncIterator]()
        const { done, value } = await iterator.next()

        expect(done).toBeFalsy()
        expect(value).toBeInstanceOf(ConsumerQuery)
    })

    it('should call consumer.getSubatom and return it result', async () => {
        const fakeConsumer = {
            getSubatom: jest.fn(function () {
                return {
                    async *emit() {
                        return yield fakeConsumer
                    },
                }
            }),
        }

        const { done, value } = await iterator.next(fakeConsumer)

        expect(done).toBeFalsy()
        expect(value).toBe(fakeConsumer)
        expect(fakeConsumer.getSubatom).toBeCalledWith(testFractal)
    })

    it('should return FakeResult', async () => {
        const { done, value } = await iterator.next('FakeResult')

        expect(done).toBeTruthy()
        expect(value).toBe('FakeResult')
    })
})
