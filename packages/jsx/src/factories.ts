import { EMPTY_ARR, EMPTY_OBJ } from './constants'
import { ComponentMutator, HTMLElementMutator, SVGElementMutator } from './mutator'
import { FractalJSX } from './types'

export function html(
    type: FractalJSX.TagName,
    uid: FractalJSX.Uid,
    key: FractalJSX.Key,
    props = EMPTY_OBJ as FractalJSX.ElementProps,
    children = EMPTY_ARR as FractalJSX.Child[]
) {
    return new HTMLElementMutator(type, uid, key, props, children)
}

export function svg(
    type: FractalJSX.TagName,
    uid: FractalJSX.Uid,
    key: FractalJSX.Key,
    props = EMPTY_OBJ as FractalJSX.ElementProps,
    children = EMPTY_ARR as FractalJSX.Child[]
) {
    return new SVGElementMutator(type, uid, key, props, children)
}

export function component(
    type: FractalJSX.Component,
    uid: FractalJSX.Uid,
    key: FractalJSX.Key,
    props = EMPTY_OBJ as FractalJSX.ComponentProps,
    children = EMPTY_ARR as FractalJSX.Child[]
) {
    return new ComponentMutator(type, uid, key, props, children)
}
