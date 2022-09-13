import { HTMLElementVNode, SVGElementVNode, GnComponentVNode, FnComponentVNode, Props } from './vnode'
import { IS_SVG_REGEX } from './constants'
import { WhatsJSX } from './types'
import { isGenerator } from './utils'

type Type = WhatsJSX.TagName | WhatsJSX.ComponentProducer

export const html = <P extends Props>(
    type: WhatsJSX.TagName,
    key: string,
    props?: P,
    ref?: WhatsJSX.Ref,
    onMount?: (el: Node | Node[]) => void,
    onUnmount?: (el: Node | Node[]) => void
) => {
    return new HTMLElementVNode(type, key, props, ref, onMount, onUnmount)
}

export const svg = <P extends Props>(
    type: WhatsJSX.TagName,
    key: string,
    props?: P,
    ref?: WhatsJSX.Ref,
    onMount?: (el: Node | Node[]) => void,
    onUnmount?: (el: Node | Node[]) => void
) => {
    return new SVGElementVNode(type, key, props, ref, onMount, onUnmount)
}

export const component = <P extends Props>(
    type: WhatsJSX.ComponentProducer,
    key: string,
    props?: P,
    ref?: WhatsJSX.Ref,
    onMount?: (el: Node | Node[]) => void,
    onUnmount?: (el: Node | Node[]) => void
) => {
    if (isGenerator(type)) {
        return new GnComponentVNode(type as WhatsJSX.GnComponentProducer, key, props, ref, onMount, onUnmount)
    }
    return new FnComponentVNode(type, key, props, ref, onMount, onUnmount)
}

export const jsx = <P extends Props>(
    type: Type,
    key: string,
    props?: P,
    ref?: WhatsJSX.Ref,
    onMount?: (el: Node | Node[]) => void,
    onUnmount?: (el: Node | Node[]) => void
) => {
    if (typeof type === 'string') {
        if (IS_SVG_REGEX.test(type)) {
            return svg(type, key, props, ref, onMount, onUnmount)
        }

        return html(type, key, props, ref, onMount, onUnmount)
    }

    return component(type, key, props, ref, onMount, onUnmount)
}
