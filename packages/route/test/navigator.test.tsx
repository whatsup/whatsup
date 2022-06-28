/**
 * @jest-environment jsdom
 */

import { Context, render } from '@whatsup/jsx'
import { Route } from '../src/route'
import { Navigator, NestedNavigator, RootNavigator } from '../src/navigator'
import { NAVIGATOR } from '../src/keys'

describe('Navigator', () => {
    it('should extract params in nested routes and pass they as props', () => {
        const container = document.createElement('div')

        let appNavigator!: Navigator
        let userNavigator!: Navigator
        let postNavigator!: Navigator

        function App(this: Context) {
            appNavigator = this.find(NAVIGATOR)

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
            userNavigator = this.find(NAVIGATOR)
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
            postNavigator = this.find(NAVIGATOR)
            return <div>Post {props.id}</div>
        }

        render(<App />, container)

        expect(appNavigator).toBeInstanceOf(RootNavigator)

        appNavigator.navigate('/user/1/post/2')

        expect(userNavigator).toBeInstanceOf(NestedNavigator)
        expect(postNavigator).toBeInstanceOf(NestedNavigator)
        expect(userNavigator['parent']).toBe(appNavigator)
        expect(postNavigator['parent']).toBe(userNavigator)
        expect(appNavigator.matchedUrl).toBe('')
        expect(userNavigator.matchedUrl).toBe('/user/1')
        expect(postNavigator.matchedUrl).toBe('/user/1/post/2')
        expect(appNavigator.tail).toBe('/user/1/post/2')
        expect(userNavigator.tail).toBe('/post/2')
        expect(postNavigator.tail).toBe('')
        expect(appNavigator.pathname).toEqual('/user/1/post/2')
        expect(appNavigator.matchedParams).toEqual({})
        expect(userNavigator.matchedParams).toEqual({ id: 1 })
        expect(postNavigator.matchedParams).toEqual({ id: 2 })

        appNavigator.navigate('/')
    })

    it('should replace history item', () => {
        const container = document.createElement('div')

        let navigator!: Navigator

        function App(this: Context) {
            navigator = this.find(NAVIGATOR)

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
