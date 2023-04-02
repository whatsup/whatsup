import { Atom, DIRTY, ACTUAL, CHECK, Node } from './atom'

const enum NodeType {
    Root,
    Leaf,
}

interface BuildNode {
    type: NodeType
    atom: Atom
    next?: BuildNode
}

let busy = false
let head = null as BuildNode | null
let tail = null as BuildNode | null

const addNode = (type: NodeType, atom: Atom) => {
    const next = undefined
    const node = { type, atom, next } as BuildNode

    if (tail) {
        tail.next = node
    }

    tail = node

    if (!head) {
        head = tail
    }
}

const findRoots = (atom: Atom, state: number) => {
    atom.setCacheState(state)

    if (!atom.targetsHead) {
        addNode(NodeType.Root, atom)
        return
    }

    for (let node: Node | undefined = atom.targetsHead; node; node = node.nextTarget) {
        if (node.target.isCacheState(ACTUAL)) {
            findRoots(node.target, CHECK)
        }
    }
}

const addEntry = (atom: Atom) => {
    if (busy) {
        addNode(NodeType.Leaf, atom)
    } else {
        findRoots(atom, DIRTY)
    }
}

export const build = <T>(cb: (addEntry: (atom: Atom) => void) => T) => {
    const isRoot = !busy

    if (isRoot) {
        busy = true
    }

    const result = cb(addEntry)

    if (isRoot) {
        let node = head as BuildNode | undefined

        for (; node; node = node.next) {
            switch (node.type) {
                case NodeType.Leaf:
                    findRoots(node.atom, DIRTY)
                    continue

                case NodeType.Root:
                    node.atom.rebuild()
                    continue
            }
        }

        busy = false
        head = null
        tail = null
    }

    return result
}

export const isBuildProcess = () => {
    return busy
}
