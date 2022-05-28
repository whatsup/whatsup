import { EMPTY_ARR, EMPTY_OBJ } from './constants'
import {
    AmComponentMutator,
    FnComponentMutator,
    GnComponentMutator,
    HTMLElementMutator,
    SVGElementMutator,
} from './mutator'
import { WhatsJSX } from './types'
import { isGenerator } from './utils'

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
    if (type.length === 0) {
        return new AmComponentMutator(type as WhatsJSX.AmComponent, uid, key, ref, props, children)
    } else if (isGenerator(type)) {
        return new GnComponentMutator(type as WhatsJSX.GnComponent, uid, key, ref, props, children)
    } else {
        return new FnComponentMutator(type as WhatsJSX.FnComponent, uid, key, ref, props, children)
    }
}
