import { autorun } from '@whatsup/core'
import { Context } from './context'
import { placeNodes } from './dom'
import { Reconciler } from './reconciler'
import { WhatsJSX } from './types'

export const render = (child: WhatsJSX.Child, container: HTMLElement | SVGElement = document.body) => {
    const reconciler = new Reconciler()
    const context = new Context(null, 'Render')

    return autorun(() => {
        try {
            const nodes = reconciler.reconcile(child, context)

            placeNodes(container, nodes)
        } catch (e) {
            console.error(e)
        }
    })
}
