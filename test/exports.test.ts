import { Stream } from '../src/stream'
import { component, Component } from '../src/component'
import { computed, Computed } from '../src/computed'
import { observable, Observable } from '../src/observable'
import { list, List } from '../src/list'
import { whatsUp } from '../src/whatsup'
import { factor, Factor } from '../src/factor'
import { mutator, Mutator } from '../src/mutator'
import { action } from '../src/scheduler'
import { Event } from '../src/event'

import {
    Stream as _Stream,
    component as _component,
    Component as _Component,
    list as _list,
    List as _List,
    whatsUp as _whatsUp,
    factor as _factor,
    Factor as _Factor,
    action as _action,
    mutator as _mutator,
    Mutator as _Mutator,
    Event as _Event,
    computed as _computed,
    Computed as _Computed,
    observable as _observable,
    Observable as _Observable,
} from '../src/index'

it('Exports', () => {
    expect(Stream).toBe(_Stream)
    expect(component).toBe(_component)
    expect(Component).toBe(_Component)
    expect(list).toBe(_list)
    expect(List).toBe(_List)
    expect(whatsUp).toBe(_whatsUp)
    expect(factor).toBe(_factor)
    expect(Factor).toBe(_Factor)
    expect(action).toBe(_action)
    expect(mutator).toBe(_mutator)
    expect(Mutator).toBe(_Mutator)
    expect(Event).toBe(_Event)
    expect(computed).toBe(_computed)
    expect(Computed).toBe(_Computed)
    expect(observable).toBe(_observable)
    expect(Observable).toBe(_Observable)
})
