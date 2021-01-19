/**
 * @jest-environment jsdom
 */

import { whatsUp } from 'whatsup'
import { redirect } from '@whatsup/browser-pathname'
import { route } from '../src/route'

describe('Base test', () => {
    const mock = jest.fn()
    const errorMock = jest.fn()
    const rootRoute = route(/\/root/, function* () {
        while (true) {
            yield 'ROOT'
        }
    })

    whatsUp(rootRoute, mock, errorMock)

    it('should mock called with null', () => {
        expect(mock).lastCalledWith(null)
    })

    it('should mock called with "ROOT"', () => {
        redirect('/root')
        expect(mock).lastCalledWith('ROOT')
    })

    it('should mock again called with null', () => {
        redirect('/about')
        expect(mock).lastCalledWith(null)
    })

    it('should call errorMock', () => {
        redirect('begin/root')
        expect(errorMock).lastCalledWith(
            'Matched substring must beginning from first char (current is 6). Check your RegExp.'
        )
    })
})
