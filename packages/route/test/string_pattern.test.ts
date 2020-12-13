/**
 * @jest-environment jsdom
 */

import { watch } from '@fract/core'
import { redirect } from '@fract/browser-pathname'
import { route } from '../src/route'

describe('String pattern test', () => {
    const mock = jest.fn()
    const rootRoute = route('/root', function* () {
        while (true) {
            yield 'ROOT'
        }
    })

    watch(rootRoute, mock)

    it('should mock called with null', () => {
        expect(mock).lastCalledWith(null)
    })

    it('should mock called with "ROOT"', () => {
        redirect('/root')
        expect(mock).lastCalledWith('ROOT')
    })
})
