import { Factor, factor } from '../src/factor'
import { Context } from '../src/context'

describe('Factor', () => {
    const context1 = {} as Context
    const context2 = { parent: context1 } as Context
    const context3 = { parent: context2 } as Context
    const context4 = {} as Context
    const testFactor = new Factor('default')

    it('should have defaultValue', () => {
        expect(testFactor.defaultValue).toBe('default')
    })

    it('should define value in context', () => {
        testFactor.set(context1, 'test')

        expect(testFactor['contexts'].has(context1)).toBeTruthy()
        expect(testFactor['contexts'].get(context1)).toBe('test')
    })

    it('should return defaultValue on same define level', () => {
        const value = testFactor.get(context1)

        expect(value).toBe('default')
    })

    it('should return test value on child levels', () => {
        const value1 = testFactor.get(context2)
        const value2 = testFactor.get(context3)

        expect(value1).toBe('test')
        expect(value2).toBe('test')
    })

    it('should return defaultValue when factor is not defined', () => {
        const value = testFactor.get(context4)

        expect(value).toBe('default')
    })

    it('factor("test") should return instance of factor', () => {
        expect(factor('test')).toBeInstanceOf(Factor)
    })
})
