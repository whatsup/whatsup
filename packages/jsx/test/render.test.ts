/**
 * @jest-environment jsdom
 */

import { conse, fractal, whatsUp } from 'whatsup'
import { component, html } from '../src/factories'
import { render } from '../src/render'
import { WhatsJSX } from '../src/types'

describe('render', function () {
    it('should render single child', function () {
        const container = document.createElement('div')
        const Root = fractal(function* () {
            while (true) {
                yield html('div', '', '', undefined)
            }
        })

        render(Root, container)

        expect(container.childNodes.length).toBe(1)
        expect(container.children[0].tagName).toBe('DIV')
    })

    it('should prevent recalc top stream when render element', function () {
        const mock = jest.fn()
        const trigger = conse(0)
        const Root = fractal(function* () {
            while (true) {
                yield html('div', '', '', undefined, undefined, [yield* trigger])
            }
        })

        whatsUp(Root, mock)

        expect(mock).toBeCalledTimes(1)
        trigger.set(1)
        expect(mock).toBeCalledTimes(1)
    })

    it('should render many children', function () {
        const container = document.createElement('div')
        const Root = fractal(function* () {
            while (true) {
                yield [html('div', '', '', undefined), html('div', '', '', undefined)]
            }
        })

        render(Root, container)

        expect(container.childNodes.length).toBe(2)
        expect(container.children[0].tagName).toBe('DIV')
        expect(container.children[1].tagName).toBe('DIV')
    })

    it('should render component', function () {
        function Component() {
            return [html('div', '', '', undefined), html('div', '', '', undefined)]
        }
        const container = document.createElement('div')
        const Root = fractal(function* () {
            while (true) {
                yield component(Component, '', '', undefined)
            }
        })

        render(Root, container)

        expect(container.childNodes.length).toBe(2)
        expect(container.children[0].tagName).toBe('DIV')
        expect(container.children[1].tagName).toBe('DIV')
    })

    it('should prevent recalc top stream when render component', function () {
        const mock = jest.fn()
        const trigger = conse(0)

        function Component({ children }: WhatsJSX.ComponentProps) {
            return html('div', '', '', undefined, undefined, children as WhatsJSX.Child[])
        }

        const Root = fractal(function* () {
            while (true) {
                yield component(Component, '', '', undefined, undefined, [yield* trigger])
            }
        })

        whatsUp(Root, mock)

        expect(mock).toBeCalledTimes(1)
        trigger.set(1)
        expect(mock).toBeCalledTimes(1)
    })

    it('should print error to console log', function () {
        const container = document.createElement('div')
        const Root = fractal(function* () {
            while (true) {
                throw 'wtf'
            }
        })

        const mock = jest.fn()
        const original = console.error

        console.error = mock

        render(Root, container)

        console.error = original

        expect(mock).toBeCalledTimes(1)
        expect(mock).lastCalledWith('wtf')
    })

    it('should render default to document.body', function () {
        const Root = fractal(function* () {
            while (true) {
                yield html('div', '', '', undefined)
            }
        })

        render(Root)

        expect(document.body.childNodes.length).toBe(1)
        expect(document.body.children[0].tagName).toBe('DIV')
    })
})
