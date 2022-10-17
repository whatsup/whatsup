/**
 * @jest-environment jsdom
 */

import { render } from '../src/render'
import { observable } from '@whatsup/core'

describe('reconcilation', function () {
    it('should return data when old mutator is same mutator', function () {
        const container = document.createElement('div')
        const trigger = observable(0)

        function Test() {
            return <div />
        }

        render(<Test />, container)

        const div = container.children[0]

        trigger(1)

        expect(container.children[0]).toBe(div)
    })

    it('should not reuse element when old mutator not have same type & reconcileId', function () {
        const container = document.createElement('div')
        const trigger = observable(0)

        function Test() {
            return trigger() ? <div key="1" /> : <div key="2" />
        }

        render(<Test />, container)

        const div = container.children[0]

        trigger(1)

        expect(container.children[0]).not.toBe(div)
    })

    it('should render children', function () {
        const container = document.createElement('div')

        function Test() {
            return (
                <div>
                    <div>child1</div>
                    <div>child2</div>
                </div>
            )
        }

        render(<Test />, container)

        expect(container.innerHTML).toBe('<div><div>child1</div><div>child2</div></div>')
    })

    it('should render children elements, mutators, strings, numbers & ignore null & booleans', function () {
        const container = document.createElement('div')

        function Test() {
            return (
                <div>
                    <div>child1</div>
                    <div>child2</div>
                    child3
                    {1612}
                    {null}
                    {false}
                    {true}
                </div>
            )
        }

        render(<Test />, container)

        expect(container.innerHTML).toBe('<div><div>child1</div><div>child2</div> child3 1612</div>')
    })

    it('should throw error on all children except elements, mutators, strings, numbers, booleans, null', function () {
        const container = document.createElement('div')
        const mock = jest.fn()
        const original = console.error

        console.error = mock

        function Test() {
            return (
                <div>
                    <div>child1</div>
                    <div>child2</div>
                    child3
                    {undefined as any}
                    {1612}
                    {null}
                    {false}
                    {true}
                </div>
            )
        }

        render(<Test />, container)

        console.log = original

        expect(mock.mock.calls[0][0].message).toBe('Invalid JSX Child')
    })

    it('should remove unreconciled elements', function () {
        const container = document.createElement('div')
        const trigger = observable(true)

        function Test() {
            return <div>{trigger() && <div />}</div>
        }

        render(<Test />, container)

        expect(container.children[0].children.length).toBe(1)

        trigger(false)

        expect(container.children[0].children.length).toBe(0)
    })

    it('should replace elements with different reconcileId', function () {
        const container = document.createElement('div')
        const trigger = observable(true)

        function Test() {
            return <div>{trigger() ? <div key="1" /> : <div key="2" />}</div>
        }

        render(<Test />, container)

        const one = container.children[0].children[0]

        trigger(false)

        expect(container.children[0].children.length).toBe(1)
        expect(container.children[0].children[0]).not.toBe(one)
    })

    it('should reverse elements when mutators reversed', function () {
        const container = document.createElement('div')
        const trigger = observable([0, 1])

        function Test() {
            return (
                <div>
                    {trigger().map((key) => (
                        <div key={key} />
                    ))}
                </div>
            )
        }

        render(<Test />, container)

        const one = container.children[0].children[0]
        const two = container.children[0].children[1]

        trigger([1, 0])

        expect(container.children[0].children.length).toBe(2)
        expect(container.children[0].children[0]).toBe(two)
        expect(container.children[0].children[1]).toBe(one)
    })

    it('should save rendered elements', function () {
        const htmlRendered = document.createElement('div')
        const textRendered = document.createTextNode('')
        const container = document.createElement('div')

        function Test() {
            return (
                <div>
                    {htmlRendered}
                    {textRendered}
                </div>
            )
        }

        render(<Test />, container)

        expect(container.children[0].childNodes[0]).toBe(htmlRendered)
        expect(container.children[0].childNodes[1]).toBe(textRendered)
    })

    it('should render string | number to TextNode', function () {
        const container = document.createElement('div')

        function Test() {
            return (
                <div>
                    {'hello'}
                    {1612}
                </div>
            )
        }

        render(<Test />, container)

        expect(container.children[0].childNodes.length).toBe(2)
        expect(container.children[0].childNodes[0]).toBeInstanceOf(Text)
        expect(container.children[0].childNodes[1]).toBeInstanceOf(Text)
        expect(container.children[0].childNodes[0].nodeValue).toBe('hello')
        expect(container.children[0].childNodes[1].nodeValue).toBe('1612')
    })

    it('should reuse TextNode', function () {
        const container = document.createElement('div')
        const trigger = observable(false)

        function Test() {
            return <div>{trigger() ? ['hello', 1612] : ['hello', 'world']}</div>
        }

        render(<Test />, container)

        const childOne = container.children[0].childNodes[0]
        const childTwo = container.children[0].childNodes[1]

        trigger(true)

        expect(container.children[0].childNodes.length).toBe(2)
        expect(container.children[0].childNodes[0]).toBe(childOne)
        expect(container.children[0].childNodes[1]).toBe(childTwo)
        expect(container.children[0].childNodes[0].nodeValue).toBe('hello')
        expect(container.children[0].childNodes[1].nodeValue).toBe('1612')
    })

    it('should render nested array', function () {
        const container = document.createElement('div')

        function Test() {
            return (
                <div>
                    <div>foo</div>
                    {[<div>baz</div>, <div>bar</div>]}
                </div>
            )
        }

        render(<Test />, container)

        expect(container.children[0].childNodes.length).toBe(3)
        expect(container.children[0].textContent).toBe('foobazbar')
    })

    it('should be prepared for the child to return an array', function () {
        const container = document.createElement('div')

        function Comp() {
            return [<div>baz</div>, <div>bar</div>]
        }

        function Test() {
            return (
                <div>
                    <div>foo</div>
                    <Comp />
                </div>
            )
        }

        render(<Test />, container)

        expect(container.children[0].childNodes.length).toBe(3)
        expect(container.children[0].textContent).toBe('foobazbar')
    })
})
