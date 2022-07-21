import { jsx, render, Fragment, createRef, createKey, Event } from '../src/index'
import { render as _render } from '../src/render'
import { jsx as _jsx, Fragment as _Fragment } from '../src/mutator'
import { createRef as _createRef } from '../src/create_ref'
import { createKey as _createKey } from '../src/context'
import { Event as _Event } from '../src/event'

it('Exports', () => {
    expect(jsx).toBe(_jsx)
    expect(render).toBe(_render)
    expect(Fragment).toBe(_Fragment)
    expect(createRef).toBe(_createRef)
    expect(createKey).toBe(_createKey)
    expect(Event).toBe(_Event)
})
