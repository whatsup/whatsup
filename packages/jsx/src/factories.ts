import { EMPTY_ARR, EMPTY_OBJ } from './constants'
import { ComponentMutator, HTMLElementMutator, SVGElementMutator } from './mutator'
import { Child, Component, ComponentProps, ElementProps, Key, TagName, Uid } from './types'

export function html(
    type: TagName,
    uid: Uid,
    key: Key,
    props = EMPTY_OBJ as ElementProps,
    children = EMPTY_ARR as Child[]
) {
    return new HTMLElementMutator(type, uid, key, props, children)
}

export function svg(
    type: TagName,
    uid: Uid,
    key: Key,
    props = EMPTY_OBJ as ElementProps,
    children = EMPTY_ARR as Child[]
) {
    return new SVGElementMutator(type, uid, key, props, children)
}

export function component(
    type: Component,
    uid: Uid,
    key: Key,
    props = EMPTY_OBJ as ComponentProps,
    children = EMPTY_ARR as Child[]
) {
    return new ComponentMutator(type, uid, key, props, children)
}
