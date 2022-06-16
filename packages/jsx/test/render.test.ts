/**
 * @jest-environment jsdom
 */

import { observable, computed, autorun } from 'whatsup'
import { component, html } from '../src/factories'
import { render } from '../src/render'
import { WhatsJSX } from '../src/types'

describe('render', function () {
    // it('should take only JsxMutator', function () {
    //     expect(() => render('')).toThrowError()
    // })

    it('should render string', function () {
        const container = document.createElement('div')

        render('hello', container)

        expect(container.innerHTML).toBe('hello')
    })

    it('should render number', function () {
        const container = document.createElement('div')

        render(1, container)

        expect(container.innerHTML).toBe('1')
    })

    it('should render array', function () {
        const container = document.createElement('div')

        render([1, 'hello'], container)

        expect(container.innerHTML).toBe('1hello')
    })

    it('should render single child', function () {
        const container = document.createElement('div')
        function* Root() {
            while (true) {
                yield html('div', '', '', undefined)
            }
        }

        render(component(Root, '', '', undefined), container)

        expect(container.childNodes.length).toBe(1)
        expect(container.children[0].tagName).toBe('DIV')
    })

    it('should prevent recalc top stream when render element', function () {
        const mock = jest.fn()
        const trigger = observable(0)
        const root = computed(function* () {
            while (true) {
                yield html('div', '', '', undefined, undefined, [trigger.get()])
            }
        })

        autorun(() => mock(root.get()))

        expect(mock).toBeCalledTimes(1)
        trigger.set(1)
        expect(mock).toBeCalledTimes(1)
    })

    it('should prevent recalc when disposed', function () {
        const container = document.createElement('div')
        const trigger = observable(0)
        function* Root() {
            while (true) {
                yield html('div', '', '', undefined, undefined, [trigger.get()])
            }
        }

        const dispose = render(component(Root, '', '', undefined), container)

        expect(container.childNodes.length).toBe(1)
        expect(container.children[0].tagName).toBe('DIV')
        expect(container.children[0].innerHTML).toBe('0')

        trigger.set(1)

        expect(container.children[0].innerHTML).toBe('1')

        dispose()

        trigger.set(2)

        expect(container.children[0].innerHTML).toBe('1')
    })

    it('should render many children', function () {
        const container = document.createElement('div')
        function* Root() {
            while (true) {
                yield [html('div', '1', '', undefined), html('div', '2', '', undefined)]
            }
        }

        render(component(Root, '', '', undefined), container)

        expect(container.childNodes.length).toBe(2)
        expect(container.children[0].tagName).toBe('DIV')
        expect(container.children[1].tagName).toBe('DIV')
    })

    it('should render fn component', function () {
        function Component() {
            return [html('div', '', '', undefined), html('div', '', '', undefined)]
        }
        const container = document.createElement('div')
        function* Root() {
            while (true) {
                yield component(Component, '', '', undefined)
            }
        }

        render(component(Root, '', '', undefined), container)

        expect(container.childNodes.length).toBe(2)
        expect(container.children[0].tagName).toBe('DIV')
        expect(container.children[1].tagName).toBe('DIV')
    })

    it('should render gn component', function () {
        function* Component() {
            yield [html('div', '', '', undefined), html('div', '', '', undefined)]
        }
        const container = document.createElement('div')
        function* Root() {
            while (true) {
                yield component(Component, '', '', undefined)
            }
        }

        render(component(Root, '', '', undefined), container)

        expect(container.childNodes.length).toBe(2)
        expect(container.children[0].tagName).toBe('DIV')
        expect(container.children[1].tagName).toBe('DIV')
    })

    it('should prevent recalc top stream when render component', function () {
        const mock = jest.fn()
        const trigger = observable(0)

        function Component({ children }: WhatsJSX.ComponentProps) {
            return html('div', '', '', undefined, undefined, children as WhatsJSX.Child[])
        }

        const root = computed(function* () {
            while (true) {
                yield component(Component, '', '', undefined, undefined, [trigger.get()])
            }
        })

        autorun(() => mock(root))

        expect(mock).toBeCalledTimes(1)
        trigger.set(1)
        expect(mock).toBeCalledTimes(1)
    })

    it('should print error to console log', function () {
        const container = document.createElement('div')
        function* Root() {
            while (true) {
                throw 'wtf'
            }
        }

        const mock = jest.fn()
        const original = console.error

        console.error = mock

        render(component(Root, '', '', undefined), container)

        console.error = original

        expect(mock).toBeCalledTimes(1)
        expect(mock).lastCalledWith('wtf')
    })

    it('should render default to document.body', function () {
        function* Root() {
            while (true) {
                yield html('div', '', '', undefined)
            }
        }

        render(component(Root, '', '', undefined))

        expect(document.body.childNodes.length).toBe(1)
        expect(document.body.children[0].tagName).toBe('DIV')
    })

    it('should render return value from AtomComponent', function () {
        const container = document.createElement('div')

        function* Root() {
            return html('div', '', '', undefined)
        }

        expect(container.childNodes.length).toBe(0)

        render(component(Root, '', '', undefined), container)

        expect(container.childNodes.length).toBe(1)
        expect(container.children[0].tagName).toBe('DIV')
    })

    it('should render return value from GnComponent', function () {
        const container = document.createElement('div')

        function* Root(_: any) {
            return html('div', '', '', undefined)
        }

        expect(container.childNodes.length).toBe(0)

        render(component(Root, '', '', undefined), container)

        expect(container.childNodes.length).toBe(1)
        expect(container.children[0].tagName).toBe('DIV')
    })

    it('should pass props', function () {
        const container = document.createElement('div')
        const trigger = observable(0)

        interface NextProps extends WhatsJSX.ComponentProps {
            value: number
        }

        function* Nest(props: NextProps) {
            while (true) {
                const { value } = props

                props = yield html('div', '', '', undefined, undefined, [value])
            }
        }

        function* Root() {
            while (true) {
                const value = trigger.get()
                yield html('div', '', '', undefined, undefined, [component(Nest, '', undefined, undefined, { value })])
            }
        }

        expect(container.childNodes.length).toBe(0)

        render(component(Root, '', '', undefined), container)

        expect(container.innerHTML).toBe('<div><div>0</div></div>')

        trigger.set(1)

        expect(container.innerHTML).toBe('<div><div>1</div></div>')
    })

    it('should call dispose mock in Am component', function () {
        const container = document.createElement('div')
        const trigger = observable(0)
        const mock = jest.fn()

        function* Nest() {
            try {
                while (true) {
                    yield html('div', '', '', undefined, undefined)
                }
            } finally {
                mock()
            }
        }

        function* Root() {
            while (true) {
                const value = trigger.get()

                if (value === 0) {
                    yield html('div', '', '', undefined, undefined, [component(Nest, '', undefined, undefined)])
                    continue
                }

                yield null
            }
        }

        expect(container.childNodes.length).toBe(0)

        render(component(Root, '', '', undefined), container)

        expect(container.innerHTML).toBe('<div><div></div></div>')
        expect(mock).not.toBeCalled()

        trigger.set(1)

        expect(container.innerHTML).toBe('')
        expect(mock).toBeCalled()
    })
})
