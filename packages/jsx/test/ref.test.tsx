/**
 * @jest-environment jsdom
 */

import { createRef } from '../src/create_ref'
import { render } from '../src/render'

describe('refs', function () {
    it('should return {current: null}', function () {
        expect(createRef()).toMatchObject({ current: null })
    })

    it('should define ref', function () {
        document.body.innerHTML = ''

        const ref = createRef()

        function* Root() {
            while (true) {
                yield <div ref={ref} />
            }
        }

        render(<Root />)

        expect(ref.current).toBe(document.body.children[0])
    })

    it('should define single child as ref', function () {
        document.body.innerHTML = ''

        const ref = createRef()

        function Component() {
            return <div />
        }

        function* Root() {
            while (true) {
                yield <Component ref={ref} />
            }
        }

        render(<Root />)

        expect(ref.current).toBe(document.body.children[0])
    })

    it('should define children array as ref', function () {
        document.body.innerHTML = ''

        const ref = createRef()

        function Component() {
            return [<div />, <div />]
        }

        function* Root() {
            while (true) {
                yield <Component ref={ref} />
            }
        }

        render(<Root />)

        expect(ref.current).toBeInstanceOf(Array)
        expect(ref.current.length).toBe(2)
        expect(ref.current[0]).toBe(document.body.children[0])
        expect(ref.current[1]).toBe(document.body.children[1])
    })
})
