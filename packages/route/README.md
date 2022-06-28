# Route stream for organizing routing in a WhatsUp application

<div align="center">
<img src="https://img.shields.io/github/workflow/status/whatsup/route/Node.js%20CI/master" alt="GitHub Workflow Status (branch)" /> 
<img src="https://img.shields.io/codecov/c/github/whatsup/route" alt="codecov" />
<img src="https://img.shields.io/github/languages/top/whatsup/route" alt="language" />
<img src="https://img.shields.io/npm/l/@whatsup/route" alt="license" />  
</div>

## Install

```bash
npm i @whatsup/route

// or

yarn add @whatsup/route
```

## Usage

Using the whatsup route is very simple. See this example:

```tsx
import { render } from '@whatsup/jsx'
import { Route, RouteLink } from '@whatsup/route'

function App() {
    return (
        <div>
            <div>App</div>
            <div>
                <Route index component={Index} />
                <Route path="/about" component={About} />
                <Route path="/user" component={User} />
            </div>
            <div>
                <RouteLink to="/about">Goto about</RouteLink>
                <RouteLink to="/user">Goto user</RouteLink>
            </div>
        </div>
    )
}

function Index() {
    return <div>Index route</div>
}

function About() {
    return <div>About route</div>
}

function User() {
    return <div>User route</div>
}

render(<App />, container)
```

## Params

You can use patterns like `:param` or native regular expressions

```tsx
function App() {
    return (
        <div>
            <Route path="/user/:id" component={User} />
        </div>
    )
}

interface UserProps {
    id: number
}

function User(props: UserProps) {
    return <div>User {props.id}</div>
}
```

```tsx
function App(this: Context) {
    return (
        <div>
            <Route path={/\/user\/(?<id>[0-9]+)/} component={User} />
        </div>
    )
}

interface UserProps {
    id: number
}

function User(props: UserProps) {
    return <div>User {props.id}</div>
}
```

## Navigator

You can access to route Navigator through context

```tsx
import { render, Context } from '@whatsup/jsx'
import { Route, RouteLink, NAVIGATOR } from '@whatsup/route'

function App() {
    return (
        <div>
            <Route path="/user" component={User} />
            <Route path="/about" component={About} />
        </div>
    )
}

function User(this: Context) {
    const navigator = this.find(NAVIGATOR)

    return (
        <div>
            <div>User {props.id}</div>
            <button onClick={() => navigator.navigate('/about')}>Goto about</button>
        </div>
    )
}
```
