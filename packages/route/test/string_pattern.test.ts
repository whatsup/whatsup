/**
 * @jest-environment jsdom
 */

import { whatsUp } from 'whatsup'
import { redirect } from '@whatsup/browser-pathname'
import { route } from '../src/route'

describe('String pattern test', () => {
    const mock = jest.fn()
    const rootRoute = route('/root', function* () {
        while (true) {
            yield 'ROOT'
        }
    })

    whatsUp(rootRoute, mock)

    it('should mock called with null', () => {
        expect(mock).lastCalledWith(null)
    })

    it('should mock called with "ROOT"', () => {
        redirect('/root')
        expect(mock).lastCalledWith('ROOT')
    })
})
