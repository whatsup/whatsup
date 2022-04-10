import { createAtom } from '../src/atom'
import { computed, Computed } from '../src/computed'
import { observable, Observable } from '../src/observable'
import { reaction, autorun } from '../src/reactions'
import { transaction, action } from '../src/scheduler'
import { delegate } from '../src/delegation'
import { mutator } from '../src/mutator'
import { array } from '../src/array'
import { set } from '../src/set'
import { map } from '../src/map'

import {
    createAtom as _createAtom,
    computed as _computed,
    Computed as _Computed,
    observable as _observable,
    Observable as _Observable,
    reaction as _reaction,
    autorun as _autorun,
    action as _action,
    transaction as _transaction,
    delegate as _delegate,
    mutator as _mutator,
    array as _array,
    set as _set,
    map as _map,
} from '../src/index'

it('Exports', () => {
    expect(createAtom).toBe(_createAtom)
    expect(computed).toBe(_computed)
    expect(Computed).toBe(_Computed)
    expect(observable).toBe(_observable)
    expect(Observable).toBe(_Observable)
    expect(reaction).toBe(_reaction)
    expect(autorun).toBe(_autorun)
    expect(action).toBe(_action)
    expect(transaction).toBe(_transaction)
    expect(delegate).toBe(_delegate)
    expect(mutator).toBe(_mutator)
    expect(array).toBe(_array)
    expect(set).toBe(_set)
    expect(map).toBe(_map)
})
