/**
 * @jest-environment jsdom
 */
import { html, svg, component } from '../src/factories'
import { ElementMutator } from '../src/mutator'

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
        const mutatorOne = html('div', 'uid1', '', undefined, undefined, [html('div', 'child1', '', undefined)])
        const mutatorTwo = html('div', 'uid1', '', undefined)
        const element = mutatorOne.mutate()

        expect(element.childNodes.length).toBe(1)

        mutatorTwo.mutate(element)

        expect(element.childNodes.length).toBe(0)
    })

    it('should replace elements with different reconcileId', function () {
        const mutatorOne = html('div', 'uid1', '', undefined, undefined, [html('div', 'child1', '', undefined)])
        const mutatorTwo = html('div', 'uid1', '', undefined, undefined, [html('div', 'child2', '', undefined)])
        const element = mutatorOne.mutate()
        const childOne = element.childNodes[0]

        mutatorTwo.mutate(element)

        const childTwo = element.childNodes[0]

        expect(element.childNodes.length).toBe(1)
        expect(childOne).not.toBe(childTwo)
    })

    it('should reverse elements when mutators reversed', function () {
        const mutatorOne = html('div', 'uid1', '', undefined, undefined, [
            html('div', 'child1', '', undefined),
            html('div', 'child2', '', undefined),
        ])
        const mutatorTwo = html('div', 'uid1', '', undefined, undefined, [
            html('div', 'child2', '', undefined),
            html('div', 'child1', '', undefined),
        ])
        const element = mutatorOne.mutate()

        expect(element.childNodes.length).toBe(2)

        const childOne = element.childNodes[0]
        const childTwo = element.childNodes[1]

        mutatorTwo.mutate(element)

        expect(element.childNodes.length).toBe(2)
        expect(element.childNodes[0]).toBe(childTwo)
        expect(element.childNodes[1]).toBe(childOne)
    })

    it('should save rendered elements', function () {
        const htmlRendered = html('div', '', '', undefined).mutate()
        const svgRendered = svg('svg', '', '', undefined).mutate()
        const textRendered = document.createTextNode('')
        const mutatorOne = html('div', 'uid1', '', undefined, undefined, [htmlRendered, svgRendered, textRendered])
        const mutatorTwo = html('div', 'uid1', '', undefined, undefined, [htmlRendered, svgRendered, textRendered])
        const element = mutatorOne.mutate()

        mutatorTwo.mutate(element)

        expect(element.childNodes.length).toBe(3)
        expect(element.childNodes[0]).toBe(htmlRendered)
        expect(element.childNodes[1]).toBe(svgRendered)
        expect(element.childNodes[2]).toBe(textRendered)
    })

    it('should render string | number to TextNode', function () {
        const mutator = html('div', 'uid1', '', undefined, undefined, ['hello', 1612])
        const element = mutator.mutate()

        expect(element.childNodes.length).toBe(2)
        expect(element.childNodes[0]).toBeInstanceOf(Text)
        expect(element.childNodes[1]).toBeInstanceOf(Text)
        expect(element.childNodes[0].nodeValue).toBe('hello')
        expect(element.childNodes[1].nodeValue).toBe('1612')
    })

    it('should reuse TextNode', function () {
        const mutatorOne = html('div', 'uid1', '', undefined, undefined, ['hello', 1612])
        const mutatorTwo = html('div', 'uid1', '', undefined, undefined, ['hello', 'world'])
        const element = mutatorOne.mutate()

        expect(element.childNodes.length).toBe(2)
        expect(element.childNodes[0].nodeValue).toBe('hello')
        expect(element.childNodes[1].nodeValue).toBe('1612')

        const childOne = element.childNodes[0]
        const childTwo = element.childNodes[1]

        mutatorTwo.mutate(element)

        expect(element.childNodes.length).toBe(2)
        expect(element.childNodes[0]).toBe(childOne)
        expect(element.childNodes[1]).toBe(childTwo)
        expect(element.childNodes[0].nodeValue).toBe('hello')
        expect(element.childNodes[1].nodeValue).toBe('world')
    })

    it('should render nested array', function () {
        const mutator = html('div', '1', '', undefined, undefined, [
            html('div', '2', '', undefined, undefined, ['foo']),
            [
                html('div', '3', '1', undefined, undefined, ['baz']),
                html('div', '3', '1', undefined, undefined, ['bar']),
            ],
        ])
        const element = mutator.mutate()

        expect(element.childNodes.length).toBe(3)
        expect(element.textContent).toBe('foobazbar')
    })

    it('should be prepared for the child to return an array', function () {
        function Comp() {
            return [
                html('div', '3', '1', undefined, undefined, ['baz']),
                html('div', '3', '1', undefined, undefined, ['bar']),
            ]
        }
        const mutator = html('div', '1', '', undefined, undefined, [
            html('div', '2', '', undefined, undefined, ['foo']),
            component(Comp, '1', '', undefined),
        ])
        const element = mutator.mutate()

        expect(element.childNodes.length).toBe(3)
        expect(element.textContent).toBe('foobazbar')
    })
})
