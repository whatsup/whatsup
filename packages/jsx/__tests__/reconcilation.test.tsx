/**
 * @jest-environment jsdom
 */

import { SVG_NAMESPACE } from '../src/constants'
import { jsx, ElementMutator } from '../src/mutator'

describe('reconcilation', function () {
    it('expect HTMLElementMutator.mutate return div element', function () {
        const mutator = (<div />) as ElementMutator
        const element = mutator.mutate()

        expect(element.tagName).toBe('DIV')
    })

    it('expect SVGElementMutator.mutate return svg element', function () {
        const mutator = (<svg />) as ElementMutator
        const element = mutator.mutate()

        expect(element.tagName).toBe('svg')
    })

    it('should return data when old mutator is same mutator', function () {
        const mutator = (<div />) as ElementMutator
        const element = mutator.mutate()
        const nextElement = mutator.mutate(element)

        expect(nextElement).toBe(element)
    })

    it('should not reuse element when old mutator not have same type & reconcileId', function () {
        const mutatorOne = (<div key={1} />) as ElementMutator
        const mutatorTwo = (<div key={2} />) as ElementMutator
        const elementOne = mutatorOne.mutate()
        const elementTwo = mutatorTwo.mutate(elementOne)

        expect(elementOne).not.toBe(elementTwo)
    })

    it('should render children', function () {
        const mutator = (
            <div>
                <div>child1</div>
                <div>child2</div>
            </div>
        ) as ElementMutator

        const element = mutator.mutate()

        expect(element.outerHTML).toBe('<div><div>child1</div><div>child2</div></div>')
    })

    it('should render children elements, mutators, strings, numbers & ignore null & booleans', function () {
        const mutator = (
            <div>
                <div>child1</div>
                <div>child2</div>
                child3
                {1612}
                {null}
                {false}
                {true}
            </div>
        ) as ElementMutator
        const element = mutator.mutate()

        expect(element.outerHTML).toBe('<div><div>child1</div><div>child2</div> child3 1612</div>')
    })

    it('should throw error on all children except elements, mutators, strings, numbers, booleans, null', function () {
        const mutator = (
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
        ) as ElementMutator

        expect(() => mutator.mutate()).toThrow('Invalid JSX Child')
    })

    it('should remove unreconciled elements', function () {
        const mutatorOne = jsx('div', 'uid1', { children: jsx('div', 'child1') })
        const mutatorTwo = jsx('div', 'uid1')
        const element = mutatorOne.mutate() as HTMLElement

        expect(element.childNodes.length).toBe(1)

        mutatorTwo.mutate(element as any)

        expect(element.childNodes.length).toBe(0)
    })

    it('should replace elements with different reconcileId', function () {
        const mutatorOne = jsx('div', 'uid1', { children: jsx('div', 'child1') })
        const mutatorTwo = jsx('div', 'uid1', { children: jsx('div', 'child2') })
        const element = mutatorOne.mutate() as HTMLElement
        const childOne = element.childNodes[0]

        mutatorTwo.mutate(element as any)

        const childTwo = element.childNodes[0]

        expect(element.childNodes.length).toBe(1)
        expect(childOne).not.toBe(childTwo)
    })

    it('should reverse elements when mutators reversed', function () {
        const mutatorOne = jsx('div', 'uid1', { children: [jsx('div', 'child1'), jsx('div', 'child2')] })
        const mutatorTwo = jsx('div', 'uid1', {
            children: [jsx('div', 'child2'), jsx('div', 'child1')],
        })
        const element = mutatorOne.mutate() as HTMLElement

        expect(element.childNodes.length).toBe(2)

        const childOne = element.childNodes[0]
        const childTwo = element.childNodes[1]

        mutatorTwo.mutate(element as any)

        expect(element.childNodes.length).toBe(2)
        expect(element.childNodes[0]).toBe(childTwo)
        expect(element.childNodes[1]).toBe(childOne)
    })

    it('should save rendered elements', function () {
        const htmlRendered = jsx('div', '').mutate() as HTMLElement
        const svgRendered = jsx('svg', '').mutate() as SVGElement
        const textRendered = document.createTextNode('')
        const mutatorOne = jsx('div', 'uid1', { children: [htmlRendered, svgRendered, textRendered] })
        const mutatorTwo = jsx('div', 'uid1', { children: [htmlRendered, svgRendered, textRendered] })
        const element = mutatorOne.mutate() as HTMLElement

        mutatorTwo.mutate(element as any)

        expect(element.childNodes.length).toBe(3)
        expect(element.childNodes[0]).toBe(htmlRendered)
        expect(element.childNodes[1]).toBe(svgRendered)
        expect(element.childNodes[2]).toBe(textRendered)
    })

    it('should render string | number to TextNode', function () {
        const mutator = jsx('div', 'uid1', { children: ['hello', 1612] })
        const element = mutator.mutate() as HTMLElement

        expect(element.childNodes.length).toBe(2)
        expect(element.childNodes[0]).toBeInstanceOf(Text)
        expect(element.childNodes[1]).toBeInstanceOf(Text)
        expect(element.childNodes[0].nodeValue).toBe('hello')
        expect(element.childNodes[1].nodeValue).toBe('1612')
    })

    it('should reuse TextNode', function () {
        const mutatorOne = jsx('div', 'uid1', { children: ['hello', 1612] })
        const mutatorTwo = jsx('div', 'uid1', { children: ['hello', 'world'] })
        const element = mutatorOne.mutate() as HTMLElement

        expect(element.childNodes.length).toBe(2)
        expect(element.childNodes[0].nodeValue).toBe('hello')
        expect(element.childNodes[1].nodeValue).toBe('1612')

        const childOne = element.childNodes[0]
        const childTwo = element.childNodes[1]

        mutatorTwo.mutate(element as any)

        expect(element.childNodes.length).toBe(2)
        expect(element.childNodes[0]).toBe(childOne)
        expect(element.childNodes[1]).toBe(childTwo)
        expect(element.childNodes[0].nodeValue).toBe('hello')
        expect(element.childNodes[1].nodeValue).toBe('world')
    })

    it('should render nested array', function () {
        const mutator = jsx('div', '1', {
            children: [
                jsx('div', '2', { children: ['foo'] }),
                [jsx('div', '3', { children: ['baz'] }), jsx('div', '3', { children: ['bar'] })],
            ],
        })
        const element = mutator.mutate() as HTMLElement

        expect(element.childNodes.length).toBe(3)
        expect(element.textContent).toBe('foobazbar')
    })

    it('should be prepared for the child to return an array', function () {
        function Comp() {
            return [jsx('div', '3', { children: ['baz'] }), jsx('div', '3', { children: ['bar'] })]
        }
        const mutator = jsx('div', '1', { children: [jsx('div', '2', { children: ['foo'] }), jsx(Comp, '1')] })
        const element = mutator.mutate() as HTMLElement

        expect(element.childNodes.length).toBe(3)
        expect(element.textContent).toBe('foobazbar')
    })

    it('should svg children have rich namespace', function () {
        const mutator = jsx('svg', '', { children: jsx('circle', '') })
        const element = mutator.mutate() as SVGElement

        expect(element.children[0].namespaceURI).toBe(SVG_NAMESPACE)
    })
})
