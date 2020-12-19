export const JSX_LIBRARY_NAME = '@whatsup-js/jsx'

export const FRAGMENT_COMPONENT_NAME = 'Fragment'

export const JSX_LIBRARY_FACTORIES = {
    HTML: 'html',
    SVG: 'svg',
    Component: 'component',
}

export const SVG_TAG_REGEX = /^(?:sv|an|c(?:ir|l)|de[fs]|el|f(?:e|il|ore)|g$|ima|line|m(?:a(?:rke|sk)|etad|p)|p(?:at[ht]|oly[gl])|r[ae]|s(?:to|[wy])|t(?:ext(?:$|P)|s)|us|vie)/

export const IS_TESTING = (() => {
    try {
        return process.env.PLUGIN_TESTING === 'on'
    } catch (e) {
        return false
    }
})()
