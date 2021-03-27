/**
 * @jest-environment jsdom
 */

import { Cause, Context, fractal, conse, whatsUp } from 'whatsup'
import { redirect } from '@whatsup/browser-pathname'
import { route, PATHNAME, DEFAULT_ROUTE_VALUE } from '../src/route'

describe('Overrides', () => {
    describe('Override pathname', () => {
        const mock = jest.fn()
        const pathname = conse('/')
        const app = fractal(function* (ctx: Context) {
            ctx.share(PATHNAME, pathname)

            while (true) {
                yield yield* appRoute
            }
        })
        const appRoute = route(
            /\/app([0-9]+)\/user([A-Za-z]+)/,
            function* (_, appId: Cause<string>, userName: Cause<string>) {
                while (true) {
                    yield `App:${yield* appId}|User:${yield* userName}`
                }
            }
        )

        whatsUp(app, mock)

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
            ctx.share(DEFAULT_ROUTE_VALUE, ':default:')

            while (true) {
                yield yield* appRoute
            }
        })
        const appRoute = route(
            /\/app([0-9]+)\/user([A-Za-z]+)/,
            function* (_, appId: Cause<string>, userName: Cause<string>) {
                while (true) {
                    yield `App:${yield* appId}|User:${yield* userName}`
                }
            }
        )

        whatsUp(app, mock)

        it('should mock called with ":default:"', () => {
            expect(mock).lastCalledWith(':default:')
        })

        it('should mock called with "App:9|User:Jessy"', () => {
            redirect('/app9/userJessy')
            expect(mock).lastCalledWith('App:9|User:Jessy')
        })
    })
})
