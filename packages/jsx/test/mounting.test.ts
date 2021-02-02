/**
 * @jest-environment jsdom
 */

import { Context, fractal } from 'whatsup'
import { html, component } from '../src/factories'
import { render } from '../src/render'

describe('Mounting', function () {
    it('should call onMount when element mounted', async function () {
        document.body.innerHTML = ''

        const onMount = jest.fn()
        const Root = fractal(function* () {
            while (true) {
                yield html('div', '', '', undefined, { onMount })
            }
        })

        render(Root)

        await new Promise((r) => setTimeout(r, 100))

        expect(onMount).toBeCalledTimes(1)
        expect(onMount).lastCalledWith(document.body.children[0])
    })

    it('should call onUnmount when element unmounted', async function () {
        document.body.innerHTML = ''

        let next: () => void

        const onUnmount = jest.fn()

        const Root = fractal(function* (ctx: Context) {
            next = () => ctx.update()

            yield html('div', '', '1', undefined, { onUnmount })
            yield html('div', '', '2', undefined)
        })

        render(Root)

        const div = document.body.children[0]

        expect(onUnmount).toBeCalledTimes(0)

        next!()

        await new Promise((r) => setTimeout(r, 100))

        expect(onUnmount).toBeCalledTimes(1)
        expect(onUnmount).lastCalledWith(div)
    })

    it('should call onMount when component mounted', async function () {
        document.body.innerHTML = ''

        const onMount = jest.fn()

        function Component() {
            return html('div', '', '', undefined)
        }

        const Root = fractal(function* () {
            while (true) {
                yield component(Component, '', '', undefined, { onMount })
            }
        })

        render(Root)

        await new Promise((r) => setTimeout(r, 100))

        expect(onMount).toBeCalledTimes(1)
        expect(onMount).lastCalledWith(document.body.children[0])
    })

    it('should call onUnmount when component unmounted', async function () {
        document.body.innerHTML = ''

        let next: () => void

        const onUnmount = jest.fn()

        function Component() {
            return html('div', '', '', undefined)
        }

        const Root = fractal(function* (ctx: Context) {
            next = () => ctx.update()

            yield component(Component, '', '1', undefined, { onUnmount })
            yield component(Component, '', '2', undefined)
        })

        render(Root)

        const div = document.body.children[0]

        expect(onUnmount).toBeCalledTimes(0)

        next!()

        await new Promise((r) => setTimeout(r, 100))

        expect(onUnmount).toBeCalledTimes(1)
        expect(onUnmount).lastCalledWith(div)
    })
})
