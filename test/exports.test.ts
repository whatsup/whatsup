import { Atom } from '../src/atom'
import { fractal, Fractal } from '../src/fractal'
import { fraction, Fraction } from '../src/fraction'
import { list, List } from '../src/list'
import { factor } from '../src/factor'
import { tmp } from '../src/temporary'
import { Mutator } from '../src/mutator'
import { Event } from '../src/event'
import { stream, live } from '../src/runners'
import {
    Atom as _Atom,
    fractal as _fractal,
    Fractal as _Fractal,
    fraction as _fraction,
    Fraction as _Fraction,
    list as _list,
    List as _List,
    factor as _factor,
    tmp as _tmp,
    Mutator as _Mutator,
    Event as _Event,
    stream as _stream,
    live as _live,
} from '../src/index'

it('Exports', () => {
    expect(Atom).toBe(_Atom)
    expect(fractal).toBe(_fractal)
    expect(Fractal).toBe(_Fractal)
    expect(fraction).toBe(_fraction)
    expect(Fraction).toBe(_Fraction)
    expect(list).toBe(_list)
    expect(List).toBe(_List)
    expect(factor).toBe(_factor)
    expect(tmp).toBe(_tmp)
    expect(Mutator).toBe(_Mutator)
    expect(Event).toBe(_Event)
    expect(stream).toBe(_stream)
    expect(live).toBe(_live)
})
