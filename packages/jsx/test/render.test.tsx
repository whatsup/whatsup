/**
 * @jest-environment jsdom
 */

import { observable } from 'whatsup'
import { render } from '../src/render'

describe('render', function () {
    it('should render null', function () {
        const container = document.createElement('div')

        render(null, container)

        expect(container.innerHTML).toBe('')
    })

    it('should render boolean', function () {
        const container = document.createElement('div')

        render(true, container)

        expect(container.innerHTML).toBe('')
    })

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

    it('should print error on render undefined', function () {
        const container = document.createElement('div')
        const mock = jest.fn()
        const original = console.error

        console.error = mock

        render(undefined, container)

        console.error = original

        expect(mock).toBeCalledTimes(1)
        expect(mock.mock.calls[0][0].message).toBe('Invalid JSX Child')
    })

    it('should render single child', function () {
        const container = document.createElement('div')
        function* Root() {
            while (true) {
                yield <div />
            }
        }

        render(<Root />, container)

        expect(container.innerHTML).toBe('<div></div>')
    })

    it('should prevent recalc when disposed', function () {
        const container = document.createElement('div')
        const trigger = observable(0)
        function* Root() {
            while (true) {
                yield <div>{trigger.get()}</div>
            }
        }

        const dispose = render(<Root />, container)

        expect(container.innerHTML).toBe('<div>0</div>')

        trigger.set(1)

        expect(container.innerHTML).toBe('<div>1</div>')

        dispose()

        trigger.set(2)

        expect(container.innerHTML).toBe('<div>1</div>')
    })

    it('should render many children', function () {
        const container = document.createElement('div')
        function* Root() {
            while (true) {
                yield [<div />, <div />]
            }
        }

        render(<Root />, container)

        expect(container.innerHTML).toBe('<div></div><div></div>')
    })

    it('should render FnComponent', function () {
        const container = document.createElement('div')

        function Component() {
            return <div>fn</div>
        }

        render(<Component />, container)

        expect(container.innerHTML).toBe('<div>fn</div>')
    })

    it('should render GnComponent', function () {
        const container = document.createElement('div')

        function* Component() {
            yield <div>gn</div>
        }

        render(<Component />, container)

        expect(container.innerHTML).toBe('<div>gn</div>')
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

        render(<Root />, container)

        console.error = original

        expect(mock).toBeCalledTimes(1)
        expect(mock).lastCalledWith('wtf')
    })

    it('should render default to document.body', function () {
        function* Root() {
            while (true) {
                yield <div />
            }
        }

        render(<Root />)

        expect(document.body.innerHTML).toBe('<div></div>')
    })

    it('should render return value from GnComponent', function () {
        const container = document.createElement('div')

        function* Root() {
            return <div />
        }

        expect(container.innerHTML).toBe('')

        render(<Root />, container)

        expect(container.innerHTML).toBe('<div></div>')
    })

    it('should pass props', function () {
        const container = document.createElement('div')
        const trigger = observable(0)

        interface NestProps {
            value: number
        }

        function* Nest(props: NestProps) {
            while (true) {
                props = yield <div>{props.value}</div>
            }
        }

        function* Root() {
            while (true) {
                const value = trigger.get()
                yield <Nest value={value} />
            }
        }

        render(<Root />, container)

        expect(container.innerHTML).toBe('<div>0</div>')

        trigger.set(1)

        expect(container.innerHTML).toBe('<div>1</div>')
    })

    it('should call dispose mock in GnComponent', function () {
        const container = document.createElement('div')
        const trigger = observable(0)
        const mock = jest.fn()

        function* Nest() {
            try {
                while (true) {
                    yield <div />
                }
            } finally {
                mock()
            }
        }

        function* Root() {
            while (true) {
                const value = trigger.get()

                if (value === 0) {
                    yield <Nest />
                    continue
                }

                yield null
            }
        }

        render(<Root />, container)

        expect(container.innerHTML).toBe('<div></div>')
        expect(mock).not.toBeCalled()

        trigger.set(1)

        expect(container.innerHTML).toBe('')
        expect(mock).toBeCalled()
    })
})
