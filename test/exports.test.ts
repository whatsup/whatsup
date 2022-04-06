import { Stream } from '../src/stream'
import { computed, Computed } from '../src/computed'
import { observable, Observable } from '../src/observable'
import { list, List } from '../src/list'
import { whatsUp } from '../src/whatsup'
import { mutator, Mutator } from '../src/mutator'
import { action } from '../src/scheduler'

import {
    Stream as _Stream,
    list as _list,
    List as _List,
    whatsUp as _whatsUp,
    action as _action,
    mutator as _mutator,
    Mutator as _Mutator,
    computed as _computed,
    Computed as _Computed,
    observable as _observable,
    Observable as _Observable,
} from '../src/index'

it('Exports', () => {
    expect(Stream).toBe(_Stream)
    expect(list).toBe(_list)
    expect(List).toBe(_List)
    expect(whatsUp).toBe(_whatsUp)
    expect(action).toBe(_action)
    expect(mutator).toBe(_mutator)
    expect(Mutator).toBe(_Mutator)
    expect(computed).toBe(_computed)
    expect(Computed).toBe(_Computed)
    expect(observable).toBe(_observable)
    expect(Observable).toBe(_Observable)
})
