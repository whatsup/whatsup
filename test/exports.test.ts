import { createAtom } from '../src/atom'
import { computed, Computed } from '../src/computed'
import { observable, Observable } from '../src/observable'
import { reaction, autorun } from '../src/reactions'
import { transaction, action } from '../src/scheduler'
import { delegate } from '../src/delegation'
import { mutator } from '../src/mutator'
import { list, List } from '../src/list'

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
    list as _list,
    List as _List,
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
    expect(list).toBe(_list)
    expect(List).toBe(_List)
})
