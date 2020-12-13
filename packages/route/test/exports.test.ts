import { route, PATHNAME, DEFAULT_ROUTE_VALUE } from '../src/index'
import { route as _route, PATHNAME as _PATHNAME, DEFAULT_ROUTE_VALUE as _DEFAULT_ROUTE_VALUE } from '../src/route'

it('exports', () => {
    expect(route).toBe(_route)
    expect(PATHNAME).toBe(_PATHNAME)
    expect(DEFAULT_ROUTE_VALUE).toBe(_DEFAULT_ROUTE_VALUE)
})
