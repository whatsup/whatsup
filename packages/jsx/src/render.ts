import { autorun } from 'whatsup'
import { createComponent } from './component'
import { placeNodes } from './dom'
import { WhatsJSX } from './types'

export const render = (child: WhatsJSX.Child, container: HTMLElement | SVGElement = document.body) => {
    const root = createComponent(function Root() {
        return child
    })

    return autorun(() => {
        try {
            const nodes = root.getNodes()
            placeNodes(container, nodes)
        } catch (e) {
            console.error(e)
        }
    })
}
