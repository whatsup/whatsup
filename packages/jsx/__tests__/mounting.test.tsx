/**
 * @jest-environment jsdom
 */

import { observable } from '@whatsup/core'
import { render } from '../src/render'

describe('Mounting', function () {
    it('should call onMount when element mounted', async function () {
        document.body.innerHTML = ''

        const onMount = jest.fn()

        function* Root() {
            while (true) {
                yield <div onMount={onMount} />
            }
        }

        render(<Root />)

        await new Promise((r) => setTimeout(r, 100))

        expect(onMount).toBeCalledTimes(1)
        expect(onMount).lastCalledWith(document.body.children[0])
    })

    it('should call onMount with many children from fragment', async function () {
        document.body.innerHTML = ''

        const onMount = jest.fn()

        function Comp() {
            return (
                <>
                    <div />
                    <div />
                </>
            )
        }

        function* Root() {
            while (true) {
                yield <Comp onMount={onMount} />
            }
        }

        render(<Root />)

        await new Promise((r) => setTimeout(r, 100))

        expect(onMount).lastCalledWith(expect.arrayContaining([document.body.children[0], document.body.children[1]]))
    })

    it('should call onMount with many children from array', async function () {
        document.body.innerHTML = ''

        const onMount = jest.fn()

        function Comp() {
            return [<div />, <div />]
        }

        function* Root() {
            while (true) {
                yield <Comp onMount={onMount} />
            }
        }

        render(<Root />)

        await new Promise((r) => setTimeout(r, 100))

        expect(onMount).lastCalledWith(expect.arrayContaining([document.body.children[0], document.body.children[1]]))
    })

    it('should call onMount with text node', async function () {
        document.body.innerHTML = ''

        const onMount = jest.fn()

        function Comp() {
            return 'Hello'
        }

        function* Root() {
            while (true) {
                yield <Comp onMount={onMount} />
            }
        }

        render(<Root />)

        await new Promise((r) => setTimeout(r, 100))

        expect(onMount).lastCalledWith(document.body.childNodes[0])
    })

    it('should call onMount with many text nodes', async function () {
        document.body.innerHTML = ''

        const onMount = jest.fn()

        function Comp() {
            return ['Hello', 'World']
        }

        function* Root() {
            while (true) {
                yield <Comp onMount={onMount} />
            }
        }

        render(<Root />)

        await new Promise((r) => setTimeout(r, 100))

        expect(onMount).lastCalledWith(
            expect.arrayContaining([document.body.childNodes[0], document.body.childNodes[1]])
        )
    })

    it('should call child onMount when element mounted', async function () {
        document.body.innerHTML = ''

        const onMount = jest.fn()

        function* Root() {
            while (true) {
                yield (
                    <div>
                        <div onMount={onMount} />
                    </div>
                )
            }
        }

        render(<Root />)

        await new Promise((r) => setTimeout(r, 100))

        expect(onMount).toBeCalledTimes(1)
        expect(onMount).lastCalledWith(document.body.children[0].children[0])
    })

    it('should call onUnmount when element unmounted', async function () {
        document.body.innerHTML = ''

        const onUnmount = jest.fn()
        const trigger = observable(0)

        function* Root() {
            trigger()

            yield <div onUnmount={onUnmount} />
            yield <div />
        }

        render(<Root />)

        const div = document.body.children[0]

        expect(onUnmount).toBeCalledTimes(0)

        trigger(1)

        await new Promise((r) => setTimeout(r, 100))

        expect(onUnmount).toBeCalledTimes(1)
        expect(onUnmount).lastCalledWith(div)
    })

    it('should call child onUnmount when element unmounted', async function () {
        document.body.innerHTML = ''

        const onUnmount = jest.fn()
        const trigger = observable(0)

        function* Root() {
            trigger()

            yield (
                <div>
                    <div onUnmount={onUnmount} />
                </div>
            )
            yield <div />
        }

        render(<Root />)

        const div = document.body.children[0].children[0]

        expect(onUnmount).toBeCalledTimes(0)

        trigger(1)

        await new Promise((r) => setTimeout(r, 100))

        expect(onUnmount).toBeCalledTimes(1)
        expect(onUnmount).lastCalledWith(div)
    })

    it('should call onMount when component mounted', async function () {
        document.body.innerHTML = ''

        const onMount = jest.fn()

        function Component() {
            return <div />
        }

        function* Root() {
            while (true) {
                yield <Component onMount={onMount} />
            }
        }

        render(<Root />)

        await new Promise((r) => setTimeout(r, 100))

        expect(onMount).toBeCalledTimes(1)
        expect(onMount).lastCalledWith(document.body.children[0])
    })

    it('should call child onMount when component mounted', async function () {
        document.body.innerHTML = ''

        const onMount = jest.fn()

        function Component(props: any) {
            return <div>{props.children}</div>
        }

        function* Root() {
            while (true) {
                yield (
                    <Component>
                        <Component onMount={onMount} />
                    </Component>
                )
            }
        }

        render(<Root />)

        await new Promise((r) => setTimeout(r, 100))

        expect(onMount).toBeCalledTimes(1)
        expect(onMount).lastCalledWith(document.body.children[0].children[0])
    })

    it('should call onUnmount when component unmounted', async function () {
        document.body.innerHTML = ''

        const trigger = observable(0)
        const onUnmount = jest.fn()

        function Component() {
            return <div />
        }

        function* Root() {
            trigger()

            yield <Component onUnmount={onUnmount} />
            yield <Component />
        }

        render(<Root />)

        const div = document.body.children[0]

        expect(onUnmount).toBeCalledTimes(0)

        trigger(1)

        await new Promise((r) => setTimeout(r, 100))

        expect(onUnmount).toBeCalledTimes(1)
        expect(onUnmount).lastCalledWith(div)
    })

    it('should call child onUnmount when component unmounted', async function () {
        document.body.innerHTML = ''

        const trigger = observable(0)

        const onUnmount = jest.fn()

        function Component(props: any) {
            return <div>{props.children}</div>
        }

        function* Root() {
            trigger()

            yield (
                <Component>
                    <Component onUnmount={onUnmount} />
                </Component>
            )

            yield <Component />
        }

        render(<Root />)

        const div = document.body.children[0].children[0]

        expect(onUnmount).toBeCalledTimes(0)

        trigger(1)

        await new Promise((r) => setTimeout(r, 100))

        expect(onUnmount).toBeCalledTimes(1)
        expect(onUnmount).lastCalledWith(div)
    })

    it('should call return on generator when component unmounted', async function () {
        document.body.innerHTML = ''

        const trigger = observable(0)
        const mock = jest.fn()

        function* Component() {
            try {
                while (true) {
                    yield <div />
                }
            } finally {
                mock()
            }
        }

        function* Root() {
            trigger()

            yield <Component />
            yield <div />
        }

        render(<Root />)

        expect(mock).toBeCalledTimes(0)

        trigger(1)

        await new Promise((r) => setTimeout(r, 100))

        expect(mock).toBeCalledTimes(1)
    })
})
