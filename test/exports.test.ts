import { Stream } from '../src/stream'
import { fractal, Fractal } from '../src/fractal'
import { cause, Cause } from '../src/cause'
import { conse, Conse } from '../src/conse'
import { list, List } from '../src/list'
import { whatsUp } from '../src/whatsUp'
import { factor, Factor } from '../src/factor'
import { mutator, Mutator } from '../src/mutator'
import { action } from '../src/scheduler'
import { Event } from '../src/event'

import {
    Stream as _Stream,
    fractal as _fractal,
    Fractal as _Fractal,
    list as _list,
    List as _List,
    whatsUp as _whatsUp,
    factor as _factor,
    Factor as _Factor,
    action as _action,
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
    expect(list).toBe(_list)
    expect(List).toBe(_List)
    expect(whatsUp).toBe(_whatsUp)
    expect(factor).toBe(_factor)
    expect(Factor).toBe(_Factor)
    expect(action).toBe(_action)
    expect(mutator).toBe(_mutator)
    expect(Mutator).toBe(_Mutator)
    expect(Event).toBe(_Event)
    expect(cause).toBe(_cause)
    expect(Cause).toBe(_Cause)
    expect(conse).toBe(_conse)
    expect(Conse).toBe(_Conse)
})
