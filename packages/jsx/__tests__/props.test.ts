/**
 * @jest-environment jsdom
 */
import { jsx } from '../src/mutator'

describe('props', function () {
    it('should ignore children prop', function () {
        const mutatorOne = jsx('div', '', { children: 'child' })
        const element = mutatorOne.mutate() as HTMLElement

        expect(element.children).toBeInstanceOf(HTMLCollection)
    })

    it('should mutate simple writable prop', function () {
        const mutatorOne = jsx('div', '', { className: 'one' })
        const mutatorTwo = jsx('div', '', { className: 'two' })
        const element = mutatorOne.mutate() as HTMLElement

        expect(element.className).toBe('one')

        mutatorTwo.mutate(element as any)

        expect(element.className).toBe('two')
    })

    it('should reset prop to default value', function () {
        const mutatorOne = jsx('div', '', { className: 'one' })
        const mutatorTwo = jsx('div', '', {})
        const element = mutatorOne.mutate() as HTMLElement

        expect(element.className).toBe('one')

        mutatorTwo.mutate(element as any)

        expect(element.className).toBe('')
    })

    it('should mutate only changed props', function () {
        const mutatorOne = jsx('div', '', { className: 'one', id: 'ID' })
        const mutatorTwo = jsx('div', '', { className: 'two', id: 'ID' })
        const element = mutatorOne.mutate() as HTMLElement

        expect(element.className).toBe('one')
        expect(element.id).toBe('ID')

        mutatorTwo.mutate(element as any)

        expect(element.className).toBe('two')
        expect(element.id).toBe('ID')
    })

    it('should mutate stype properties', function () {
        const mutatorOne = jsx('div', '', { style: { backgroundColor: 'red' } })
        const mutatorTwo = jsx('div', '', { style: { backgroundColor: 'yellow' } })
        const element = mutatorOne.mutate() as HTMLElement

        expect(element.style.backgroundColor).toBe('red')

        mutatorTwo.mutate(element as any)

        expect(element.style.backgroundColor).toBe('yellow')
    })

    it('should reset style prop to default', function () {
        const mutatorOne = jsx('div', '', { style: { backgroundColor: 'red' } })
        const mutatorTwo = jsx('div', '', { style: {} })

        const element = mutatorOne.mutate() as HTMLElement

        expect(element.style.backgroundColor).toBe('red')

        mutatorTwo.mutate(element as any)

        expect(element.style.backgroundColor).toBe('')
    })

    it('should reset all style props to default when style prop not exists', function () {
        const mutatorOne = jsx('div', '', { style: { backgroundColor: 'red', color: 'white' } })
        const mutatorTwo = jsx('div', '', {})

        const element = mutatorOne.mutate() as HTMLElement

        expect(element.style.backgroundColor).toBe('red')
        expect(element.style.color).toBe('white')

        mutatorTwo.mutate(element as any)

        expect(element.style.backgroundColor).toBe('')
        expect(element.style.color).toBe('')
    })

    it('should mutate only changed style props', function () {
        const mutatorOne = jsx('div', '', { style: { backgroundColor: 'red', fontSize: 16 } })
        const mutatorTwo = jsx('div', '', { style: { fontSize: 16, color: 'black' } })

        const element = mutatorOne.mutate() as HTMLElement

        expect(element.style.backgroundColor).toBe('red')
        expect(element.style.fontSize).toBe('16px')

        mutatorTwo.mutate(element as any)

        expect(element.style.backgroundColor).toBe('')
        expect(element.style.fontSize).toBe('16px')
        expect(element.style.color).toBe('black')
    })

    it('should copy stype when style prop is CSSDeclaration', function () {
        const declaration = (jsx('div', '', { style: { backgroundColor: 'red' } }).mutate() as HTMLElement).style
        const mutator = jsx('div', '', { style: declaration })
        const element = mutator.mutate() as HTMLElement

        expect(element.style.backgroundColor).toBe('red')
    })

    it('should add "px" suffix to dimensional style prop', function () {
        const mutator = jsx('div', '', { style: { top: 10 } })
        const element = mutator.mutate() as HTMLElement

        expect(element.style.top).toBe('10px')
    })

    it('should mutate readonly prop through attribute api', function () {
        const mutator = jsx('a', '', { href: 'https://github.com/' })
        const element = mutator.mutate() as HTMLAnchorElement

        expect(element.getAttribute('href')).toBe('https://github.com/')
    })

    it('should reset readonly prop through attribute api', function () {
        const mutatorOne = jsx('a', '', { href: 'https://github.com/' })
        const mutatorTwo = jsx('a', '', {})

        const element = mutatorOne.mutate() as HTMLElement

        expect(element.getAttribute('href')).toBe('https://github.com/')

        mutatorTwo.mutate(element as any)

        expect(element.getAttribute('href')).toBe(null)
    })

    it('should mutate svg prop through attribute api', function () {
        const mutator = jsx('svg', '', { children: jsx('circle', '', { cx: '50' }) })
        const element = mutator.mutate() as SVGElement

        expect(element.children[0].getAttribute('cx')).toBe('50')
    })

    it('should set event listener', function () {
        let clicked = false
        const listener = () => (clicked = true)
        const mutator = jsx('div', '', { onClick: listener })
        const element = mutator.mutate() as HTMLElement

        expect(clicked).toBeFalsy()

        element.dispatchEvent(new MouseEvent('click'))

        expect(clicked).toBeTruthy()
    })

    it('should reset event listener', function () {
        let clicked = 0
        const listenerOne = () => clicked++
        const mutatorOne = jsx('div', '', { onClick: listenerOne })
        const mutatorTwo = jsx('div', '', {})

        const element = mutatorOne.mutate() as HTMLElement

        expect(clicked).toBe(0)

        element.dispatchEvent(new MouseEvent('click'))

        expect(clicked).toBe(1)

        mutatorTwo.mutate(element as any)

        element.dispatchEvent(new MouseEvent('click'))

        expect(clicked).toBe(1)
    })

    it('should set captured event listener', function () {
        let phase: number
        const listener = (e: MouseEvent) => (phase = e.eventPhase)
        const mutator = jsx('div', '', { onClickCapture: listener, children: [jsx('div', '', {})] })
        const element = mutator.mutate() as HTMLElement

        element.firstChild!.dispatchEvent(new MouseEvent('click'))

        expect(phase!).toBe(1)
    })

    it('should normalize svg className prop', function () {
        const mutator = jsx('svg', '', { className: 'test' })
        const element = mutator.mutate() as SVGElement

        expect(element.className.baseVal).toBe('test')
    })
})
