/**
 * @jest-environment jsdom
 */
import { observable } from '@whatsup/core'
import { render } from '../src/render'

describe('props', function () {
    it('should ignore children prop', function () {
        const container = document.createElement('div')
        const trigger = observable<any>('one')

        function Test() {
            return <div className={trigger()}>child</div>
        }

        render(<Test />, container)

        const element = container.children[0] as HTMLElement

        expect(element.children).toBeInstanceOf(HTMLCollection)
    })

    it('should mutate simple writable prop', function () {
        const container = document.createElement('div')
        const trigger = observable<any>('one')

        function Test() {
            return <div className={trigger()} />
        }

        render(<Test />, container)

        const element = container.children[0] as HTMLElement

        expect(element.className).toBe('one')

        trigger('two')

        expect(element.className).toBe('two')
    })

    it('should reset prop to default value', function () {
        const container = document.createElement('div')
        const trigger = observable<any>({ className: 'one' })

        function Test() {
            return <div {...trigger()} />
        }

        render(<Test />, container)

        const element = container.children[0] as HTMLElement

        expect(element.className).toBe('one')

        trigger({})

        expect(element.className).toBe('')
    })

    it('should mutate only changed props', function () {
        const container = document.createElement('div')
        const trigger = observable<any>('one')

        function Test() {
            return <div id="ID" className={trigger()} />
        }

        render(<Test />, container)

        const element = container.children[0] as HTMLElement

        expect(element.className).toBe('one')
        expect(element.id).toBe('ID')

        trigger('two')

        expect(element.className).toBe('two')
        expect(element.id).toBe('ID')
    })

    it('should mutate stype properties', function () {
        const container = document.createElement('div')
        const trigger = observable<any>({ backgroundColor: 'red' })

        function Test() {
            return <div style={trigger()} />
        }

        render(<Test />, container)

        const element = container.children[0] as HTMLElement

        expect(element.style.backgroundColor).toBe('red')

        trigger({ backgroundColor: 'yellow' })

        expect(element.style.backgroundColor).toBe('yellow')
    })

    it('should reset style prop to default', function () {
        const container = document.createElement('div')
        const trigger = observable<any>({ backgroundColor: 'red' })

        function Test() {
            return <div style={trigger()} />
        }

        render(<Test />, container)

        const element = container.children[0] as HTMLElement

        expect(element.style.backgroundColor).toBe('red')

        trigger({})

        expect(element.style.backgroundColor).toBe('')
    })

    it('should reset all style props to default when style prop not exists', function () {
        const container = document.createElement('div')
        const trigger = observable<any>({ style: { backgroundColor: 'red', color: 'white' } })

        function Test() {
            return <div {...trigger()} />
        }

        render(<Test />, container)

        const element = container.children[0] as HTMLElement

        expect(element.style.backgroundColor).toBe('red')
        expect(element.style.color).toBe('white')

        trigger({})

        expect(element.style.backgroundColor).toBe('')
        expect(element.style.color).toBe('')
    })

    it('should mutate only changed style props', function () {
        const container = document.createElement('div')
        const trigger = observable<any>({ backgroundColor: 'red', fontSize: 16 })

        function Test() {
            return <div style={trigger()} />
        }

        render(<Test />, container)

        const div = container.children[0] as HTMLElement

        expect(div.style.backgroundColor).toBe('red')
        expect(div.style.fontSize).toBe('16px')

        trigger({ fontSize: 16, color: 'black' })

        expect(div.style.backgroundColor).toBe('')
        expect(div.style.fontSize).toBe('16px')
        expect(div.style.color).toBe('black')
    })

    it('should add "px" suffix to dimensional style prop', function () {
        const container = document.createElement('div')

        function Test() {
            return <div style={{ top: 10 }} />
        }

        render(<Test />, container)

        expect((container.children[0] as HTMLElement).style.top).toBe('10px')
    })

    it('should set readonly prop through attribute api', function () {
        const container = document.createElement('div')

        function Test() {
            return <a href="https://github.com/" />
        }

        render(<Test />, container)

        expect(container.children[0].getAttribute('href')).toBe('https://github.com/')
    })

    it('should reset readonly prop through attribute api', function () {
        const container = document.createElement('div')
        const trigger = observable<any>('https://github.com/')

        function Test() {
            return <a href={trigger()} />
        }

        render(<Test />, container)

        expect(container.children[0].getAttribute('href')).toBe('https://github.com/')

        trigger(undefined)

        expect(container.children[0].getAttribute('href')).toBe(null)
    })

    it('should set svg prop through attribute api', function () {
        const container = document.createElement('div')

        function Test() {
            return (
                <svg className="test">
                    <circle cx="50" />
                </svg>
            )
        }

        render(<Test />, container)

        expect((container.children[0].children[0] as SVGElement).getAttribute('cx')).toBe('50')
    })

    it('should set event listener', function () {
        const mock = jest.fn()
        const container = document.createElement('div')

        function Test() {
            return <div onClick={mock} />
        }

        render(<Test />, container)

        expect(mock).toBeCalledTimes(0)

        container.children[0].dispatchEvent(new MouseEvent('click'))

        expect(mock).toBeCalledTimes(1)
    })

    it('should reset event listener', function () {
        const mock = jest.fn()
        const container = document.createElement('div')
        const trigger = observable<any>(mock)

        function Test() {
            return <div onClick={trigger()} />
        }

        render(<Test />, container)

        expect(mock).toBeCalledTimes(0)

        container.children[0].dispatchEvent(new MouseEvent('click'))

        expect(mock).toBeCalledTimes(1)

        trigger(undefined)

        container.children[0].dispatchEvent(new MouseEvent('click'))

        expect(mock).toBeCalledTimes(1)
    })

    it('should set captured event listener', function () {
        let phase: number

        const listener = (e: MouseEvent) => (phase = e.eventPhase)
        const container = document.createElement('div')

        function Test() {
            return (
                <div onClickCapture={listener as any}>
                    <div />
                </div>
            )
        }

        render(<Test />, container)

        container.children[0].children[0].dispatchEvent(new MouseEvent('click'))

        expect(phase!).toBe(1)
    })

    it('should normalize svg className prop', function () {
        const container = document.createElement('div')

        function Test() {
            return <svg className="test" />
        }

        render(<Test />, container)

        expect((container.children[0] as SVGElement).className.baseVal).toBe('test')
    })

    it('should mutate attribute without rerender component', function () {
        const container = document.createElement('div')
        const mock = jest.fn()
        const className = observable('one')

        function Test() {
            mock()
            return <div className={className} />
        }

        render(<Test />, container)

        expect(container.innerHTML).toBe('<div class="one"></div>')
        expect(mock).toBeCalledTimes(1)

        className('two')

        expect(container.innerHTML).toBe('<div class="two"></div>')
        expect(mock).toBeCalledTimes(1)
    })

    it('should mutate style without rerender component', function () {
        const container = document.createElement('div')
        const mock = jest.fn()
        const backgroundColor = observable('red')

        function Test() {
            mock()
            return <div style={{ backgroundColor }} />
        }

        render(<Test />, container)

        expect(container.innerHTML).toBe('<div style="background-color: red;"></div>')
        expect(mock).toBeCalledTimes(1)

        backgroundColor('green')

        expect(container.innerHTML).toBe('<div style="background-color: green;"></div>')
        expect(mock).toBeCalledTimes(1)
    })
})
