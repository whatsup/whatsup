import { run, Stream } from '@fract/core'
import { reconcile, placeElements, removeUnreconciledElements } from './mutator'
import { ReconcileMap } from './reconcile_map'
import { FractalJSX } from './types'

type Source = FractalJSX.Child | Stream<Source>

function* extract(source: Stream<Source>): Generator<any, FractalJSX.Child, any> {
    const result = yield* source
    return result instanceof Stream ? yield* extract(result) : result
}

export function render(source: Stream<FractalJSX.Child>, container: HTMLElement | SVGElement = document.body) {
    return run(function* () {
        try {
            let oldReconcileMap = new ReconcileMap()

            while (true) {
                const result = yield* extract(source)
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
}
