import { isGenerator } from '../src/utils'

describe('utils', function () {
    it('should return true', function () {
        function* Component() {}

        expect(isGenerator(Component)).toBeTruthy()
    })

    it('should return false', function () {
        function Component() {}

        expect(isGenerator(Component)).toBeFalsy()
    })
})
