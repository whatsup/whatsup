/**
 * @jest-environment jsdom
 */

import { fractal } from '@fract/core'
import { component, html } from '../src/factories'
import { render } from '../src/render'

describe('render', function () {
    it('should render single child', async function () {
        const container = document.createElement('div')
        const Root = fractal(async function* () {
            while (true) {
                yield html('div', '', '', undefined)
            }
        })

        await render(Root, container)

        expect(container.childNodes.length).toBe(1)
        expect(container.children[0].tagName).toBe('DIV')
    })

    it('should render many children', async function () {
        const container = document.createElement('div')
        const Root = fractal(async function* () {
            while (true) {
                yield [html('div', '', '', undefined), html('div', '', '', undefined)]
            }
        })

        await render(Root, container)

        expect(container.childNodes.length).toBe(2)
        expect(container.children[0].tagName).toBe('DIV')
        expect(container.children[1].tagName).toBe('DIV')
    })

    it('should render component', async function () {
        function Component() {
            return [html('div', '', '', undefined), html('div', '', '', undefined)]
        }
        const container = document.createElement('div')
        const Root = fractal(async function* () {
            while (true) {
                yield component(Component, '', '', undefined)
            }
        })

        await render(Root, container)

        expect(container.childNodes.length).toBe(2)
        expect(container.children[0].tagName).toBe('DIV')
        expect(container.children[1].tagName).toBe('DIV')
    })

    it('should print error to console log', async function () {
        const container = document.createElement('div')
        const Root = fractal(async function* () {
            while (true) {
                throw 'wtf'
            }
        })

        const mock = jest.fn()
        const original = console.error

        console.error = mock

        await render(Root, container)

        console.error = original

        expect(mock).toBeCalledTimes(1)
        expect(mock).lastCalledWith('wtf')
    })

    it('should render default to document.body', async function () {
        const Root = fractal(async function* () {
            while (true) {
                yield html('div', '', '', undefined)
            }
        })

        await render(Root)

        expect(document.body.childNodes.length).toBe(1)
        expect(document.body.children[0].tagName).toBe('DIV')
    })
})
