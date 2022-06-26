/**
 * @jest-environment jsdom
 */

import { observable } from 'whatsup'
import { render } from '../src/render'

describe('Updates', function () {
    it('should not rerender child when props not changed', function () {
        const container = document.createElement('div')
        const trigger = observable(0)
        const mock = jest.fn()

        function Child(props: { val: number }) {
            mock()
            return <div>{props.val}</div>
        }

        function* Root() {
            while (true) {
                trigger.get()

                yield <Child val={1} />
            }
        }

        render(<Root />, container)

        expect(mock).toBeCalledTimes(1)

        trigger.set(2)

        expect(mock).toBeCalledTimes(1)
    })

    it('should not rerender child when children not changed', function () {
        const container = document.createElement('div')
        const trigger = observable(0)
        const mock = jest.fn()

        function Child(props: { children: any }) {
            mock()
            return <div>{props.children}</div>
        }

        function* Root() {
            while (true) {
                trigger.get()

                yield <Child>1</Child>
            }
        }

        render(<Root />, container)

        expect(mock).toBeCalledTimes(1)

        trigger.set(2)

        expect(mock).toBeCalledTimes(1)
    })

    it('should rerender when child updated', function () {
        const container = document.createElement('div')
        const trigger = observable(false)

        function Child() {
            if (trigger.get()) {
                return <div>Child</div>
            }
            return null
        }

        function Root() {
            return <Child />
        }

        render(<Root />, container)

        expect(container.innerHTML).toBe('')

        trigger.set(true)

        expect(container.innerHTML).toBe('<div>Child</div>')
    })
})
