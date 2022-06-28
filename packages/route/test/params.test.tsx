/**
 * @jest-environment jsdom
 */

import { Context, render } from '@whatsup/jsx'
import { NAVIGATOR } from '../src/keys'
import type { Navigator } from '../src/navigator'
import { Route } from '../src/route'

describe('Params test', () => {
    it('should extract params and pass they as props', () => {
        const container = document.createElement('div')

        let navigator!: Navigator

        function App(this: Context) {
            navigator = this.find(NAVIGATOR)

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

        function User(props: UserProps) {
            return <div>User {props.id}</div>
        }

        render(<App />, container)

        expect(container.innerHTML).toBe('<div>App</div>')

        navigator.navigate('/user')

        expect(container.innerHTML).toBe('<div>App</div>')

        navigator.navigate('/user/1')

        expect(container.innerHTML).toBe('<div>App</div><div>User 1</div>')

        navigator.navigate('/user/2')

        expect(container.innerHTML).toBe('<div>App</div><div>User 2</div>')

        navigator.navigate('/')

        expect(container.innerHTML).toBe('<div>App</div>')
    })

    it('should convert number-like params to numbers', () => {
        const container = document.createElement('div')

        let navigator!: Navigator

        function App(this: Context) {
            navigator = this.find(NAVIGATOR)

            return (
                <>
                    <div>App</div>
                    <Route path="/user/:name/:id" component={User} />
                </>
            )
        }

        interface UserProps {
            id: number
            name: string
        }

        function User(props: UserProps) {
            return (
                <div>
                    User {typeof props.id} {typeof props.name}
                </div>
            )
        }

        render(<App />, container)

        expect(container.innerHTML).toBe('<div>App</div>')

        navigator.navigate('/user')

        expect(container.innerHTML).toBe('<div>App</div>')

        navigator.navigate('/user/Barry/1')

        expect(container.innerHTML).toBe('<div>App</div><div>User number string</div>')

        navigator.navigate('/')

        expect(container.innerHTML).toBe('<div>App</div>')
    })

    it('should extract params in nested routes and pass they as props', () => {
        const container = document.createElement('div')

        let navigator!: Navigator

        function App(this: Context) {
            navigator = this.find(NAVIGATOR)

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

        function User(props: UserProps) {
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

        function Post(props: PostProps) {
            return <div>Post {props.id}</div>
        }

        render(<App />, container)

        expect(container.innerHTML).toBe('<div>App</div>')

        navigator.navigate('/user/1')

        expect(container.innerHTML).toBe('<div>App</div><div>User 1</div>')

        navigator.navigate('/user/2')

        expect(container.innerHTML).toBe('<div>App</div><div>User 2</div>')

        navigator.navigate('/user/2/post/1')

        expect(container.innerHTML).toBe('<div>App</div><div>User 2</div><div>Post 1</div>')

        navigator.navigate('/user/3/post/2')

        expect(container.innerHTML).toBe('<div>App</div><div>User 3</div><div>Post 2</div>')

        navigator.navigate('/')

        expect(container.innerHTML).toBe('<div>App</div>')
    })
})
