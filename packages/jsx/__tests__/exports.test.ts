import { html, svg, component, render, Fragment, createRef, createKey, Event } from '../src/index'
import { html as _html, svg as _svg, component as _component } from '../src/factories'
import { render as _render } from '../src/render'
import { Fragment as _Fragment } from '../src/mutator'
import { createRef as _createRef } from '../src/create_ref'
import { createKey as _createKey } from '../src/context'
import { Event as _Event } from '../src/event'

it('Exports', () => {
    expect(html).toBe(html)
    expect(svg).toBe(_svg)
    expect(component).toBe(_component)
    expect(render).toBe(_render)
    expect(Fragment).toBe(_Fragment)
    expect(createRef).toBe(_createRef)
    expect(createKey).toBe(_createKey)
    expect(Event).toBe(_Event)
})
