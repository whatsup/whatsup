import { Props } from './mutator'

export function Fragment(props: Props) {
    return props.children ?? null
}
