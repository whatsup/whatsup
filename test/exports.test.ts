import { Stream } from '../src/stream'
import { fractal, Fractal } from '../src/fractal'
import { fraction, Fraction } from '../src/fraction'
import { computed, Computed } from '../src/computed'
import { observable, Observable } from '../src/observable'
import { list, List } from '../src/list'
import { watch, Watcher } from '../src/watcher'
import { factor } from '../src/factor'
import { transaction } from '../src/scheduler'
import { run } from '../src/run'
import { Mutator } from '../src/mutator'
import { Event } from '../src/event'

import {
    Stream as _Stream,
    fractal as _fractal,
    Fractal as _Fractal,
    fraction as _fraction,
    Fraction as _Fraction,
    list as _list,
    List as _List,
    watch as _watch,
    Watcher as _Watcher,
    factor as _factor,
    transaction as _transaction,
    action as _action,
    run as _run,
    Mutator as _Mutator,
    Event as _Event,
    computed as _computed,
    Computed as _Computed,
    observable as _observable,
    Observable as _Observable,
} from '../src/index'

it('Exports', () => {
    expect(Stream).toBe(_Stream)
    expect(fractal).toBe(_fractal)
    expect(Fractal).toBe(_Fractal)
    expect(fraction).toBe(_fraction)
    expect(Fraction).toBe(_Fraction)
    expect(list).toBe(_list)
    expect(List).toBe(_List)
    expect(watch).toBe(_watch)
    expect(Watcher).toBe(_Watcher)
    expect(factor).toBe(_factor)
    expect(transaction).toBe(_transaction)
    expect(transaction).toBe(_action)
    expect(run).toBe(_run)
    expect(Mutator).toBe(_Mutator)
    expect(Event).toBe(_Event)
    expect(computed).toBe(_computed)
    expect(Computed).toBe(_Computed)
    expect(observable).toBe(_observable)
    expect(Observable).toBe(_Observable)
})
