import { EMPTY_ARR, EMPTY_OBJ } from './constants'
import { ComponentMutator, HTMLElementMutator, SVGElementMutator } from './mutator'
import { WhatsJSX } from './types'

export const html = (
    type: WhatsJSX.TagName,
    uid: WhatsJSX.Uid,
    key: WhatsJSX.Key | undefined,
    ref: WhatsJSX.Ref | undefined,
    props = EMPTY_OBJ as WhatsJSX.ElementProps,
    children = EMPTY_ARR as WhatsJSX.Child[]
) => {
    return new HTMLElementMutator(type, uid, key, ref, props, children)
}

export const svg = (
    type: WhatsJSX.TagName,
    uid: WhatsJSX.Uid,
    key: WhatsJSX.Key | undefined,
    ref: WhatsJSX.Ref | undefined,
    props = EMPTY_OBJ as WhatsJSX.ElementProps,
    children = EMPTY_ARR as WhatsJSX.Child[]
) => {
    return new SVGElementMutator(type, uid, key, ref, props, children)
}

export const component = <P extends WhatsJSX.ComponentProps>(
    type: WhatsJSX.ComponentProducer<P>,
    uid: WhatsJSX.Uid,
    key: WhatsJSX.Key | undefined,
    ref: WhatsJSX.Ref | undefined,
    props: P = EMPTY_OBJ as P,
    children: WhatsJSX.Child[] = EMPTY_ARR as WhatsJSX.Child[]
) => {
    return new ComponentMutator(type as WhatsJSX.ComponentProducer, uid, key, ref, props, children)
}
