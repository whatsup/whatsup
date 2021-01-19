/**
 * @jest-environment jsdom
 */

import { fractal, whatsUp } from 'whatsup'
import { redirect } from '@whatsup/browser-pathname'
import { route } from '../src/route'

describe('From fractal', () => {
    const mock = jest.fn()
    const errorMock = jest.fn()
    const root = fractal(function* () {
        while (true) {
            yield 'ROOT'
        }
    })
    const rootRoute = route(/\/root/, root)

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
