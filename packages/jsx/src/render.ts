import { Fractal, FractalOptions, Atom } from '@fract/core'
import { reconcile, placeElements, removeUnreconciledElements } from './mutator'
import { ReconcileMap } from './reconcile_map'
import { FractalJSX } from './types'

interface RendererOptions extends FractalOptions {}

class Renderer<T> extends Fractal<T> {
    readonly root: Fractal<FractalJSX.Child>
    readonly container: HTMLElement | SVGElement

    constructor(root: Fractal<FractalJSX.Child>, container: HTMLElement | SVGElement, options?: RendererOptions) {
        super(options)
        this.root = root
        this.container = container
    }

    async *collector() {
        try {
            const { root, container } = this

            let oldReconcileMap = new ReconcileMap()

            while (true) {
                const result = yield* root
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
}

export async function render(root: Fractal<FractalJSX.Child>, container: HTMLElement | SVGElement) {
    const renderer = new Renderer(root, container)
    const atom = new Atom(renderer)

    await atom.activate()
}
