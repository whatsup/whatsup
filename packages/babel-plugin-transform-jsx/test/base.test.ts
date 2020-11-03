import { transform } from './config/transform'

describe('transform types', function () {
    it('Should transform div', function () {
        expect(transform('<div>foobar</div>')).toMatchSnapshot()
    })

    it('Should transform User', function () {
        expect(transform('<User>foobar</User>')).toMatchSnapshot()
    })

    it('Should transform svg', function () {
        expect(transform('<svg>foobar</svg>')).toMatchSnapshot()
    })

    it('Should transform fragment', function () {
        expect(transform('<>foobar</>')).toMatchSnapshot()
    })

    it('Should throw error on namespaced name', function () {
        expect(() => transform('<ns:div>foobar</ns:div>')).toThrowError(
            'Namespaced openingElement name is not supported'
        )
    })

    it('Should throw error when name is member expression', function () {
        expect(() => transform('<ns.div>foobar</ns.div>')).toThrowError(
            'OpeningElement name as member expression is not supported'
        )
    })
})
