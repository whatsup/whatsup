import { comparer } from '@whatsup/core'
import { equal } from './equal'

export const deep = comparer<any>((next, prev) => {
    return equal(next, prev, -1)
})
