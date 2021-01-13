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

export function component(
    type: WhatsJSX.Component,
    uid: WhatsJSX.Uid,
    key: WhatsJSX.Key | undefined,
    ref: WhatsJSX.Ref | undefined,
    props = EMPTY_OBJ as WhatsJSX.ComponentProps,
    children = EMPTY_ARR as WhatsJSX.Child[]
) {
    return new ComponentMutator(type, uid, key, ref, props, children)
}
