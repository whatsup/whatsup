/**
 * @jest-environment jsdom
 */

import { Context, createRef, render } from '@whatsup/jsx'
import { createComponent } from '../src'

describe('Base test', () => {
    it('should create cssx component', () => {
        const container = document.createElement('div')
        const classnamesMap = {
            one: 'one',
            two: 'two',
            thr: 'thr',
        }

        const Div = createComponent('div', classnamesMap)

        function App(this: Context) {
            return (
                <Div one two>
                    test
                </Div>
            )
        }

        render(<App />, container)

        expect(container.innerHTML).toBe('<div class="one two">test</div>')
    })

    it('should keep style prop', () => {
        const container = document.createElement('div')
        const classnamesMap = {
            one: 'one',
            two: 'two',
            thr: 'thr',
        }

        const Div = createComponent('div', classnamesMap)

        function App(this: Context) {
            return (
                <Div one two style={{ backgroundColor: 'red' }}>
                    test
                </Div>
            )
        }

        render(<App />, container)

        expect(container.innerHTML).toBe('<div style="background-color: red;" class="one two">test</div>')
    })

    it('should keep className prop', () => {
        const container = document.createElement('div')
        const classnamesMap = {
            one: 'one',
            two: 'two',
            thr: 'thr',
        }

        const Div = createComponent('div', classnamesMap)

        function App(this: Context) {
            return (
                <Div one two className="own_cls">
                    test
                </Div>
            )
        }

        render(<App />, container)

        expect(container.innerHTML).toBe('<div class="one two own_cls">test</div>')
    })

    it('should pass __variable', () => {
        const container = document.createElement('div')
        const classnamesMap = {
            one: 'one',
            two: 'two',
            thr: 'thr',
        }

        const Div = createComponent('div', classnamesMap)

        function App(this: Context) {
            return (
                <Div one two __var="10px">
                    test
                </Div>
            )
        }

        render(<App />, container)

        expect(container.innerHTML).toBe('<div style="--var: 10px;" class="one two">test</div>')
    })

    it('should keep other prop', () => {
        const container = document.createElement('div')
        const classnamesMap = {
            one: 'one',
            two: 'two',
            thr: 'thr',
        }

        const Div = createComponent('div', classnamesMap)
        const onClick = jest.fn()
        const ref = createRef()

        function App(this: Context) {
            return (
                <Div ref={ref} onClick={onClick}>
                    test
                </Div>
            )
        }

        render(<App />, container)

        expect(container.innerHTML).toBe('<div>test</div>')

        ref.current.click()

        expect(onClick).toBeCalled()
    })
})
