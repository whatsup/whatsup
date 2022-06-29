/**
 * @jest-environment jsdom
 */

import { Context, render } from '@whatsup/jsx'
import { Route } from '../src/route'
import { Navigation, NestedNavigation, RootNavigation } from '../src/navigation'
import { NAVIGATION } from '../src/keys'

describe('Navigation', () => {
    it('should extract params in nested routes and pass they as props', () => {
        const container = document.createElement('div')

        let appNavigation!: Navigation
        let userNavigation!: Navigation
        let postNavigation!: Navigation

        function App(this: Context) {
            appNavigation = this.find(NAVIGATION)

            return (
                <>
                    <div>App</div>
                    <Route path="/user/:id" component={User} />
                </>
            )
        }

        interface UserProps {
            id: number
        }

        function User(this: Context, props: UserProps) {
            userNavigation = this.find(NAVIGATION)
            return (
                <>
                    <div>User {props.id}</div>
                    <Route path="/post/:id" component={Post} />
                </>
            )
        }

        interface PostProps {
            id: number
        }

        function Post(this: Context, props: PostProps) {
            postNavigation = this.find(NAVIGATION)
            return <div>Post {props.id}</div>
        }

        render(<App />, container)

        expect(appNavigation).toBeInstanceOf(RootNavigation)

        appNavigation.navigate('/user/1/post/2')

        expect(userNavigation).toBeInstanceOf(NestedNavigation)
        expect(postNavigation).toBeInstanceOf(NestedNavigation)
        expect(userNavigation['parent']).toBe(appNavigation)
        expect(postNavigation['parent']).toBe(userNavigation)
        expect(appNavigation.matchedUrl).toBe('')
        expect(userNavigation.matchedUrl).toBe('/user/1')
        expect(postNavigation.matchedUrl).toBe('/user/1/post/2')
        expect(appNavigation.tail).toBe('/user/1/post/2')
        expect(userNavigation.tail).toBe('/post/2')
        expect(postNavigation.tail).toBe('')
        expect(appNavigation.pathname).toEqual('/user/1/post/2')
        expect(appNavigation.matchedParams).toEqual({})
        expect(userNavigation.matchedParams).toEqual({ id: 1 })
        expect(postNavigation.matchedParams).toEqual({ id: 2 })

        appNavigation.navigate('/')
    })

    it('should replace history item', () => {
        const container = document.createElement('div')

        let navigator!: Navigation

        function App(this: Context) {
            navigator = this.find(NAVIGATION)

            return (
                <>
                    <div>App</div>
                    <Route path="/about" component={About} />
                    <Route path="/user" component={User} />
                </>
            )
        }

        function About() {
            return <div>About</div>
        }

        function User() {
            return <div>User</div>
        }

        render(<App />, container)

        expect(container.innerHTML).toBe('<div>App</div>')

        navigator.navigate('/about')

        expect(container.innerHTML).toBe('<div>App</div><div>About</div>')

        navigator.replace('/user')

        expect(container.innerHTML).toBe('<div>App</div><div>User</div>')

        // navigator.back()

        // expect(window.location.pathname).toBe('/')
        // expect(container.innerHTML).toBe('<div>App</div>')

        // navigator.navigate('/')

        // expect(container.innerHTML).toBe('<div>App</div>')
    })
})
