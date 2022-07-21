import { jsx, WhatsJSX } from '@whatsup/jsx'

type ClassnamesMap = { [k: string]: string }

type Props<P, S extends ClassnamesMap> = P & { [k in keyof S]?: boolean } & { [k: `__${string}`]: string | number }

export const cssx = <T extends WhatsJSX.TagName | WhatsJSX.ComponentProducer<any>, S extends ClassnamesMap>(
    type: T,
    styles: S
) => {
    type P = T extends WhatsJSX.ComponentProducer<infer R>
        ? R
        : T extends WhatsJSX.TagName
        ? JSX.IntrinsicElements[T]
        : never

    const uid = generateUid()

    return (props: Props<P, S>) => {
        const newProps = {} as { [k: string]: any }
        const newStyle = {} as { [k: string]: any }
        const classnames = []

        for (const [key, val] of Object.entries(props)) {
            if (key.startsWith('__')) {
                const property = '--' + key.slice(2)

                newStyle[property] = val

                continue
            }

            if (key === 'style') {
                if (typeof val === 'object') {
                    Object.assign(newStyle, val)
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

            newProps[key] = val
        }

        if (!!Object.keys(newStyle).length) {
            newProps.style = newStyle
        }

        if (!!classnames.length) {
            newProps.className = classnames.join(' ')
        }

        return jsx(type, uid, newProps) as WhatsJSX.Child
    }
}

function generateUid() {
    return Math.random().toString(36).slice(-5)
}
