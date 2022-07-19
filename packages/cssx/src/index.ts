import { html } from '@whatsup/jsx'

type ClassnamesMap = { [k: string]: string }
type Props<T extends keyof JSX.IntrinsicElements, S extends ClassnamesMap> = JSX.IntrinsicElements[T] & {
    [k in keyof S]?: boolean
} & {
    [k: `__${string}`]: string | number
}

export const createComponent = <T extends keyof JSX.IntrinsicElements, S extends ClassnamesMap>(tag: T, styles: S) => {
    const uid = generateUid()

    return (rawProps: Props<T, S>) => {
        const props = {} as { [k: string]: any }
        const style = {} as { [k: string]: any }
        const classnames = []
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
                    classnames.push(val)
                }
                continue
            }

            if (key in styles) {
                if (val) {
                    classnames.push(styles[key])
                }
                continue
            }

            props[key as string] = val
        }

        if (!!Object.keys(style).length) {
            props.style = style
        }

        if (!!classnames.length) {
            props.className = classnames.join(' ')
        }

        return html(tag as any, uid, undefined, undefined, props, children)
    }
}

function generateUid() {
    return (~~(Math.random() * 1e8)).toString(16)
}
