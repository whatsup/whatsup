/**
 * @jest-environment jsdom
 */

import { observable } from '@whatsup/core'
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

        render(undefined as any, container)

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

    it('should render fragment', function () {
        const container = document.createElement('div')
        function* Root() {
            while (true) {
                yield (
                    <>
                        <div></div>
                    </>
                )
            }
        }

        render(<Root />, container)

        expect(container.innerHTML).toBe('<div></div>')
    })

    it('should render empty fragment', function () {
        const container = document.createElement('div')
        function* Root() {
            while (true) {
                yield <></>
            }
        }

        render(<Root />, container)

        expect(container.innerHTML).toBe('')
    })

    it('should prevent recalc when disposed', function () {
        const container = document.createElement('div')
        const trigger = observable(0)
        function* Root() {
            while (true) {
                yield <div>{trigger()}</div>
            }
        }

        const dispose = render(<Root />, container)

        expect(container.innerHTML).toBe('<div>0</div>')

        trigger(1)

        expect(container.innerHTML).toBe('<div>1</div>')

        dispose()

        trigger(2)

        expect(container.innerHTML).toBe('<div>1</div>')
    })

    it('should prevent recalc when children not changed', function () {
        const container = document.createElement('div')
        const trigger = observable(0)
        const mock1 = jest.fn()
        const mock2 = jest.fn()

        function Wrapper(props: { children: any }) {
            mock2()

            return <div>{props.children}</div>
        }

        function* Root() {
            while (true) {
                mock1()

                yield (
                    <div>
                        <div>{trigger()}</div>
                        <Wrapper>
                            <div>test</div>
                        </Wrapper>
                    </div>
                )
            }
        }

        const dispose = render(<Root />, container)

        expect(mock1).toBeCalledTimes(1)
        expect(mock2).toBeCalledTimes(1)
        expect(container.innerHTML).toBe('<div><div>0</div><div><div>test</div></div></div>')

        trigger(1)

        expect(mock1).toBeCalledTimes(2)
        expect(mock2).toBeCalledTimes(1)
        expect(container.innerHTML).toBe('<div><div>1</div><div><div>test</div></div></div>')

        dispose()
    })

    it('should recalc when children changed', function () {
        const container = document.createElement('div')
        const trigger = observable(0)
        const mock1 = jest.fn()
        const mock2 = jest.fn()

        function Wrapper(props: { children: any }) {
            mock2()

            return <div>{props.children}</div>
        }

        function* Root() {
            while (true) {
                mock1()

                yield (
                    <div>
                        <Wrapper>
                            <div>{trigger()}</div>
                        </Wrapper>
                    </div>
                )
            }
        }

        const dispose = render(<Root />, container)

        expect(mock1).toBeCalledTimes(1)
        expect(mock2).toBeCalledTimes(1)
        expect(container.innerHTML).toBe('<div><div><div>0</div></div></div>')

        trigger(1)

        expect(mock1).toBeCalledTimes(2)
        expect(mock2).toBeCalledTimes(2)
        expect(container.innerHTML).toBe('<div><div><div>1</div></div></div>')

        dispose()
    })

    it('should prevent recalc when children style not changed', function () {
        const container = document.createElement('div')
        const trigger = observable(0)
        const mock1 = jest.fn()
        const mock2 = jest.fn()

        function Wrapper(props: { children: any }) {
            mock2()

            return <div>{props.children}</div>
        }

        function* Root() {
            while (true) {
                mock1()

                yield (
                    <div>
                        <div>{trigger()}</div>
                        <Wrapper>
                            <div style={{ color: 'red' }}>test</div>
                        </Wrapper>
                    </div>
                )
            }
        }

        const dispose = render(<Root />, container)

        expect(mock1).toBeCalledTimes(1)
        expect(mock2).toBeCalledTimes(1)
        expect(container.innerHTML).toBe('<div><div>0</div><div><div style="color: red;">test</div></div></div>')

        trigger(1)

        expect(mock1).toBeCalledTimes(2)
        expect(mock2).toBeCalledTimes(1)
        expect(container.innerHTML).toBe('<div><div>1</div><div><div style="color: red;">test</div></div></div>')

        dispose()
    })

    it('should recalc when children style changed', function () {
        const container = document.createElement('div')
        const trigger = observable(0)
        const mock1 = jest.fn()
        const mock2 = jest.fn()

        function Wrapper(props: { children: any }) {
            mock2()

            return <div>{props.children}</div>
        }

        function* Root() {
            while (true) {
                mock1()

                yield (
                    <div>
                        <Wrapper>
                            <div style={{ fontSize: trigger() }}>test</div>
                        </Wrapper>
                    </div>
                )
            }
        }

        const dispose = render(<Root />, container)

        expect(mock1).toBeCalledTimes(1)
        expect(mock2).toBeCalledTimes(1)
        expect(container.innerHTML).toBe('<div><div><div style="font-size: 0px;">test</div></div></div>')

        trigger(1)

        expect(mock1).toBeCalledTimes(2)
        expect(mock2).toBeCalledTimes(2)
        expect(container.innerHTML).toBe('<div><div><div style="font-size: 1px;">test</div></div></div>')

        dispose()
    })

    it('should recalc when childrens changed', function () {
        const container = document.createElement('div')
        const trigger = observable(0)
        const mock1 = jest.fn()
        const mock2 = jest.fn()

        function Wrapper(props: { children: any }) {
            mock2()

            return <div>{props.children}</div>
        }

        function* Root() {
            while (true) {
                mock1()

                yield (
                    <div>
                        <Wrapper>
                            <div>test</div>
                            {trigger() === 0 ? <span>test</span> : <div>test</div>}
                        </Wrapper>
                    </div>
                )
            }
        }

        const dispose = render(<Root />, container)

        expect(mock1).toBeCalledTimes(1)
        expect(mock2).toBeCalledTimes(1)
        expect(container.innerHTML).toBe('<div><div><div>test</div><span>test</span></div></div>')

        trigger(1)

        expect(mock1).toBeCalledTimes(2)
        expect(mock2).toBeCalledTimes(2)
        expect(container.innerHTML).toBe('<div><div><div>test</div><div>test</div></div></div>')

        dispose()
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
                const value = trigger()
                yield <Nest value={value} />
            }
        }

        render(<Root />, container)

        expect(container.innerHTML).toBe('<div>0</div>')

        trigger(1)

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
                const value = trigger()

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

        trigger(1)

        expect(container.innerHTML).toBe('')
        expect(mock).toBeCalled()
    })
})
