import { isAsyncGenerator, equal } from '../src/utils'

describe('Utils', () => {
    it('isAsyncGenerator', () => {
        expect(isAsyncGenerator(async function* () {})).toBeTruthy()
        expect(isAsyncGenerator(function () {})).toBeFalsy()
        expect(isAsyncGenerator(void 0)).toBeFalsy()
        expect(isAsyncGenerator(null)).toBeFalsy()
        expect(isAsyncGenerator('primitive')).toBeFalsy()
        expect(isAsyncGenerator({})).toBeFalsy()
    })

    describe('equal', () => {
        it('expected 1 equal 1', () => {
            expect(equal(1, 1)).toBeTruthy()
        })
        it('expected "abc" equal "abc"', () => {
            expect(equal('abc', 'abc')).toBeTruthy()
        })
        it('expected null equal null', () => {
            expect(equal(null, null)).toBeTruthy()
        })
        it('expected undefined equal undefined', () => {
            expect(equal(undefined, undefined)).toBeTruthy()
        })
        it('expected /[a-z]/ equal /[a-z]/', () => {
            expect(equal(/[a-z]/, /[a-z]/)).toBeTruthy()
        })
        it('expected new Date(523324800000) equal new Date(523324800000)', () => {
            expect(equal(new Date(523324800000), new Date(523324800000))).toBeTruthy()
        })
        it('expected [1,2,3, {}] equal [1,2,3, {}]', () => {
            const o = {}
            expect(equal([1, 2, 3, o], [1, 2, 3, o])).toBeTruthy()
        })
        it('expected {a: "a", b: "b", o: {}} equal {a: "a", b: "b", o: {}}', () => {
            const o = {}
            expect(equal({ a: 'a', b: 'b', o }, { a: 'a', b: 'b', o })).toBeTruthy()
        })
        it('expected null not equal undefined', () => {
            expect(equal(null, undefined)).toBeFalsy()
        })
        it('expected 2 not equal 1', () => {
            expect(equal(2, 1)).toBeFalsy()
        })
        it('expected "asd" not equal "abc"', () => {
            expect(equal('asd', 'abc')).toBeFalsy()
        })
        it('expected /[a-z]/ not equal /[A-z]/', () => {
            expect(equal(/[a-z]/, /[A-z]/)).toBeFalsy()
        })
        it('expected new Date(523324800000) not equal new Date(503539200000)', () => {
            expect(equal(new Date(523324800000), new Date(503539200000))).toBeFalsy()
        })
        it('expected [1,2,3] not equal [1,2,3,4]', () => {
            expect(equal([1, 2, 3], [1, 2, 3, 4])).toBeFalsy()
        })
        it('expected [1,2,3,new {}] not equal [1,2,3,new {}]', () => {
            expect(equal([1, 2, 3, {}], [1, 2, 3, {}])).toBeFalsy()
        })
        it('expected {a: "a", b: "b"} not equal {a: "a", b: "b", c: "c"}', () => {
            expect(equal({ a: 'a', b: 'b' }, { a: 'a', b: 'b', c: 'c' })).toBeFalsy()
        })
        it('expected {a: "a", b: "b", o: new {}} not equal {a: "a", b: "b", o: new {}}', () => {
            expect(equal({ a: 'a', b: 'b', o: {} }, { a: 'a', b: 'b', o: {} })).toBeFalsy()
        })
        it('expected Set not equal Set', () => {
            expect(equal(new Set(), new Set())).toBeFalsy()
        })
        it('expected Map not equal Map', () => {
            expect(equal(new Map(), new Map())).toBeFalsy()
        })
        it('expected Func not equal Func', () => {
            expect(
                equal(
                    () => {},
                    () => {}
                )
            ).toBeFalsy()
        })
    })
})
