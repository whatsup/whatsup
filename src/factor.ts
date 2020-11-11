import { Tree } from './fork'

export class Factor<T> {
    private trees = new WeakMap<Tree<any>, T>()

    constructor(readonly defaultValue?: T) {}

    get(tree: Tree<any>) {
        let { context } = tree

        while (context) {
            if (this.trees.has(context)) {
                return this.trees.get(context)
            }
            context = context.context
        }

        return this.defaultValue
    }

    set(tree: Tree<any>, value: T) {
        this.trees.set(tree, value)
    }
}

export function factor<T>(defaultValue?: T) {
    return new Factor(defaultValue)
}
