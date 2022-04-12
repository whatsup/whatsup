import { html, svg, component } from '../src/factories'

describe('factories', function () {
    it('html factory should instantiate HTMLElementMutator without errors', function () {
        html('div', '', '', undefined)
    })

    it('svg factory should instantiate SVGElementMutator without errors', function () {
        svg('svg', '', '', undefined)
    })

    it('component factory should instantiate AtomComponentMutator without errors', function () {
        function* Component() {
            return 'Hello'
        }
        component(Component, '', '', undefined)
    })

    it('component factory should instantiate GnComponentMutator without errors', function () {
        function* Component(_: {}) {
            return 'Hello'
        }
        component(Component, '', '', undefined)
    })

    it('component factory should instantiate FnComponentMutator without errors', function () {
        function Component(_: {}) {
            return 'Hello'
        }
        component(Component, '', '', undefined)
    })
})
