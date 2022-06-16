import { autorun } from 'whatsup'
import { createComponent } from './component'
import { placeElements } from './dom'
import { WhatsJSX } from './types'

export const render = (child: WhatsJSX.Child, container: HTMLElement | SVGElement = document.body) => {
    const root = createComponent(function Root() {
        return child
    })

    return autorun(() => {
        try {
            const elements = root.getElements()
            placeElements(container, elements)
        } catch (e) {
            console.error(e)
        }
    })
}
