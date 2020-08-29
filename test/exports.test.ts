import { fractal, fraction, factor, isFractal, isFraction, live, exec, tmp } from '../src/index'
import { fractal as _fractal, isFractal as _isFractal } from '../src/fractal'
import { fraction as _fraction, isFraction as _isFraction } from '../src/fraction'
import { factor as _factor } from '../src/factor'
import { live as _live, exec as _exec } from '../src/runners'
import { tmp as _tmp } from '../src/helpers'

it('Exports', () => {
    expect(fractal).toBe(_fractal)
    expect(fraction).toBe(_fraction)
    expect(factor).toBe(_factor)
    expect(isFractal).toBe(_isFractal)
    expect(isFraction).toBe(_isFraction)
    expect(live).toBe(_live)
    expect(exec).toBe(_exec)
    expect(tmp).toBe(_tmp)
})
