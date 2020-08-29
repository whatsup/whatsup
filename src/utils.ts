const AsyncGeneratorFunctionCtor = Object.getPrototypeOf(async function* () {}).constructor

export function isAsyncGenerator<T, TR, TN = undefined>(
    arg: any
): arg is (...args: any[]) => AsyncGenerator<T, TR, TN> {
    return arg instanceof AsyncGeneratorFunctionCtor
}

export function equal(one: any, two: any) {
    if (one === two) {
        return true
    }
    if (!one || !two) {
        return false
    }
    if (one instanceof Date && two instanceof Date && one.getTime() === two.getTime()) {
        return true
    }
    if (one instanceof RegExp && two instanceof RegExp && one.toString() === two.toString()) {
        return true
    }
    if (Array.isArray(one) && Array.isArray(two)) {
        if (one.length !== two.length) {
            return false
        }
        for (let i = 0; i < one.length; i++) {
            if (one[i] !== two[i]) {
                return false
            }
        }
        return true
    }

    const oneProto = Object.getPrototypeOf(one)
    const twoProto = Object.getPrototypeOf(two)

    if (oneProto === twoProto && (oneProto === null || oneProto.constructor === Object)) {
        const oneKeys = Object.keys(one)
        const twoKeys = Object.keys(two)

        if (oneKeys.length !== twoKeys.length) {
            return false
        }

        for (const key of oneKeys) {
            if (one[key] !== two[key] || !Object.prototype.hasOwnProperty.call(two, key)) {
                return false
            }
        }

        return true
    }

    return false
}
