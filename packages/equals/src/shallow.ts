import { comparer } from '@whatsup/core'
import { equal } from './equal'

export const shallow = comparer<any>((next, prev) => {
    return equal(next, prev, 1)
})
