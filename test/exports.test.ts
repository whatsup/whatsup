import { Stream } from '../src/stream'
import { fractal, Fractal } from '../src/fractal'
import { fraction, Fraction } from '../src/fraction'
import { cause, Cause } from '../src/cause'
import { conse, Conse } from '../src/conse'
import { list, List } from '../src/list'
import { whatsUp, Observer } from '../src/observer'
import { factor, Factor } from '../src/factor'
import { mutator, Mutator } from '../src/mutator'
import { transaction } from '../src/scheduler'
import { run } from '../src/run'
import { Event } from '../src/event'

import {
    Stream as _Stream,
    fractal as _fractal,
    Fractal as _Fractal,
    fraction as _fraction,
    Fraction as _Fraction,
    list as _list,
    List as _List,
    whatsUp as _whatsUp,
    Observer as _Observer,
    factor as _factor,
    Factor as _Factor,
    transaction as _transaction,
    action as _action,
    run as _run,
    mutator as _mutator,
    Mutator as _Mutator,
    Event as _Event,
    cause as _cause,
    Cause as _Cause,
    conse as _conse,
    Conse as _Conse,
} from '../src/index'

it('Exports', () => {
    expect(Stream).toBe(_Stream)
    expect(fractal).toBe(_fractal)
    expect(Fractal).toBe(_Fractal)
    expect(fraction).toBe(_fraction)
    expect(Fraction).toBe(_Fraction)
    expect(list).toBe(_list)
    expect(List).toBe(_List)
    expect(whatsUp).toBe(_whatsUp)
    expect(Observer).toBe(_Observer)
    expect(factor).toBe(_factor)
    expect(Factor).toBe(_Factor)
    expect(transaction).toBe(_transaction)
    expect(transaction).toBe(_action)
    expect(run).toBe(_run)
    expect(mutator).toBe(_mutator)
    expect(Mutator).toBe(_Mutator)
    expect(Event).toBe(_Event)
    expect(cause).toBe(_cause)
    expect(Cause).toBe(_Cause)
    expect(conse).toBe(_conse)
    expect(Conse).toBe(_Conse)
})
