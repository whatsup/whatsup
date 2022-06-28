import { Context, WhatsJSX } from '@whatsup/jsx'
import { NAVIGATOR } from './keys'
import { NestedNavigator } from './navigator'

export interface RouteProps {
    component: WhatsJSX.ComponentProducer<any>
    path?: string | RegExp
    sensitive?: boolean
    index?: boolean
}

export function* Route(this: Context, props: RouteProps) {
    const { path, index, sensitive, component: Component } = props
    const regexp = compileRegexp(path, sensitive, index)
    const parentNavigator = this.find(NAVIGATOR)
    const navigator = new NestedNavigator(parentNavigator, regexp)

    this.share(NAVIGATOR, navigator)

    while (true) {
        yield navigator.isMatched ? <Component {...navigator.matchedParams} /> : null
    }
}

const compileRegexp = (path?: string | RegExp, sensitive?: boolean, index?: boolean) => {
    if (path instanceof RegExp) {
        return path
    }
    if (index) {
        return /^\/?$/
    }
    if (typeof path === 'string') {
        const source =
            '^' +
            path
                .replace(/[\\.?*+^$|(){}[\]]/g, '\\$&')
                .replace(/:([a-zA-Z0-9_]+)/g, (_, key: string) => `(?<${key}>[^\/]+)`)

        const flags = sensitive ? undefined : 'i'

        return new RegExp(source, flags)
    }

    throw Error('Cannot compile path, you need define one parameter of path or index')
}
