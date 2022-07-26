import { jsx, WhatsJSX } from '@whatsup/jsx'

type ClassnamesMap = { [k: string]: string }

type Props<P, S extends ClassnamesMap> = P & {
    [k in `css:${keyof S & string}`]?: boolean
} & {
    [k: `css:$${string}`]: string | number
}

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
            if (key.startsWith('css:$')) {
                const property = '--' + key.slice(5)

                newStyle[property] = val

                continue
            }

            if (key.startsWith('css:')) {
                const classname = key.slice(4)

                if (classname in styles) {
                    if (val) {
                        classnames.push(styles[classname])
                    }

                    continue
                }

                console.warn(`Unknown classname "${classname}"`)
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
