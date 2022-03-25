export const isGenerator = (target: Function): target is () => Generator<any> => {
    return target.constructor.name === 'GeneratorFunction'
}
