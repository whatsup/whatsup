/**
 * @jest-environment jsdom
 */

import { Context, createRef, render } from '@whatsup/jsx'
import { Route } from '../src/route'
import { RouteLink } from '../src/link'

describe('Link test', () => {
    it('should switch routes', () => {
        const container = document.createElement('div')
        const rootLink = createRef()
        const userLink = createRef()
        const aboutLink = createRef()

        function App(this: Context) {
            return (
                <>
                    <div>
                        <div>App</div>
                        <Route path="/about" component={About} />
                        <Route path="/user" component={User} />
                    </div>
                    <RouteLink ref={rootLink} to="/">
                        Root
                    </RouteLink>
                    <RouteLink ref={userLink} to="/user">
                        User
                    </RouteLink>
                    <RouteLink ref={aboutLink} to="/about">
                        About
                    </RouteLink>
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

        expect(container.children[0].innerHTML).toBe('<div>App</div>')

        userLink.current?.click()

        expect(container.children[0].innerHTML).toBe('<div>App</div><div>User</div>')

        aboutLink.current?.click()

        expect(container.children[0].innerHTML).toBe('<div>App</div><div>About</div>')

        rootLink.current?.click()

        expect(container.children[0].innerHTML).toBe('<div>App</div>')
    })

    it('should switch relative routes', () => {
        const container = document.createElement('div')
        const rootLink = createRef()
        const userLink = createRef()
        const profileLink = createRef()
        const settingsLink = createRef()

        function App(this: Context) {
            return (
                <>
                    <div>
                        <div>App</div>
                        <Route path="/user" component={User} />
                    </div>
                    <RouteLink ref={userLink} to="/user">
                        User
                    </RouteLink>
                    <RouteLink ref={rootLink} to="/">
                        Root
                    </RouteLink>
                </>
            )
        }

        function User() {
            return (
                <>
                    <div>
                        <div>User</div>
                        <Route path="/profile" component={Profile} />
                        <Route path="/settings" component={Settings} />
                    </div>
                    <RouteLink ref={profileLink} to="./profile">
                        Profile
                    </RouteLink>
                    <RouteLink ref={settingsLink} to="./settings">
                        Settings
                    </RouteLink>
                </>
            )
        }

        function Profile() {
            return <div>Profile</div>
        }

        function Settings() {
            return <div>Settings</div>
        }

        render(<App />, container)

        expect(container.children[0].innerHTML).toBe('<div>App</div>')

        userLink.current?.click()

        expect(container.children[0].innerHTML).toBe(
            '<div>App</div><div><div>User</div></div><a href="/user/profile">Profile</a><a href="/user/settings">Settings</a>'
        )

        profileLink.current?.click()

        expect(container.children[0].innerHTML).toBe(
            '<div>App</div><div><div>User</div><div>Profile</div></div><a href="/user/profile">Profile</a><a href="/user/settings">Settings</a>'
        )

        settingsLink.current?.click()

        expect(container.children[0].innerHTML).toBe(
            '<div>App</div><div><div>User</div><div>Settings</div></div><a href="/user/profile">Profile</a><a href="/user/settings">Settings</a>'
        )

        rootLink.current?.click()

        expect(container.children[0].innerHTML).toBe('<div>App</div>')
    })

    it('should call onClick', () => {
        const container = document.createElement('div')
        const rootLink = createRef()
        const mock = jest.fn()

        function App(this: Context) {
            return (
                <RouteLink ref={rootLink} to="/" onClick={mock}>
                    Root
                </RouteLink>
            )
        }

        render(<App />, container)

        expect(container.innerHTML).toBe('<a href="/">Root</a>')

        rootLink.current?.click()

        expect(mock).toBeCalledTimes(1)
    })

    it('should switch routes', () => {
        const container = document.createElement('div')
        const rootLink = createRef()
        const userLink = createRef()
        const aboutLink = createRef()

        function App(this: Context) {
            return (
                <>
                    <div>
                        <div>App</div>
                        <Route path="/about" component={About} />
                        <Route path="/user" component={User} />
                    </div>
                    <RouteLink ref={rootLink} to="/">
                        Root
                    </RouteLink>
                    <RouteLink ref={userLink} to="/user">
                        User
                    </RouteLink>
                    <RouteLink ref={aboutLink} to="/about" useReplace>
                        About
                    </RouteLink>
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

        expect(container.children[0].innerHTML).toBe('<div>App</div>')

        userLink.current?.click()

        expect(container.children[0].innerHTML).toBe('<div>App</div><div>User</div>')

        aboutLink.current?.click()

        expect(container.children[0].innerHTML).toBe('<div>App</div><div>About</div>')

        rootLink.current?.click()

        expect(container.children[0].innerHTML).toBe('<div>App</div>')
    })
})
