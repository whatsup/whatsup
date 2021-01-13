import { whatsUp, cause, Stream } from 'whatsup'
import { reconcile, placeElements, removeUnreconciledElements } from './mutator'
import { ReconcileMap } from './reconcile_map'
import { WhatsJSX } from './types'

export function render(source: Stream<WhatsJSX.Child>, container: HTMLElement | SVGElement = document.body) {
    const root = cause(function* () {
        try {
            let oldReconcileMap = new ReconcileMap()

            while (true) {
                const result = yield* source
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
    })

    return whatsUp(root)
}
