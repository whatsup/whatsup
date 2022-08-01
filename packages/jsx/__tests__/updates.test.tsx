/**
 * @jest-environment jsdom
 */

import { observable } from '@whatsup/core'
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
                trigger()

                yield <Child val={1} />
            }
        }

        render(<Root />, container)

        expect(mock).toBeCalledTimes(1)

        trigger(2)

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
                trigger()

                yield <Child>1</Child>
            }
        }

        render(<Root />, container)

        expect(mock).toBeCalledTimes(1)

        trigger(2)

        expect(mock).toBeCalledTimes(1)
    })

    it('should rerender when child updated', function () {
        const container = document.createElement('div')
        const trigger = observable(false)

        function Child() {
            if (trigger()) {
                return <div>Child</div>
            }
            return null
        }

        function Root() {
            return <Child />
        }

        render(<Root />, container)

        expect(container.innerHTML).toBe('')

        trigger(true)

        expect(container.innerHTML).toBe('<div>Child</div>')
    })

    it('should proceed render iterator if results is primitive', function () {
        const container = document.createElement('div')
        const trigger = observable<number>(0)

        function* Root() {
            trigger()
            yield null
            trigger()
            yield 1
            trigger()
            yield false
            trigger()
            yield 'str'
            trigger()
            yield true
            trigger()
            yield <div />
        }

        render(<Root />, container)

        expect(container.innerHTML).toBe('')

        trigger(1)

        expect(container.innerHTML).toBe('1')

        trigger(2)

        expect(container.innerHTML).toBe('')

        trigger(3)

        expect(container.innerHTML).toBe('str')

        trigger(4)

        expect(container.innerHTML).toBe('')

        trigger(5)

        expect(container.innerHTML).toBe('<div></div>')
    })
})
