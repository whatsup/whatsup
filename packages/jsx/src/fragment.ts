import { Props } from './vnode'

export function Fragment(props: Props) {
    return props.children ?? null
}
