/**
 * @jest-environment jsdom
 */

import { observable } from '@whatsup/core'
import { render } from '../src/render'

describe('Error catching', function () {
    it('should catch error', function () {
        function Err() {
            throw 'i_am_error'
        }

        function* App() {
            while (true) {
                try {
                    yield <Err />
                } catch (e) {
                    yield <div>{e}</div>
                }
            }
        }

        const container = document.createElement('div')

        render(<App />, container)

        expect(container.innerHTML).toBe('<div>i_am_error</div>')
    })

    it('should catch deep error', function () {
        function Err() {
            throw 'i_am_error'
        }

        function Deep() {
            return <Err />
        }

        function* App() {
            while (true) {
                try {
                    yield <Deep />
                } catch (e) {
                    yield <div>{e}</div>
                }
            }
        }

        const container = document.createElement('div')

        render(<App />, container)

        expect(container.innerHTML).toBe('<div>i_am_error</div>')
    })

    it('should catch deep error from generator', function () {
        function Err() {
            throw 'i_am_error'
        }

        function* Deep() {
            while (true) {
                yield <Err />
            }
        }

        function* App() {
            while (true) {
                try {
                    yield <Deep />
                } catch (e) {
                    yield <div>{e}</div>
                }
            }
        }

        const container = document.createElement('div')

        render(<App />, container)

        expect(container.innerHTML).toBe('<div>i_am_error</div>')
    })

    it('should catch child error', function () {
        function Err() {
            throw 'i_am_error'
        }

        function* Catcher(props) {
            while (true) {
                try {
                    yield <div>{props.children}</div>
                } catch (e) {
                    yield <div>{e}</div>
                }
            }
        }

        function App() {
            return (
                <Catcher>
                    <Err />
                </Catcher>
            )
        }

        const container = document.createElement('div')

        render(<App />, container)

        expect(container.innerHTML).toBe('<div>i_am_error</div>')
    })

    it('should error must be reactive', function () {
        const trigger = observable(true)

        function Err() {
            if (trigger()) {
                throw 'i_am_error'
            } else {
                return <div>all_ok</div>
            }
        }

        function* App() {
            while (true) {
                try {
                    yield <Err />
                } catch (e) {
                    yield <div>{e}</div>
                }
            }
        }

        const container = document.createElement('div')

        render(<App />, container)

        expect(container.innerHTML).toBe('<div>i_am_error</div>')

        trigger(false)

        expect(container.innerHTML).toBe('<div>all_ok</div>')
    })

    it('should deep error must be reactive', function () {
        const trigger = observable(true)

        function Err() {
            if (trigger()) {
                throw 'i_am_error'
            } else {
                return <div>all_ok</div>
            }
        }

        function Deep() {
            return <Err />
        }

        function* App() {
            while (true) {
                try {
                    yield <Deep />
                } catch (e) {
                    yield <div>{e}</div>
                }
            }
        }

        const container = document.createElement('div')

        render(<App />, container)

        expect(container.innerHTML).toBe('<div>i_am_error</div>')

        trigger(false)

        expect(container.innerHTML).toBe('<div>all_ok</div>')
    })

    it('should deep error from generator must be reactive', function () {
        const trigger = observable(true)

        function Err() {
            if (trigger()) {
                throw 'i_am_error'
            } else {
                return <div>all_ok</div>
            }
        }

        function* Deep() {
            while (true) {
                yield <Err />
            }
        }

        function* App() {
            while (true) {
                try {
                    yield <Deep />
                } catch (e) {
                    yield <div>{e}</div>
                }
            }
        }

        const container = document.createElement('div')

        render(<App />, container)

        expect(container.innerHTML).toBe('<div>i_am_error</div>')

        trigger(false)

        expect(container.innerHTML).toBe('<div>all_ok</div>')
    })
})
