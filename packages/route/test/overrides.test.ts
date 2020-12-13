/**
 * @jest-environment jsdom
 */

import { redirect } from '@fract/browser-pathname'
import { Computed, Context, fractal, observable, watch } from '@fract/core'
import { route, PATHNAME, DEFAULT_ROUTE_VALUE } from '../src/route'

describe('Overrides', () => {
    describe('Override pathname', () => {
        const mock = jest.fn()
        const pathname = observable('/')
        const app = fractal(function* (ctx: Context) {
            ctx.set(PATHNAME, pathname)
            return appRoute
        })
        const appRoute = route(
            /\/app([0-9]+)\/user([A-Za-z]+)/,
            function* (_, appId: Computed<string>, userName: Computed<string>) {
                while (true) {
                    yield `App:${yield* appId}|User:${yield* userName}`
                }
            }
        )

        watch(app, mock)

        it('should mock called with null ', () => {
            expect(mock).lastCalledWith(null)
        })

        it('should mock called with "App:99|User:John"', () => {
            pathname.set('/app99/userJohn')
            expect(mock).lastCalledWith('App:99|User:John')
        })
    })

    describe('Override default value', () => {
        const mock = jest.fn()
        const app = fractal(function* (ctx: Context) {
            ctx.set(DEFAULT_ROUTE_VALUE, ':default:')
            return appRoute
        })
        const appRoute = route(
            /\/app([0-9]+)\/user([A-Za-z]+)/,
            function* (_, appId: Computed<string>, userName: Computed<string>) {
                while (true) {
                    yield `App:${yield* appId}|User:${yield* userName}`
                }
            }
        )

        watch(app, mock)

        it('should mock called with ":default:"', () => {
            expect(mock).lastCalledWith(':default:')
        })

        it('should mock called with "App:9|User:Jessy"', () => {
            redirect('/app9/userJessy')
            expect(mock).lastCalledWith('App:9|User:Jessy')
        })
    })
})
