import { html } from '@whatsup/jsx'
import { HTMLTag } from './tags'

type Styles = { [k: string]: string }

export const createComponent = (tag: HTMLTag, styles: Styles) => {
    const uid = generateUid()

    return (rawProps: JSX.IntrinsicAttributes & { [k in keyof Styles]: boolean }) => {
        const props = {} as { [k: string]: any }
        const style = {} as { [k: string]: any }
        const classNames = []
        const children =
            rawProps.children !== undefined
                ? Array.isArray(rawProps.children)
                    ? rawProps.children
                    : [rawProps.children]
                : undefined

        for (const [key, val] of Object.entries(rawProps)) {
            if (key === 'children') {
                continue
            }

            if (key.startsWith('__')) {
                const property = '--' + key.slice(2)

                style[property] = val

                continue
            }

            if (key === 'style') {
                if (typeof val === 'object') {
                    Object.assign(style, val)
                }
                continue
            }

            if (key === 'className') {
                if (!!val) {
                    classNames.push(val)
                }
                continue
            }

            if (key in styles) {
                if (val) {
                    classNames.push(styles[key])
                }
                continue
            }

            props[key as string] = val
        }

        if (!!Object.keys(style).length) {
            props.style = style
        }

        if (!!classNames.length) {
            props.className = classNames.join(' ')
        }

        return html(tag, uid, undefined, undefined, props, children)
    }
}

function generateUid() {
    return (~~(Math.random() * 1e8)).toString(16)
}
