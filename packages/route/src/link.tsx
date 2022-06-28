import { WhatsJSX, Context } from '@whatsup/jsx'
import { NAVIGATOR } from './keys'

export interface RouteLinkProps extends WhatsJSX.AnchorHTMLAttributes<HTMLAnchorElement> {
    to: string
    children: WhatsJSX.Child
    useReplace?: boolean
}

export function* RouteLink(this: Context, props: RouteLinkProps) {
    const navigator = this.find(NAVIGATOR)

    while (true) {
        const { to, children, useReplace, onClick, ...other } = props
        const pathname = navigator.createPathname(to)
        const handleClick = (e: WhatsJSX.MouseEvent<HTMLAnchorElement>) => {
            if (onClick) {
                onClick(e)
            }
            if (useReplace) {
                navigator.replace(pathname)
            } else {
                navigator.navigate(pathname)
            }
            e.preventDefault()
        }

        props = yield (
            <a href={pathname} onClick={handleClick} {...other}>
                {children}
            </a>
        )
    }
}
