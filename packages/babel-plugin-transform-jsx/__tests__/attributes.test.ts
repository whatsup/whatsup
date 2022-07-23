import { transform } from './__config__/transform'

describe('transform attributes', function () {
    it('Should transform key prop', function () {
        expect(transform('<div key="Key" />')).toMatchSnapshot()
    })

    it('Should transform simple props', function () {
        expect(transform('<div prop1="value1" />')).toMatchSnapshot()
    })

    it('Should transform boolean prop', function () {
        expect(transform('<div focused />')).toMatchSnapshot()
    })

    it('Should transform props with expressions', function () {
        expect(transform('<div prop1={1 + 1} />')).toMatchSnapshot()
    })

    it('Should transform props spread', function () {
        expect(transform('<div {...props} />')).toMatchSnapshot()
    })

    it('Should transform different props variations', function () {
        expect(transform('<div key="Key" prop1="value1" prop2={2 + 2} {...props} />')).toMatchSnapshot()
    })

    it('Should transform different props with ref', function () {
        expect(transform('<div ref={myRef} key="Key" prop1="value1" prop2={2 + 2} {...props} />')).toMatchSnapshot()
    })

    it('Should transform different props with ref onMount onUnmount', function () {
        expect(
            transform(
                '<div ref={myRef} onMount={onMount} onUnmount={onUnmount} key="Key" prop1="value1" prop2={2 + 2} {...props} />'
            )
        ).toMatchSnapshot()
    })

    it('Should transform namespaced name', function () {
        expect(transform('<div css:blue />')).toMatchSnapshot()
    })

    it('Should transform cssx var', function () {
        expect(transform('<div css:$var />')).toMatchSnapshot()
    })
})
