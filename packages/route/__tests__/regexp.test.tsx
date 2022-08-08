/**
 * @jest-environment jsdom
 */

import { Context, render } from '@whatsup/jsx'
import { NAVIGATION } from '../src/keys'
import type { Navigation } from '../src/navigation'
import { Route } from '../src/route'

describe('Regexp test', () => {
    it('should extract params and pass they as props', () => {
        const container = document.createElement('div')

        let navigation!: Navigation

        function App(this: Context) {
            navigation = this.find(NAVIGATION)

            return (
                <>
                    <div>App</div>
                    <Route path={/\/user\/(?<id>[0-9]+)/} component={User} />
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

        navigation.navigate('/user')

        expect(container.innerHTML).toBe('<div>App</div>')

        navigation.navigate('/user/1')

        expect(container.innerHTML).toBe('<div>App</div><div>User 1</div>')

        navigation.navigate('/user/2')

        expect(container.innerHTML).toBe('<div>App</div><div>User 2</div>')

        navigation.navigate('/')

        expect(container.innerHTML).toBe('<div>App</div>')
    })

    it('should extract params in nested routes and pass they as props', () => {
        const container = document.createElement('div')

        let navigation!: Navigation

        function App(this: Context) {
            navigation = this.find(NAVIGATION)

            return (
                <>
                    <div>App</div>
                    <Route path={/\/user\/(?<id>[0-9]+)/} component={User} />
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
                    <Route path={/\/post\/(?<id>[0-9]+)/} component={Post} />
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

        navigation.navigate('/user/1')

        expect(container.innerHTML).toBe('<div>App</div><div>User 1</div>')

        navigation.navigate('/user/2')

        expect(container.innerHTML).toBe('<div>App</div><div>User 2</div>')

        navigation.navigate('/user/2/post/1')

        expect(container.innerHTML).toBe('<div>App</div><div>User 2</div><div>Post 1</div>')

        navigation.navigate('/user/3/post/2')

        expect(container.innerHTML).toBe('<div>App</div><div>User 3</div><div>Post 2</div>')

        navigation.navigate('/')

        expect(container.innerHTML).toBe('<div>App</div>')
    })
})
