/**
 * @jest-environment jsdom
 */

import { observable } from 'whatsup'
import { html, component } from '../src/factories'
import { render } from '../src/render'

describe('Mounting', function () {
    it('should call onMount when element mounted', async function () {
        document.body.innerHTML = ''

        const onMount = jest.fn()
        function* Root() {
            while (true) {
                yield html('div', '', '', undefined, { onMount })
            }
        }

        render(component(Root, '', '', undefined))

        await new Promise((r) => setTimeout(r, 100))

        expect(onMount).toBeCalledTimes(1)
        expect(onMount).lastCalledWith(document.body.children[0])
    })

    it('should call child onMount when element mounted', async function () {
        document.body.innerHTML = ''

        const onMount = jest.fn()
        function* Root() {
            while (true) {
                yield html('div', '', '', undefined, undefined, [html('div', '', '', undefined, { onMount })])
            }
        }

        render(component(Root, '', '', undefined))

        await new Promise((r) => setTimeout(r, 100))

        expect(onMount).toBeCalledTimes(1)
        expect(onMount).lastCalledWith(document.body.children[0].children[0])
    })

    it('should call onUnmount when element unmounted', async function () {
        document.body.innerHTML = ''

        let kickstart: () => void

        const onUnmount = jest.fn()

        function* Root() {
            const trigger = observable(0)

            kickstart = () => trigger.set(Math.random())

            trigger.get()

            yield html('div', '', '1', undefined, { onUnmount })
            yield html('div', '', '2', undefined)
        }

        render(component(Root, '', '', undefined))

        const div = document.body.children[0]

        expect(onUnmount).toBeCalledTimes(0)

        kickstart!()

        await new Promise((r) => setTimeout(r, 100))

        expect(onUnmount).toBeCalledTimes(1)
        expect(onUnmount).lastCalledWith(div)
    })

    it('should call child onUnmount when element unmounted', async function () {
        document.body.innerHTML = ''

        let kickstart: () => void

        const onUnmount = jest.fn()

        function* Root() {
            const trigger = observable(0)

            kickstart = () => trigger.set(Math.random())

            trigger.get()

            yield html('div', '', '1', undefined, undefined, [html('div', '', '1', undefined, { onUnmount })])
            yield html('div', '', '2', undefined)
        }

        render(component(Root, '', '', undefined))

        const div = document.body.children[0].children[0]

        expect(onUnmount).toBeCalledTimes(0)

        kickstart!()

        await new Promise((r) => setTimeout(r, 100))

        expect(onUnmount).toBeCalledTimes(1)
        expect(onUnmount).lastCalledWith(div)
    })

    it('should call onMount when component mounted', async function () {
        document.body.innerHTML = ''

        const onMount = jest.fn()

        function Component() {
            return html('div', '', '', undefined)
        }

        function* Root() {
            while (true) {
                yield component(Component, '', '', undefined, { onMount })
            }
        }

        render(component(Root, '', '', undefined))

        await new Promise((r) => setTimeout(r, 100))

        expect(onMount).toBeCalledTimes(1)
        expect(onMount).lastCalledWith(document.body.children[0])
    })

    it('should call child onMount when component mounted', async function () {
        document.body.innerHTML = ''

        const onMount = jest.fn()

        function Component(props: any) {
            return html('div', '', '', undefined, undefined, props.children)
        }

        function* Root() {
            while (true) {
                yield component(Component, '', '', undefined, undefined, [
                    component(Component, '', '', undefined, { onMount }),
                ])
            }
        }

        render(component(Root, '', '', undefined))

        await new Promise((r) => setTimeout(r, 100))

        expect(onMount).toBeCalledTimes(1)
        expect(onMount).lastCalledWith(document.body.children[0].children[0])
    })

    it('should call onUnmount when component unmounted', async function () {
        document.body.innerHTML = ''

        let kickstart: () => void

        const onUnmount = jest.fn()

        function Component() {
            return html('div', '', '', undefined)
        }

        function* Root() {
            const trigger = observable(0)

            kickstart = () => trigger.set(Math.random())

            trigger.get()

            yield component(Component, '', '1', undefined, { onUnmount })
            yield component(Component, '', '2', undefined)
        }

        render(component(Root, '', '', undefined))

        const div = document.body.children[0]

        expect(onUnmount).toBeCalledTimes(0)

        kickstart!()

        await new Promise((r) => setTimeout(r, 100))

        expect(onUnmount).toBeCalledTimes(1)
        expect(onUnmount).lastCalledWith(div)
    })

    it('should call child onUnmount when component unmounted', async function () {
        document.body.innerHTML = ''

        let kickstart: () => void

        const onUnmount = jest.fn()

        function Component(props: any) {
            return html('div', '', '', undefined, undefined, props.children)
        }

        function* Root() {
            const trigger = observable(0)

            kickstart = () => trigger.set(Math.random())

            trigger.get()

            yield component(Component, '', '1', undefined, undefined, [
                component(Component, '', '1', undefined, { onUnmount }),
            ])
            yield component(Component, '', '2', undefined)
        }

        render(component(Root, '', '', undefined))

        const div = document.body.children[0].children[0]

        expect(onUnmount).toBeCalledTimes(0)

        kickstart!()

        await new Promise((r) => setTimeout(r, 100))

        expect(onUnmount).toBeCalledTimes(1)
        expect(onUnmount).lastCalledWith(div)
    })

    it('should call return on generator when am component unmounted', async function () {
        document.body.innerHTML = ''

        let kickstart: () => void

        const mock = jest.fn()

        function* Component() {
            try {
                while (true) {
                    yield html('div', '', '', undefined)
                }
            } finally {
                mock()
            }
        }

        function* Root() {
            const trigger = observable(0)

            kickstart = () => trigger.set(Math.random())

            trigger.get()

            yield component(Component, '', '1', undefined)
            yield html('div', '', '', undefined)
        }

        render(component(Root, '', '', undefined))

        expect(mock).toBeCalledTimes(0)

        kickstart!()

        await new Promise((r) => setTimeout(r, 100))

        expect(mock).toBeCalledTimes(1)
    })

    it('should call return on generator when gn component unmounted', async function () {
        document.body.innerHTML = ''

        let kickstart: () => void

        const mock = jest.fn()

        function* Component(props: any) {
            try {
                while (true) {
                    props = yield html('div', '', '', undefined, props)
                }
            } finally {
                mock()
            }
        }

        function* Root() {
            const trigger = observable(0)

            kickstart = () => trigger.set(Math.random())

            trigger.get()

            yield component(Component, '', '1', undefined)
            yield html('div', '', '', undefined)
        }

        render(component(Root, '', '', undefined))

        expect(mock).toBeCalledTimes(0)

        kickstart!()

        await new Promise((r) => setTimeout(r, 100))

        expect(mock).toBeCalledTimes(1)
    })
})
