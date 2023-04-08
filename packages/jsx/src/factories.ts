import { HTMLElementVNode, SVGElementVNode, GnComponentVNode, FnComponentVNode, Props } from './vnode'
import { IS_SVG_REGEX } from './constants'
import { WhatsJSX } from './types'
import { isGenerator } from './utils'

type Type = WhatsJSX.TagName | WhatsJSX.ComponentProducer

export const html = <P extends Props>(type: WhatsJSX.TagName, key: string, props: P) => {
    return new HTMLElementVNode(type, key, props)
}

export const svg = <P extends Props>(type: WhatsJSX.TagName, key: string, props: P) => {
    return new SVGElementVNode(type, key, props)
}

export const component = <P extends Props>(type: WhatsJSX.ComponentProducer, key: string, props: P) => {
    if (isGenerator(type)) {
        return new GnComponentVNode(type as WhatsJSX.GnComponentProducer, key, props)
    }
    return new FnComponentVNode(type, key, props)
}

export const jsx = <P extends Props>(type: Type, key: string, props: P) => {
    if (typeof type === 'string') {
        if (IS_SVG_REGEX.test(type)) {
            return svg(type, key, props)
        }

        return html(type, key, props)
    }

    return component(type, key, props)
}
