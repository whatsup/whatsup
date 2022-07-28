import { shallow, deep } from '../src/index'
import { shallow as _shallow } from '../src/shallow'
import { deep as _deep } from '../src/deep'

it('Exports', () => {
    expect(shallow).toBe(_shallow)
    expect(deep).toBe(_deep)
})
