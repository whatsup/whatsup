/**
 * @jest-environment jsdom
 */

import { Cause, whatsUp } from 'whatsup'
import { redirect } from '@whatsup-js/browser-pathname'
import { route } from '../src/route'

describe('Test with many nested routes', () => {
    const mock = jest.fn()
    const appRoute = route(/\/app([0-9]+)/, function* (_, param: Cause<string>) {
        while (true) {
            yield `App:${yield* param}|${(yield* oneNestedRoute) || (yield* twoNestedRoute) || ''}`
        }
    })
    const oneNestedRoute = route(/\/one([0-9]+)/, function* (_, param: Cause<string>) {
        while (true) {
            yield `One:${yield* param}`
        }
    })
    const twoNestedRoute = route(/\/two([0-9]+)/, function* (_, param: Cause<string>) {
        while (true) {
            yield `Two:${yield* param}`
        }
    })

    whatsUp(appRoute, mock)

    it('should mock called with null', () => {
        expect(mock).lastCalledWith(null)
    })

    it('should mock called with "App:11"', () => {
        redirect('/app11')
        expect(mock).lastCalledWith('App:11|')
    })

    it('should mock called with "App:11|One:22"', () => {
        redirect('/app11/one22')
        expect(mock).lastCalledWith('App:11|One:22')
        expect(mock).toBeCalledTimes(3)
    })

    it('should mock called with "App:11|Two:33"', () => {
        redirect('/app11/two33')
        expect(mock).lastCalledWith('App:11|Two:33')
        expect(mock).toBeCalledTimes(4)
    })
})
