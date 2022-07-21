import { jsx, WhatsJSX } from '@whatsup/jsx'

type ClassnamesMap = { [k: string]: string }

type Props<
    T extends WhatsJSX.TagName | WhatsJSX.ComponentProducer<any>,
    S extends ClassnamesMap
> = (T extends WhatsJSX.ComponentProducer<infer R> ? R : T extends WhatsJSX.TagName ? JSX.IntrinsicElements[T] : {}) & {
    [k in keyof S]?: boolean
} & {
    [k: `__${string}`]: string | number
}

export const cssx = <T extends WhatsJSX.TagName | WhatsJSX.ComponentProducer<any>, S extends ClassnamesMap>(
    tag: T,
    styles: S
) => {
    const uid = generateUid()

    return (rawProps: Props<T, S>) => {
        const props = {} as { [k: string]: any }
        const style = {} as { [k: string]: any }
        const classnames = []

        for (const [key, val] of Object.entries(rawProps)) {
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

            props[key] = val
        }

        if (!!Object.keys(style).length) {
            props.style = style
        }

        if (!!classnames.length) {
            props.className = classnames.join(' ')
        }

        return jsx(tag, uid, props)
    }
}

function generateUid() {
    return Math.random().toString(36).slice(-5)
}
