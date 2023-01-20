import { createAtom, CacheState } from '../src/atom'
import { computed, isComputed } from '../src/computed'
import { observable, isObservable } from '../src/observable'
import { reaction, autorun } from '../src/reactions'
import { action, runInAction } from '../src/action'
import { delegate } from '../src/delegation'
import { comparer, filter } from '../src/mutator'
import { array } from '../src/array'
import { set } from '../src/set'
import { map } from '../src/map'

import {
    createAtom as _createAtom,
    CacheState as _CacheState,
    computed as _computed,
    isComputed as _isComputed,
    observable as _observable,
    isObservable as _isObservable,
    reaction as _reaction,
    autorun as _autorun,
    action as _action,
    runInAction as _runInAction,
    delegate as _delegate,
    comparer as _comparer,
    filter as _filter,
    array as _array,
    set as _set,
    map as _map,
} from '../src/index'

it('Exports', () => {
    expect(createAtom).toBe(_createAtom)
    expect(CacheState).toBe(_CacheState)
    expect(computed).toBe(_computed)
    expect(isComputed).toBe(_isComputed)
    expect(observable).toBe(_observable)
    expect(isObservable).toBe(_isObservable)
    expect(reaction).toBe(_reaction)
    expect(autorun).toBe(_autorun)
    expect(action).toBe(_action)
    expect(runInAction).toBe(_runInAction)
    expect(delegate).toBe(_delegate)
    expect(comparer).toBe(_comparer)
    expect(filter).toBe(_filter)
    expect(array).toBe(_array)
    expect(set).toBe(_set)
    expect(map).toBe(_map)
})
