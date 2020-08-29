import { fractal } from '../src/fractal'
import { live } from '../src/runners'
import { LiveFrame } from '../src/frame'
import { tmp } from '../src/helpers'

describe('Helpers', () => {
    const delay = (time: number) => new Promise((r) => setTimeout(r, time))

    describe('tmp helper', () => {
        const App = fractal(async function* _User() {
            while (true) {
                yield tmp('Loading')
                await delay(100)
                yield 'Loaded'
            }
        })

        let frame: LiveFrame<string>

        it(`first frame has value "Loading"`, async () => {
            frame = await live(App)
            expect(frame.data).toBe('Loading')
        })

        it(`second frame has value "Loaded"`, async () => {
            frame = await frame.next
            expect(frame.data).toBe('Loaded')
        })
    })
})
