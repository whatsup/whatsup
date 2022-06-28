import { NAVIGATOR, Route, RouteLink } from '../src/index'
import { NAVIGATOR as _NAVIGATOR } from '../src/keys'
import { Route as _Route } from '../src/route'
import { RouteLink as _RouteLink } from '../src/link'

it('exports', () => {
    expect(NAVIGATOR).toBe(_NAVIGATOR)
    expect(Route).toBe(_Route)
    expect(RouteLink).toBe(_RouteLink)
})
