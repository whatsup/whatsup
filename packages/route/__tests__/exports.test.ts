import { NAVIGATION, Route, RouteLink } from '../src/index'
import { NAVIGATION as _NAVIGATION } from '../src/keys'
import { Route as _Route } from '../src/route'
import { RouteLink as _RouteLink } from '../src/link'

it('exports', () => {
    expect(NAVIGATION).toBe(_NAVIGATION)
    expect(Route).toBe(_Route)
    expect(RouteLink).toBe(_RouteLink)
})
