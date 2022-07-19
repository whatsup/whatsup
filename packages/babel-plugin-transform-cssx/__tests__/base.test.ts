/**
 * @jest-environment jest-environment-node-single-context
 */

import { transform } from './__config__/transform'

describe('transform types', function () {
    it('Should transform css modules', function () {
        expect(transform('./modules.tsx')).toMatchSnapshot()
    })

    it('Should transform cssx', function () {
        expect(transform('./cssx.tsx')).toMatchSnapshot()
    })

    it('Should transform mixed', function () {
        expect(transform('./mixed.tsx')).toMatchSnapshot()
    })

    it('Should transform simle css', function () {
        expect(transform('./simple_css.tsx')).toMatchSnapshot()
    })
})
