import { Stream } from '../src/stream'
import { fractal, Fractal } from '../src/fractal'
import { fraction, Fraction } from '../src/fraction'
import { sing, Singularity } from '../src/singularity'
import { hole, Hole } from '../src/hole'
import { list, List } from '../src/list'
import { watch, Watcher } from '../src/watcher'
import { factor } from '../src/factor'
import { transaction } from '../src/scheduler'
import { run } from '../src/run'
import { Mutator } from '../src/mutator'
import { Event } from '../src/event'
import { transaction as action } from '../src/scheduler'
import { sing as computed, Singularity as Computed } from '../src/singularity'
import { hole as observable, Hole as Observable } from '../src/hole'
import { watch as observe, Watcher as Observer } from '../src/watcher'

import {
    Stream as _Stream,
    fractal as _fractal,
    Fractal as _Fractal,
    fraction as _fraction,
    Fraction as _Fraction,
    sing as _sing,
    Singularity as _Singularity,
    hole as _hole,
    Hole as _Hole,
    list as _list,
    List as _List,
    watch as _watch,
    Watcher as _Watcher,
    factor as _factor,
    transaction as _transaction,
    run as _run,
    Mutator as _Mutator,
    Event as _Event,
    action as _action,
    computed as _computed,
    Computed as _Computed,
    observable as _observable,
    Observable as _Observable,
    observe as _observe,
    Observer as _Observer,
} from '../src/index'

it('Exports', () => {
    expect(Stream).toBe(_Stream)
    expect(fractal).toBe(_fractal)
    expect(Fractal).toBe(_Fractal)
    expect(fraction).toBe(_fraction)
    expect(Fraction).toBe(_Fraction)
    expect(sing).toBe(_sing)
    expect(Singularity).toBe(_Singularity)
    expect(hole).toBe(_hole)
    expect(Hole).toBe(_Hole)
    expect(list).toBe(_list)
    expect(List).toBe(_List)
    expect(watch).toBe(_watch)
    expect(Watcher).toBe(_Watcher)
    expect(factor).toBe(_factor)
    expect(transaction).toBe(_transaction)
    expect(run).toBe(_run)
    expect(Mutator).toBe(_Mutator)
    expect(Event).toBe(_Event)
    expect(action).toBe(_action)
    expect(computed).toBe(_computed)
    expect(Computed).toBe(_Computed)
    expect(observable).toBe(_observable)
    expect(Observable).toBe(_Observable)
    expect(observe).toBe(_observe)
    expect(Observer).toBe(_Observer)
})
