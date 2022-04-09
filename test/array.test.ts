import { array } from '../src/array'
import { autorun } from '../src/reactions'

describe('List', () => {
    describe('Mutations', () => {
        let result: number[]

        const arr = array<number>()

        autorun(() => (result = arr.slice()))

        it(`should return 1, 2, 3, 4`, () => {
            arr.push(1, 2, 3, 4)
            expect(result).toEqual([1, 2, 3, 4])
        })

        it(`should return 1, 2, 3`, () => {
            arr.pop()
            expect(result).toEqual([1, 2, 3])
        })

        it(`should return 2, 3`, () => {
            arr.shift()
            expect(result).toEqual([2, 3])
        })

        it(`should return 1, 2, 3`, () => {
            arr.unshift(1)
            expect(result).toEqual([1, 2, 3])
        })

        it(`should return 3, 2, 1`, () => {
            arr.reverse()
            expect(result).toEqual([3, 2, 1])
        })

        it(`should return 1, 2, 3`, () => {
            arr.sort((a, b) => a - b)
            expect(result).toEqual([1, 2, 3])
        })

        it(`should return 1, 2, 3, 4, 5`, () => {
            arr.splice(3, 0, 4, 5)
            expect(result).toEqual([1, 2, 3, 4, 5])
        })

        it(`should return 1, 2, 5`, () => {
            arr.splice(2, 2)
            expect(result).toEqual([1, 2, 5])
        })

        it(`should return 1`, () => {
            arr.splice(1)
            expect(result).toEqual([1])
        })
    })

    describe('Getters', () => {
        it('length', () => {
            const arr = array([1])

            let result = 0

            autorun(() => {
                result = arr.length
            })

            expect(result).toBe(1)

            arr.push(2)

            expect(result).toBe(2)
        })

        it('key', () => {
            const arr = array([1])

            let result = 0

            autorun(() => {
                result = arr[0]
            })

            expect(result).toBe(1)

            arr.unshift(2)

            expect(result).toBe(2)
        })
    })

    describe('Iterations', () => {
        it('flat', () => {
            const arr = array([[1], [2]])

            let result = [] as number[]

            autorun(() => {
                result = arr.flat()
            })

            expect(result).toEqual([1, 2])

            arr.push([3])

            expect(result).toEqual([1, 2, 3])
        })

        it('flat deep', () => {
            const arr = array([[1], [2, [3]]])

            let result = [] as number[]

            autorun(() => {
                result = arr.flat(3)
            })

            expect(result).toEqual([1, 2, 3])

            arr.push([[4]])

            expect(result).toEqual([1, 2, 3, 4])
        })

        it('flatMap', () => {
            const arr = array([[1], 2, [3]])

            let result = [] as number[]

            autorun(() => {
                result = arr.flatMap((i) => i)
            })

            expect(result).toEqual([1, 2, 3])

            arr.push(4)

            expect(result).toEqual([1, 2, 3, 4])
        })

        it('includes', () => {
            const arr = array([1])

            let result = false

            autorun(() => {
                result = arr.includes(2)
            })

            expect(result).toBeFalsy()

            arr.push(2)

            expect(result).toBeTruthy()
        })

        it('concat', () => {
            const arr = array([1])

            let result = [] as number[]

            autorun(() => {
                result = arr.concat(2, 3)
            })

            expect(result).toEqual([1, 2, 3])

            arr.push(4)

            expect(result).toEqual([1, 4, 2, 3])
        })

        it('join', () => {
            const arr = array([1, 2])

            let result = ''

            autorun(() => {
                result = arr.join()
            })

            expect(result).toBe('1,2')

            arr.push(3)

            expect(result).toBe('1,2,3')
        })

        it('join with separator', () => {
            const arr = array([1, 2])

            let result = ''

            autorun(() => {
                result = arr.join('|')
            })

            expect(result).toBe('1|2')

            arr.push(3)

            expect(result).toBe('1|2|3')
        })

        it('slice', () => {
            const arr = array([1, 2, 3, 4])

            let result = [] as number[]

            autorun(() => {
                result = arr.slice(2)
            })

            expect(result).toEqual([3, 4])

            arr.push(5)

            expect(result).toEqual([3, 4, 5])
        })

        it('every', () => {
            const arr = array([2, 4])

            let result = false

            autorun(() => {
                result = arr.every((i) => i % 2 === 0)
            })

            expect(result).toBeTruthy()

            arr.push(6)

            expect(result).toBeTruthy()

            arr.push(7)

            expect(result).toBeFalsy()
        })

        it('some', () => {
            const arr = array([1, 2])

            let result = false

            autorun(() => {
                result = arr.some((i) => i % 2 === 0)
            })

            expect(result).toBeTruthy()

            arr.push(3)

            expect(result).toBeTruthy()

            arr.splice(1, 1)

            expect(result).toBeFalsy()
        })

        it('forEach', () => {
            const arr = array([1, 2, 3])

            let result = [] as number[]

            autorun(() => {
                const acc = [] as number[]

                arr.forEach((item) => acc.push(item))

                result = acc
            })

            expect(result).toEqual([1, 2, 3])

            arr.push(4)

            expect(result).toEqual([1, 2, 3, 4])
        })

        it('map', () => {
            const arr = array([1, 2, 3])

            let result = [] as number[]

            autorun(() => {
                result = arr.map((i) => i + 1)
            })

            expect(result).toEqual([2, 3, 4])

            arr.push(4)

            expect(result).toEqual([2, 3, 4, 5])
        })

        it('filter', () => {
            const arr = array([1, 2, 3])

            let result = [] as number[]

            autorun(() => {
                result = arr.filter((i) => i % 2 === 0)
            })

            expect(result).toEqual([2])

            arr.push(4)

            expect(result).toEqual([2, 4])
        })

        it('reduce', () => {
            const arr = array([1, 2, 3])

            let result = ''

            autorun(() => {
                result = arr.reduce((acc, item) => acc + item, '')
            })

            expect(result).toBe('123')

            arr.push(4)

            expect(result).toBe('1234')
        })

        it('reduceRight', () => {
            const arr = array([1, 2, 3])

            let result = ''

            autorun(() => {
                result = arr.reduceRight((acc, item) => acc + item, '')
            })

            expect(result).toBe('321')

            arr.push(4)

            expect(result).toBe('4321')
        })

        it('indexOf', () => {
            const arr = array([1, 2, 3])

            let result = 0

            autorun(() => {
                result = arr.indexOf(2)
            })

            expect(result).toBe(1)

            arr.unshift(0)

            expect(result).toBe(2)
        })

        it('lastIndexOf', () => {
            const arr = array([1, 2, 2, 3])

            let result = 0

            autorun(() => {
                result = arr.lastIndexOf(2)
            })

            expect(result).toBe(2)

            arr.unshift(0)

            expect(result).toBe(3)
        })

        it('toString', () => {
            const arr = array([1, 2, 3])

            let result = ''

            autorun(() => {
                result = arr.toString()
            })

            expect(result).toBe('1,2,3')

            arr.push(4)

            expect(result).toBe('1,2,3,4')
        })

        it('toLocaleString', () => {
            const arr = array([1, 2, 3])

            let result = ''

            autorun(() => {
                result = arr.toLocaleString()
            })

            expect(result).toBe('1,2,3')

            arr.push(4)

            expect(result).toBe('1,2,3,4')
        })

        it('iterate through Symbol.iterator', () => {
            const arr = array([1, 2, 3])

            let result = [] as number[]

            autorun(() => {
                const acc = []

                for (const item of arr) {
                    acc.push(item)
                }

                result = acc
            })

            expect(result).toEqual([1, 2, 3])

            arr.push(4)

            expect(result).toEqual([1, 2, 3, 4])
        })

        it('iterate through values', () => {
            const arr = array([1, 2, 3])

            let result = [] as number[]

            autorun(() => {
                const acc = []

                for (const item of arr.values()) {
                    acc.push(item)
                }

                result = acc
            })

            expect(result).toEqual([1, 2, 3])

            arr.push(4)

            expect(result).toEqual([1, 2, 3, 4])
        })

        it('iterate through keys', () => {
            const arr = array([1, 2, 3])

            let result = [] as number[]

            autorun(() => {
                const acc = []

                for (let i = 0; i < arr.length; i++) {
                    acc.push(arr[i])
                }

                result = acc
            })

            expect(result).toEqual([1, 2, 3])

            arr.push(4)

            expect(result).toEqual([1, 2, 3, 4])
        })
    })

    it('arr instanceof Array to be true', () => {
        const arr = array([1, 2, 3])

        expect(arr instanceof Array).toBeTruthy()
    })

    it('Array.isArray(arr) to be true', () => {
        const arr = array([1, 2, 3])

        expect(Array.isArray(arr)).toBeTruthy()
    })
})
