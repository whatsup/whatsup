import { createAtom } from 'whatsup'
import { reconcile, placeElements, removeUnreconciledElements, JsxMutator } from './mutator'
import { ReconcileMap } from './reconcile_map'
import { WhatsJSX } from './types'

export const render = (root: WhatsJSX.Child, container: HTMLElement | SVGElement = document.body) => {
    if (!(root instanceof JsxMutator)) {
        throw new Error('Root element must be Component')
    }

    function* Render() {
        const mutator = root as JsxMutator<any, any>

        try {
            let oldReconcileMap = new ReconcileMap()

            while (true) {
                const result = mutator.doMutation(mutator)
                const children = Array.isArray(result) ? result : [result]
                const elements = [] as (HTMLElement | SVGElement | Text)[]
                const reconcileMap = new ReconcileMap()

                reconcile(reconcileMap, elements, children, oldReconcileMap)
                removeUnreconciledElements(oldReconcileMap)
                placeElements(container, elements)

                oldReconcileMap = reconcileMap

                yield container
            }
        } catch (e) {
            console.error(e)
        }
    }

    const atom = createAtom(Render, undefined)

    atom.rebuild()

    return () => atom.dispose()
}
