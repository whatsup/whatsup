import { EMPTY_ARR, EMPTY_OBJ } from './constants'
import { ComponentMutator, HTMLElementMutator, SVGElementMutator } from './mutator'
import { WhatsJSX } from './types'

export function html(
    type: WhatsJSX.TagName,
    uid: WhatsJSX.Uid,
    key: WhatsJSX.Key | undefined,
    ref: WhatsJSX.Ref | undefined,
    props = EMPTY_OBJ as WhatsJSX.ElementProps,
    children = EMPTY_ARR as WhatsJSX.Child[]
) {
    return new HTMLElementMutator(type, uid, key, ref, props, children)
}

export function svg(
    type: WhatsJSX.TagName,
    uid: WhatsJSX.Uid,
    key: WhatsJSX.Key | undefined,
    ref: WhatsJSX.Ref | undefined,
    props = EMPTY_OBJ as WhatsJSX.ElementProps,
    children = EMPTY_ARR as WhatsJSX.Child[]
) {
    return new SVGElementMutator(type, uid, key, ref, props, children)
}

export function component<P extends WhatsJSX.ComponentProps>(
    type: WhatsJSX.Component<P>,
    uid: WhatsJSX.Uid,
    key: WhatsJSX.Key | undefined,
    ref: WhatsJSX.Ref | undefined,
    props: P = EMPTY_OBJ as P,
    children: WhatsJSX.Child[] = EMPTY_ARR as WhatsJSX.Child[]
) {
    return new ComponentMutator(type as WhatsJSX.Component, uid, key, ref, props, children)
}
