/**
 * @jest-environment jsdom
 */

import { fractal } from 'whatsup-js'
import { component, html } from '../src/factories'
import { render } from '../src/render'

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
