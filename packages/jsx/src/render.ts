import { autorun } from '@whatsup/core'
import { placeNodes } from './dom'
import { Reconciler } from './reconciler'
import { WhatsJSX } from './types'

export const render = (child: WhatsJSX.Child, container: HTMLElement | SVGElement = document.body) => {
    const reconciler = new Reconciler()

    return autorun(() => {
        try {
            const nodes = reconciler.reconcile(child)

            placeNodes(container, nodes)
        } catch (e) {
            console.error(e)
        }
    })
}
