/**
 * @jest-environment jsdom
 */

import { Context, createRef, render } from '@whatsup/jsx'
import { cssx } from '../src'

describe('Base test', () => {
    it('should create cssx element', () => {
        const container = document.createElement('div')
        const classnamesMap = {
            one: 'one',
            two: 'two',
            thr: 'thr',
        }

        const Div = cssx('div', classnamesMap)

        function App(this: Context) {
            return (
                <Div css:one css:two>
                    test
                </Div>
            )
        }

        render(<App />, container)

        expect(container.innerHTML).toBe('<div class="one two">test</div>')
    })

    it('should create cssx component', () => {
        const container = document.createElement('div')
        const classnamesMap = {
            one: 'one',
            two: 'two',
            thr: 'thr',
        }

        interface CompProps {}

        function Comp(props: CompProps) {
            return <div {...props} />
        }

        const CSSXComp = cssx(Comp, classnamesMap)

        function App(this: Context) {
            return (
                <CSSXComp css:one css:two>
                    test
                </CSSXComp>
            )
        }

        render(<App />, container)

        expect(container.innerHTML).toBe('<div class="one two">test</div>')
    })

    it('should keep props of cssx component', () => {
        const container = document.createElement('div')
        const classnamesMap = {
            one: 'one',
            two: 'two',
            thr: 'thr',
        }

        interface CompProps {
            value: string
        }

        function Comp(props: CompProps) {
            const { value, ...other } = props

            return <div {...other}>{value}</div>
        }

        const CSSXComp = cssx(Comp, classnamesMap)

        function App(this: Context) {
            return <CSSXComp css:one css:two value="test" />
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

        const Div = cssx('div', classnamesMap)

        function App(this: Context) {
            return (
                <Div css:one css:two style={{ backgroundColor: 'red' }}>
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

        const Div = cssx('div', classnamesMap)

        function App(this: Context) {
            return (
                <Div css:one css:two className="own_cls">
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

        const Div = cssx('div', classnamesMap)

        function App(this: Context) {
            return (
                <Div css:one css:two css:$var="10px">
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

        const Div = cssx('div', classnamesMap)
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

    it('should show warning', () => {
        const mock = jest.fn()
        const origin = console.warn
        const container = document.createElement('div')
        const classnamesMap = {
            one: 'one',
        }

        console.warn = mock

        const Div = cssx('div', classnamesMap) as any

        function App(this: Context) {
            return (
                <Div css:one css:two>
                    test
                </Div>
            )
        }

        render(<App />, container)

        console.warn = origin

        expect(mock.mock.calls[0][0]).toBe('Unknown classname "two"')
    })
})
