/**
 * @jest-environment jsdom
 */

import { Context, render } from '@whatsup/jsx'
import { NAVIGATION } from '../src/keys'
import type { Navigation } from '../src/navigation'
import { Route } from '../src/route'

describe('Base test', () => {
    it('should switch routes', () => {
        const container = document.createElement('div')

        let navigation!: Navigation

        function App(this: Context) {
            navigation = this.find(NAVIGATION)

            return (
                <>
                    <div>App</div>
                    <Route index component={Index} />
                    <Route path="/about" component={About} />
                    <Route path="/user" component={User} />
                </>
            )
        }

        function Index() {
            return <div>Index</div>
        }

        function About() {
            return <div>About</div>
        }

        function User() {
            return <div>User</div>
        }

        render(<App />, container)

        expect(container.innerHTML).toBe('<div>App</div><div>Index</div>')

        navigation.navigate('/user')

        expect(container.innerHTML).toBe('<div>App</div><div>User</div>')

        navigation.navigate('/about')

        expect(container.innerHTML).toBe('<div>App</div><div>About</div>')

        navigation.navigate('/')

        expect(container.innerHTML).toBe('<div>App</div><div>Index</div>')
    })

    it('should switch nested routes', () => {
        const container = document.createElement('div')

        let navigation!: Navigation

        function App(this: Context) {
            navigation = this.find(NAVIGATION)

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
            return (
                <>
                    <div>User</div>
                    <Route path="/settings" component={Settings} />
                    <Route path="/profile" component={Profile} />
                </>
            )
        }

        function Settings() {
            return <div>Settings</div>
        }

        function Profile() {
            return <div>Profile</div>
        }

        render(<App />, container)

        expect(container.innerHTML).toBe('<div>App</div>')

        navigation.navigate('/user')

        expect(container.innerHTML).toBe('<div>App</div><div>User</div>')

        navigation.navigate('/about')

        expect(container.innerHTML).toBe('<div>App</div><div>About</div>')

        navigation.navigate('/user/profile')

        expect(container.innerHTML).toBe('<div>App</div><div>User</div><div>Profile</div>')

        navigation.navigate('/user/settings')

        expect(container.innerHTML).toBe('<div>App</div><div>User</div><div>Settings</div>')

        navigation.navigate('/')

        expect(container.innerHTML).toBe('<div>App</div>')
    })

    it('should render only changed segments', () => {
        const container = document.createElement('div')
        const mockApp = jest.fn()
        const mockAbout = jest.fn()
        const mockUser = jest.fn()
        const mockUserProfile = jest.fn()
        const mockUserSettings = jest.fn()

        let navigation!: Navigation

        function App(this: Context) {
            navigation = this.find(NAVIGATION)

            mockApp()

            return (
                <div>
                    <div>App</div>
                    <Route path="/about" component={About} />
                    <Route path="/user" component={User} />
                </div>
            )
        }

        function About() {
            mockAbout()
            return <div>About</div>
        }

        function User() {
            mockUser()
            return (
                <div>
                    <div>User</div>
                    <Route path="/settings" component={Settings} />
                    <Route path="/profile" component={Profile} />
                </div>
            )
        }

        function Settings() {
            mockUserSettings()
            return <div>Settings</div>
        }

        function Profile() {
            mockUserProfile()
            return <div>Profile</div>
        }

        render(<App />, container)

        expect(mockApp).toBeCalledTimes(1)
        expect(mockAbout).toBeCalledTimes(0)
        expect(mockUser).toBeCalledTimes(0)
        expect(mockUserSettings).toBeCalledTimes(0)
        expect(mockUserProfile).toBeCalledTimes(0)

        navigation.navigate('/about')

        expect(mockApp).toBeCalledTimes(2)
        expect(mockAbout).toBeCalledTimes(1)
        expect(mockUser).toBeCalledTimes(0)
        expect(mockUserSettings).toBeCalledTimes(0)
        expect(mockUserProfile).toBeCalledTimes(0)

        navigation.navigate('/user')

        expect(mockApp).toBeCalledTimes(3)
        expect(mockAbout).toBeCalledTimes(1)
        expect(mockUser).toBeCalledTimes(1)
        expect(mockUserSettings).toBeCalledTimes(0)
        expect(mockUserProfile).toBeCalledTimes(0)

        navigation.navigate('/user/profile')

        expect(mockApp).toBeCalledTimes(3)
        expect(mockAbout).toBeCalledTimes(1)
        expect(mockUser).toBeCalledTimes(2)
        expect(mockUserSettings).toBeCalledTimes(0)
        expect(mockUserProfile).toBeCalledTimes(1)

        navigation.navigate('/user/settings')

        expect(mockApp).toBeCalledTimes(3)
        expect(mockAbout).toBeCalledTimes(1)
        expect(mockUser).toBeCalledTimes(3)
        expect(mockUserSettings).toBeCalledTimes(1)
        expect(mockUserProfile).toBeCalledTimes(1)

        navigation.navigate('/')

        expect(mockApp).toBeCalledTimes(4)
        expect(mockAbout).toBeCalledTimes(1)
        expect(mockUser).toBeCalledTimes(3)
        expect(mockUserSettings).toBeCalledTimes(1)
        expect(mockUserProfile).toBeCalledTimes(1)
    })

    it('should throw error', () => {
        const mock = jest.fn()
        const original = console.error
        const container = document.createElement('div')

        console.error = mock

        function App(this: Context) {
            return (
                <>
                    <div>App</div>
                    <Route component={Index} />
                </>
            )
        }

        function Index() {
            return <div>Index</div>
        }

        render(<App />, container)

        expect(mock.mock.calls[0][0].message).toBe(
            'Cannot compile path, you need define one parameter of path or index'
        )

        console.error = original
    })

    it('should not to be case sensitive', () => {
        const container = document.createElement('div')

        let navigation!: Navigation

        function App(this: Context) {
            navigation = this.find(NAVIGATION)

            return (
                <>
                    <div>App</div>
                    <Route path="/about" component={About} />
                </>
            )
        }

        function About() {
            return <div>About</div>
        }

        render(<App />, container)

        expect(container.innerHTML).toBe('<div>App</div>')

        navigation.navigate('/About')

        expect(container.innerHTML).toBe('<div>App</div><div>About</div>')

        navigation.navigate('/')

        expect(container.innerHTML).toBe('<div>App</div>')
    })

    it('should to be case sensitive', () => {
        const container = document.createElement('div')

        let navigation!: Navigation

        function App(this: Context) {
            navigation = this.find(NAVIGATION)

            return (
                <>
                    <div>App</div>
                    <Route path="/about" component={About} sensitive />
                </>
            )
        }

        function About() {
            return <div>About</div>
        }

        render(<App />, container)

        expect(container.innerHTML).toBe('<div>App</div>')

        navigation.navigate('/About')

        expect(container.innerHTML).toBe('<div>App</div>')

        navigation.navigate('/about')

        expect(container.innerHTML).toBe('<div>App</div><div>About</div>')

        navigation.navigate('/')

        expect(container.innerHTML).toBe('<div>App</div>')
    })
})
