import { observable } from 'whatsup'
import { Div, H1, P, Main } from './app.css'
import { Logo } from './logo/logo'

const colors = [
    '#cddc39',
    '#e91e63',
    '#9c27b0',
    '#2196f3',
    '#00bcd4',
    '#4caf50',
    '#ffc107',
]

export function* App() {
    const color = observable(colors[0])

    while (true) {
        yield (
            <Main css:container>
                <Div css:spacer />
                <Logo color={color()} />
                <H1 css:header>whatsup</H1>
                <P css:description>
                    A frontend framework for chillout-mode development 🥤
                </P>
                <Div css:spacer />
                <Div css:circles>
                    {colors.map((c) => (
                        <Div
                            css:circle
                            css:$color={c}
                            onClick={() => color(c)}
                            key={c}
                        />
                    ))}
                </Div>
                <P css:clickMe>click me</P>
            </Main>
        )
    }
}
