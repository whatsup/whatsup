/**
 * @jest-environment jsdom
 */
import { html, svg } from '../src/factories'

describe('props', function () {
    it('should ignore children prop', function () {
        const mutatorOne = html('div', '', '', undefined, { children: 'child' })
        const element = mutatorOne.mutate()

        expect(element.children).toBeInstanceOf(HTMLCollection)
    })

    it('should mutate simple writable prop', function () {
        const mutatorOne = html('div', '', '', undefined, { className: 'one' })
        const mutatorTwo = html('div', '', '', undefined, { className: 'two' })
        const element = mutatorOne.mutate()

        expect(element.className).toBe('one')

        mutatorTwo.mutate(element)

        expect(element.className).toBe('two')
    })

    it('should reset prop to default value', function () {
        const mutatorOne = html('div', '', '', undefined, { className: 'one' })
        const mutatorTwo = html('div', '', '', undefined, {})
        const element = mutatorOne.mutate()

        expect(element.className).toBe('one')

        mutatorTwo.mutate(element)

        expect(element.className).toBe('')
    })

    it('should mutate only changed props', function () {
        const mutatorOne = html('div', '', '', undefined, { className: 'one', id: 'ID' })
        const mutatorTwo = html('div', '', '', undefined, { className: 'two', id: 'ID' })
        const element = mutatorOne.mutate()

        expect(element.className).toBe('one')
        expect(element.id).toBe('ID')

        mutatorTwo.mutate(element)

        expect(element.className).toBe('two')
        expect(element.id).toBe('ID')
    })

    it('should mutate stype properties', function () {
        const mutatorOne = html('div', '', '', undefined, { style: { backgroundColor: 'red' } })
        const mutatorTwo = html('div', '', '', undefined, { style: { backgroundColor: 'yellow' } })
        const element = mutatorOne.mutate()

        expect(element.style.backgroundColor).toBe('red')

        mutatorTwo.mutate(element)

        expect(element.style.backgroundColor).toBe('yellow')
    })

    it('should reset style prop to default', function () {
        const mutatorOne = html('div', '', '', undefined, { style: { backgroundColor: 'red' } })
        const mutatorTwo = html('div', '', '', undefined, { style: {} })

        const element = mutatorOne.mutate()

        expect(element.style.backgroundColor).toBe('red')

        mutatorTwo.mutate(element)

        expect(element.style.backgroundColor).toBe('')
    })

    it('should reset all style props to default when style prop not exists', function () {
        const mutatorOne = html('div', '', '', undefined, { style: { backgroundColor: 'red', color: 'white' } })
        const mutatorTwo = html('div', '', '', undefined, {})

        const element = mutatorOne.mutate()

        expect(element.style.backgroundColor).toBe('red')
        expect(element.style.color).toBe('white')

        mutatorTwo.mutate(element)

        expect(element.style.backgroundColor).toBe('')
        expect(element.style.color).toBe('')
    })

    it('should mutate only changed style props', function () {
        const mutatorOne = html('div', '', '', undefined, { style: { backgroundColor: 'red', fontSize: 16 } })
        const mutatorTwo = html('div', '', '', undefined, { style: { fontSize: 16, color: 'black' } })

        const element = mutatorOne.mutate()

        expect(element.style.backgroundColor).toBe('red')
        expect(element.style.fontSize).toBe('16px')

        mutatorTwo.mutate(element)

        expect(element.style.backgroundColor).toBe('')
        expect(element.style.fontSize).toBe('16px')
        expect(element.style.color).toBe('black')
    })

    it('should copy stype when style prop is CSSDeclaration', function () {
        const declaration = html('div', '', '', undefined, { style: { backgroundColor: 'red' } }).mutate().style
        const mutator = html('div', '', '', undefined, { style: declaration })
        const element = mutator.mutate()

        expect(element.style.backgroundColor).toBe('red')
    })

    it('should add "px" suffix to dimensional style prop', function () {
        const mutator = html('div', '', '', undefined, { style: { top: 10 } })
        const element = mutator.mutate()

        expect(element.style.top).toBe('10px')
    })

    it('should mutate readonly prop through attribute api', function () {
        const mutator = html('a', '', '', undefined, { href: 'https://github.com/' })
        const element = mutator.mutate() as HTMLAnchorElement

        expect(element.getAttribute('href')).toBe('https://github.com/')
    })

    it('should reset readonly prop through attribute api', function () {
        const mutatorOne = html('a', '', '', undefined, { href: 'https://github.com/' })
        const mutatorTwo = html('a', '', '', {})

        const element = mutatorOne.mutate()

        expect(element.getAttribute('href')).toBe('https://github.com/')

        mutatorTwo.mutate(element)

        expect(element.getAttribute('href')).toBe(null)
    })

    it('should mutate svg prop through attribute api', function () {
        const mutator = svg('circle', '', '', undefined, { cx: '50' })
        const element = mutator.mutate() as SVGCircleElement

        expect(element.getAttribute('cx')).toBe('50')
    })

    it('should set event listener', function () {
        let clicked = false
        const listener = () => (clicked = true)
        const mutator = html('div', '', '', undefined, { onClick: listener })
        const element = mutator.mutate()

        expect(clicked).toBeFalsy()

        element.dispatchEvent(new MouseEvent('click'))

        expect(clicked).toBeTruthy()
    })

    it('should reset event listener', function () {
        let clicked = 0
        const listenerOne = () => clicked++
        const mutatorOne = html('div', '', '', undefined, { onClick: listenerOne })
        const mutatorTwo = html('div', '', '', undefined, {})

        const element = mutatorOne.mutate()

        expect(clicked).toBe(0)

        element.dispatchEvent(new MouseEvent('click'))

        expect(clicked).toBe(1)

        mutatorTwo.mutate(element)

        element.dispatchEvent(new MouseEvent('click'))

        expect(clicked).toBe(1)
    })

    it('should set captured event listener', function () {
        let phase: number
        const listener = (e: MouseEvent) => (phase = e.eventPhase)
        const mutator = html('div', '', '', undefined, { onClickCapture: listener }, [html('div', '', '', {})])
        const element = mutator.mutate()

        element.firstChild!.dispatchEvent(new MouseEvent('click'))

        expect(phase!).toBe(1)
    })
})
