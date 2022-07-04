export const isGenerator = (target: Function): target is () => Generator => {
    return target.constructor.name === 'GeneratorFunction'
}
