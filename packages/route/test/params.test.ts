/**
 * @jest-environment jsdom
 */

import { Computed, watch } from '@fract/core'
import { redirect } from '@fract/browser-pathname'
import { route } from '../src/route'

describe('Test with params', () => {
    const mock = jest.fn()
    const appRoute = route(
        /\/app([0-9]+)\/user([A-Za-z]+)/,
        function* (_, appId: Computed<string>, userName: Computed<string>) {
            while (true) {
                yield `App:${yield* appId}|User:${yield* userName}`
            }
        }
    )

    watch(appRoute, mock)

    it('should mock called with null ', () => {
        expect(mock).lastCalledWith(null)
    })

    it('should mock called with "App:99|User:John"', () => {
        redirect('/app99/userJohn')
        expect(mock).lastCalledWith('App:99|User:John')
    })

    it('should mock called with "App:10|User:John"', () => {
        redirect('/app10/userJohn')
        expect(mock).toBeCalledTimes(3)
        expect(mock).lastCalledWith('App:10|User:John')
    })

    it('should mock called with "App:11|User:Barry"', () => {
        redirect('/app11/userBarry')
        expect(mock).toBeCalledTimes(4)
        expect(mock).lastCalledWith('App:11|User:Barry')
    })
})
