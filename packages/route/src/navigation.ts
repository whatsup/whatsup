import { Computed, computed, mutator, observable } from '@whatsup/core'

export abstract class Navigation {
    abstract tail: string
    abstract matchedUrl: string
    abstract matchedParams: Params

    @computed
    get pathname() {
        return this.matchedUrl + this.tail
    }

    navigate(path: string) {
        const pathname = this.createPathname(path)
        window.history.pushState(null, '', pathname)
        dispatchEvent(new PopStateEvent('popstate'))
    }

    replace(path: string) {
        const pathname = this.createPathname(path)
        window.history.replaceState(null, '', pathname)
        dispatchEvent(new PopStateEvent('popstate'))
    }

    createPathname(path: string) {
        if (path.startsWith('./')) {
            return this.matchedUrl + path.slice(1)
        }

        return path
    }
}

export class RootNavigation extends Navigation {
    private readonly browserPathname: Computed<string>

    constructor() {
        super()
        this.browserPathname = computed(function* () {
            const value = observable(window.location.pathname)
            const listener = () => value.set(window.location.pathname)

            window.addEventListener('popstate', listener)

            try {
                while (true) {
                    yield value.get()
                }
            } finally {
                window.removeEventListener('popstate', listener)
            }
        })
    }

    @computed
    get matchedUrl() {
        return ''
    }

    @computed
    get matchedParams() {
        return {}
    }

    @computed
    get tail() {
        return this.browserPathname.get()
    }
}

export class NestedNavigation extends Navigation {
    private readonly parent: Navigation
    private readonly regexp: RegExp

    constructor(parent: Navigation, regexp: RegExp) {
        super()
        this.parent = parent
        this.regexp = regexp
    }

    @computed
    get match() {
        return this.parent.tail.match(this.regexp)
    }

    @computed
    get isMatched() {
        return this.match !== null
    }

    @computed
    get matchedUrl() {
        let result = this.parent.matchedUrl

        if (this.isMatched) {
            result += this.match![0]
        }

        return result
    }

    @computed
    get matchedParams() {
        const acc = {} as Params

        if (this.isMatched) {
            const { groups } = this.match!

            if (groups) {
                for (const [key, value] of Object.entries(groups)) {
                    const asNum = parseInt(value)

                    acc[key] = asNum.toString() === value ? asNum : value
                }
            }
        }

        return shallowParamsEquality(acc) as unknown as Params
    }

    @computed
    get tail() {
        if (this.isMatched) {
            if (this.match!.index === 0) {
                return this.parent.tail.slice(this.match![0].length)
            }
        }

        return this.parent.tail
    }

    navigate(path: string) {
        const pathname = this.createPathname(path)
        this.parent.navigate(pathname)
    }

    replace(path: string) {
        const pathname = this.createPathname(path)
        this.parent.replace(pathname)
    }
}

interface Params {
    [k: string]: number | string
}

const shallowParamsEquality = (next: Params) =>
    mutator((prev?: Params) => {
        if (!prev) {
            return next
        }

        const prevKeys = Object.keys(prev)
        const nextKeys = Object.keys(next)

        if (prevKeys.length !== nextKeys.length) {
            return next
        }

        for (const key of nextKeys) {
            if (next[key] !== prev[key]) {
                return next
            }
        }

        return prev
    })
