import { generateScopedName } from './utils'

interface WebpackLoaderContext {
    resourcePath: string
}

export const getCssLoaderOptions = () => {
    return {
        modules: {
            getLocalIdent(context: WebpackLoaderContext, _: string, localName: string) {
                return generateScopedName(localName, context.resourcePath)
            },
        },
    }
}
