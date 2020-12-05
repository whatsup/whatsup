import { transform } from './config/transform'

describe('transform children', function () {
    it('Should transform without children', function () {
        expect(transform('<div></div>')).toMatchSnapshot()
    })

    it('Should transform once child', function () {
        expect(transform('<div><span /></div>')).toMatchSnapshot()
    })

    it('Should transform many children', function () {
        expect(transform('<ul><li /><li /></ul>')).toMatchSnapshot()
    })

    it('Should transform children with primitives', function () {
        expect(transform('<div><span>foo</span>bar<i>baz</i></div>')).toMatchSnapshot()
    })

    it('Should transform children spread', function () {
        expect(transform('<div><span>foo</span>{...other}</div>')).toMatchSnapshot()
    })

    it('Should transform children with expressions', function () {
        expect(transform('<div><span>foo</span>{[`one`, `two`].map(i => <span>{i}</span>)}</div>')).toMatchSnapshot()
    })

    it('Should trim whitespaces right only', function () {
        expect(transform('<div>{count} items </div>')).toMatchSnapshot()
    })

    it('Should trim whitespaces left only', function () {
        expect(transform('<div> items {count}</div>')).toMatchSnapshot()
    })

    it('Should trim whitespaces and create empty children', function () {
        expect(transform('<div>    </div>')).toMatchSnapshot()
    })
})
