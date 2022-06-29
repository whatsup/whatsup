import { WhatsJSX, Context } from '@whatsup/jsx'
import { NAVIGATION } from './keys'

export interface RouteLinkProps extends WhatsJSX.AnchorHTMLAttributes<HTMLAnchorElement> {
    to: string
    children: WhatsJSX.Child
    useReplace?: boolean
}

export function* RouteLink(this: Context, props: RouteLinkProps) {
    const navigation = this.find(NAVIGATION)

    while (true) {
        const { to, children, useReplace, onClick, ...other } = props
        const pathname = navigation.createPathname(to)
        const handleClick = (e: WhatsJSX.MouseEvent<HTMLAnchorElement>) => {
            if (onClick) {
                onClick(e)
            }
            if (useReplace) {
                navigation.replace(pathname)
            } else {
                navigation.navigate(pathname)
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
