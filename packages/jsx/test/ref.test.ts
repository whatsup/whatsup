/**
 * @jest-environment jsdom
 */

import { fractal } from '@fract/core'
import { createRef } from '../src/create_ref'
import { component, html } from '../src/factories'
import { render } from '../src/render'

describe('refs', function () {
    it('should return {current: null}', function () {
        expect(createRef()).toMatchObject({ current: null })
    })

    it('should define ref', async function () {
        document.body.innerHTML = ''

        const ref = createRef()
        const Root = fractal(function* () {
            while (true) {
                yield html('div', '', '', ref)
            }
        })

        render(Root)

        expect(ref.current).toBe(document.body.children[0])
    })

    it('should define single child as ref', function () {
        document.body.innerHTML = ''

        const ref = createRef()

        function Component() {
            return html('div', '', undefined, undefined)
        }

        const Root = fractal(function* () {
            while (true) {
                yield component(Component, '', undefined, ref)
            }
        })

        render(Root)

        expect(ref.current).toBe(document.body.children[0])
    })

    it('should define children array as ref', function () {
        document.body.innerHTML = ''

        const ref = createRef()

        function Component() {
            return [html('div', '', undefined, undefined), html('div', '', undefined, undefined)]
        }

        const Root = fractal(function* () {
            while (true) {
                yield component(Component, '', undefined, ref)
            }
        })

        render(Root)

        expect(ref.current).toBeInstanceOf(Array)
        expect(ref.current.length).toBe(2)
        expect(ref.current[0]).toBe(document.body.children[0])
        expect(ref.current[1]).toBe(document.body.children[1])
    })
})
