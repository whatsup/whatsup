/**
 * @jest-environment jsdom
 */

import { Event } from '../src/event'
import { component, html } from '../src/factories'
import { Context, createKey } from '../src/context'
import { render } from '../src/render'
import { observable, Observable } from 'whatsup'

describe('Context', () => {
    describe('Parent-Child', () => {
        let context1: Context
        let context2: Context
        let context3: Context
        let context4: Context
        let trigger: Observable<boolean>

        function* Test1(this: Context, _: any) {
            context1 = this

            while (true) {
                yield component(Test2, '', undefined, undefined, undefined)
            }
        }

        function* Test2(this: Context) {
            context2 = this
            trigger = observable(false)

            while (true) {
                if (trigger.get()) {
                    yield component(Test3, '', undefined, undefined, undefined, [
                        component(Test4, '', undefined, undefined, undefined, []),
                    ])
                    continue
                }

                yield null
            }
        }

        function* Test3(this: Context, props: any) {
            context3 = this
            while (true) {
                yield props.children
            }
        }
        function* Test4(this: Context, _: any) {
            context4 = this
            while (true) {
                yield 'Hello'
            }
        }

        render(component(Test1, '', undefined, undefined))

        it('should defined context1 context2', () => {
            expect(context1).not.toBeUndefined()
            expect(context2).not.toBeUndefined()
            expect(context3).toBeUndefined()
            expect(context4).toBeUndefined()
        })

        it('should create child contexts', () => {
            trigger.set(true)
            expect(context3).not.toBeUndefined()
            expect(context4).not.toBeUndefined()
            expect(context3.parent === context2).toBeTruthy()
            expect(context4.parent === context3).toBeTruthy()
        })
    })

    describe('Atoms', () => {
        let context1: Context
        let context2: Context
        let context3: Context
        let context4: Context

        function* Test1(this: Context) {
            context1 = this
            while (true) {
                yield component(Test2, '', undefined, undefined)
            }
        }
        function* Test2(this: Context) {
            context2 = this
            while (true) {
                yield component(Test3, '', undefined, undefined)
            }
        }
        function* Test3(this: Context) {
            context3 = this
            while (true) {
                yield component(Test4, '', undefined, undefined)
            }
        }
        function* Test4(this: Context) {
            context4 = this
            while (true) {
                yield 'Hello'
            }
        }

        render(component(Test1, '', undefined, undefined))

        describe('Sharing', () => {
            const testkey = createKey('default')

            it('should have defaultValue', () => {
                expect(testkey.defaultValue).toBe('default')
            })

            it('should return defaultValue when key is not found', () => {
                const value = context1.find(testkey)
                expect(value).toBe('default')
            })

            it('should throw error when key without defaultValue not exist in context', () => {
                const testKey = createKey()
                expect(() => context2.find(testKey)).toThrow()
            })

            it('should return test value on child levels', () => {
                context1.share(testkey, 'hello')

                expect(context2.find(testkey)).toBe('hello')
                expect(context3.find(testkey)).toBe('hello')
                expect(context4.find(testkey)).toBe('hello')
            })

            it('should override key for child levels', () => {
                context3.share(testkey, 'world')

                expect(context2.find(testkey)).toBe('hello')
                expect(context3.find(testkey)).toBe('hello')
                expect(context4.find(testkey)).toBe('world')
            })

            it('should share instance to children', () => {
                class Instance {}
                const instance = new Instance()

                context1.share(instance)

                expect(context2.find(Instance)).toBe(instance)
                expect(context3.find(Instance)).toBe(instance)
                expect(context4.find(Instance)).toBe(instance)
            })

            it('should throw error when shared instance not exist', () => {
                class Instance {}

                expect(() => context2.find(Instance)).toThrow()
                expect(() => context3.find(Instance)).toThrow()
                expect(() => context4.find(Instance)).toThrow()
            })

            it('should find instance in context', () => {
                class Base {}
                class Local extends Base {}

                const instance = new Local()

                context1.share(instance)

                expect(context2.find(Base)).toBe(instance)
                expect(context3.find(Base)).toBe(instance)
                expect(context4.find(Base)).toBe(instance)
            })

            it('should find instance in context', () => {
                class Base {}
                class Local extends Base {}

                const instance = new Local()

                context1.share(instance)

                expect(context2.find(Base)).toBe(instance)
                expect(context3.find(Base)).toBe(instance)
                expect(context4.find(Base)).toBe(instance)
            })

            it('should throw error when shared instance not found', () => {
                class Instance {}

                expect(() => context2.find(Instance)).toThrow()
                expect(() => context3.find(Instance)).toThrow()
                expect(() => context4.find(Instance)).toThrow()
            })
        })

        describe('Events', () => {
            class TestEvent extends Event {
                constructor(readonly payload: string) {
                    super()
                }
            }

            it('mock should to be called with "hello"', () => {
                const mock = jest.fn()
                const dispose = context1.on(TestEvent, (e) => mock(e.payload))
                context1.dispatch(new TestEvent('hello'))

                expect(mock).toBeCalledTimes(1)
                expect(mock).lastCalledWith('hello')

                dispose()
            })

            it('mock should to be called with "world" when event dispatch in deep', () => {
                const mock = jest.fn()
                const dispose = context1.on(TestEvent, (e) => mock(e.payload))
                context3.dispatch(new TestEvent('world'))

                expect(mock).toBeCalledTimes(1)
                expect(mock).lastCalledWith('world')

                dispose()
            })

            it('mocks should to be called with "world" on every level', () => {
                const mock1 = jest.fn()
                const mock2 = jest.fn()
                const dispose1 = context1.on(TestEvent, (e) => mock1(e.payload))
                const dispose2 = context2.on(TestEvent, (e) => mock2(e.payload))
                context3.dispatch(new TestEvent('world'))

                expect(mock1).toBeCalledTimes(1)
                expect(mock1).lastCalledWith('world')
                expect(mock2).toBeCalledTimes(1)
                expect(mock2).lastCalledWith('world')

                dispose1()
                dispose2()
            })

            it('mocks should to be called with "world" on every callback', () => {
                const mock1 = jest.fn()
                const mock2 = jest.fn()
                const dispose1 = context1.on(TestEvent, (e) => mock1(e.payload))
                const dispose2 = context1.on(TestEvent, (e) => mock2(e.payload))
                context3.dispatch(new TestEvent('world'))

                expect(mock1).toBeCalledTimes(1)
                expect(mock1).lastCalledWith('world')
                expect(mock2).toBeCalledTimes(1)
                expect(mock2).lastCalledWith('world')

                dispose1()
                dispose2()
            })

            it('mock2 should to be called & mock1 should not to be called (stopPropagation)', () => {
                const mock1 = jest.fn()
                const mock2 = jest.fn()
                const dispose1 = context1.on(TestEvent, (e) => mock1(e.payload))
                const dispose2 = context2.on(TestEvent, (e) => {
                    mock2(e.payload)
                    e.stopPropagation()
                })
                context3.dispatch(new TestEvent('world'))

                expect(mock1).toBeCalledTimes(0)
                expect(mock2).toBeCalledTimes(1)
                expect(mock2).lastCalledWith('world')

                dispose1()
                dispose2()
            })

            it('mock2 should to be called & mock1, mock2 should not to be called (stopImmediatePropagation)', () => {
                const mock1 = jest.fn()
                const mock2 = jest.fn()
                const mock3 = jest.fn()
                const dispose1 = context1.on(TestEvent, (e) => mock1(e.payload))
                const dispose2 = context2.on(TestEvent, (e) => {
                    mock2(e.payload)
                    e.stopImmediatePropagation()
                })
                const dispose3 = context2.on(TestEvent, (e) => mock3(e.payload))
                context3.dispatch(new TestEvent('world'))

                expect(mock1).toBeCalledTimes(0)
                expect(mock2).toBeCalledTimes(1)
                expect(mock2).lastCalledWith('world')
                expect(mock3).toBeCalledTimes(0)

                dispose1()
                dispose2()
                dispose3()
            })

            it('mock should not to be called because it removed through .off(ev, li) method', () => {
                const mock = jest.fn()
                context1.on(TestEvent, mock)
                context1.off(TestEvent, mock)
                context2.dispatch(new TestEvent('world'))

                expect(mock).toBeCalledTimes(0)
            })

            it('all mocks should not to be called because they removed through .off(ev) method', () => {
                const mock1 = jest.fn()
                const mock2 = jest.fn()
                context1.on(TestEvent, mock1)
                context1.on(TestEvent, mock2)
                context1.off(TestEvent)
                context2.dispatch(new TestEvent('world'))

                expect(mock1).toBeCalledTimes(0)
                expect(mock2).toBeCalledTimes(0)
            })
        })
    })

    describe('Generators', () => {
        let context1: Context
        let context2: Context
        let context3: Context
        let context4: Context

        function* Test1(this: Context, _: any) {
            context1 = this
            while (true) {
                yield html('div', '', undefined, undefined, undefined, [
                    component(Test2, '', undefined, undefined, undefined, [
                        component(Test3, '', undefined, undefined, undefined, [
                            component(Test4, '', undefined, undefined, undefined, []),
                        ]),
                    ]),
                ])
            }
        }
        function* Test2(this: Context, props: any) {
            context2 = this
            while (true) {
                yield html('div', '', undefined, undefined, undefined, [props.children])
            }
        }
        function* Test3(this: Context, props: any) {
            context3 = this
            while (true) {
                yield html('div', '', undefined, undefined, undefined, [props.children])
            }
        }
        function* Test4(this: Context, _: any) {
            context4 = this
            while (true) {
                yield 'Hello'
            }
        }

        render(component(Test1, '', undefined, undefined))

        describe('Sharing', () => {
            const testKey = createKey('default')

            it('should have defaultValue', () => {
                expect(testKey.defaultValue).toBe('default')
            })

            it('should return defaultValue when key is not found', () => {
                const value = context1.find(testKey)
                expect(value).toBe('default')
            })

            it('should throw error when key without defaultValue not exist in context', () => {
                const testKey = createKey()
                expect(() => context2.find(testKey)).toThrow()
            })

            it('should return test value on child levels', () => {
                context1.share(testKey, 'hello')

                expect(context2.find(testKey)).toBe('hello')
                expect(context3.find(testKey)).toBe('hello')
                expect(context4.find(testKey)).toBe('hello')
            })

            it('should override key for child levels', () => {
                context3.share(testKey, 'world')

                expect(context2.find(testKey)).toBe('hello')
                expect(context3.find(testKey)).toBe('hello')
                expect(context4.find(testKey)).toBe('world')
            })

            it('should share instance to children', () => {
                class Instance {}
                const instance = new Instance()

                context1.share(instance)

                expect(context2.find(Instance)).toBe(instance)
                expect(context3.find(Instance)).toBe(instance)
                expect(context4.find(Instance)).toBe(instance)
            })

            it('should throw error when shared instance not exist', () => {
                class Instance {}

                expect(() => context2.find(Instance)).toThrow()
                expect(() => context3.find(Instance)).toThrow()
                expect(() => context4.find(Instance)).toThrow()
            })

            it('should find instance in context', () => {
                class Base {}
                class Local extends Base {}

                const instance = new Local()

                context1.share(instance)

                expect(context2.find(Base)).toBe(instance)
                expect(context3.find(Base)).toBe(instance)
                expect(context4.find(Base)).toBe(instance)
            })

            it('should find instance in context', () => {
                class Base {}
                class Local extends Base {}

                const instance = new Local()

                context1.share(instance)

                expect(context2.find(Base)).toBe(instance)
                expect(context3.find(Base)).toBe(instance)
                expect(context4.find(Base)).toBe(instance)
            })

            it('should throw error when shared instance not found', () => {
                class Instance {}

                expect(() => context2.find(Instance)).toThrow()
                expect(() => context3.find(Instance)).toThrow()
                expect(() => context4.find(Instance)).toThrow()
            })
        })

        describe('Events', () => {
            class TestEvent extends Event {
                constructor(readonly payload: string) {
                    super()
                }
            }

            it('mock should to be called with "hello"', () => {
                const mock = jest.fn()
                const dispose = context1.on(TestEvent, (e) => mock(e.payload))
                context1.dispatch(new TestEvent('hello'))

                expect(mock).toBeCalledTimes(1)
                expect(mock).lastCalledWith('hello')

                dispose()
            })

            it('mock should to be called with "world" when event dispatch in deep', () => {
                const mock = jest.fn()
                const dispose = context1.on(TestEvent, (e) => mock(e.payload))
                context3.dispatch(new TestEvent('world'))

                expect(mock).toBeCalledTimes(1)
                expect(mock).lastCalledWith('world')

                dispose()
            })

            it('mocks should to be called with "world" on every level', () => {
                const mock1 = jest.fn()
                const mock2 = jest.fn()
                const dispose1 = context1.on(TestEvent, (e) => mock1(e.payload))
                const dispose2 = context2.on(TestEvent, (e) => mock2(e.payload))
                context3.dispatch(new TestEvent('world'))

                expect(mock1).toBeCalledTimes(1)
                expect(mock1).lastCalledWith('world')
                expect(mock2).toBeCalledTimes(1)
                expect(mock2).lastCalledWith('world')

                dispose1()
                dispose2()
            })

            it('mocks should to be called with "world" on every callback', () => {
                const mock1 = jest.fn()
                const mock2 = jest.fn()
                const dispose1 = context1.on(TestEvent, (e) => mock1(e.payload))
                const dispose2 = context1.on(TestEvent, (e) => mock2(e.payload))
                context3.dispatch(new TestEvent('world'))

                expect(mock1).toBeCalledTimes(1)
                expect(mock1).lastCalledWith('world')
                expect(mock2).toBeCalledTimes(1)
                expect(mock2).lastCalledWith('world')

                dispose1()
                dispose2()
            })

            it('mock2 should to be called & mock1 should not to be called (stopPropagation)', () => {
                const mock1 = jest.fn()
                const mock2 = jest.fn()
                const dispose1 = context1.on(TestEvent, (e) => mock1(e.payload))
                const dispose2 = context2.on(TestEvent, (e) => {
                    mock2(e.payload)
                    e.stopPropagation()
                })
                context3.dispatch(new TestEvent('world'))

                expect(mock1).toBeCalledTimes(0)
                expect(mock2).toBeCalledTimes(1)
                expect(mock2).lastCalledWith('world')

                dispose1()
                dispose2()
            })

            it('mock2 should to be called & mock1, mock2 should not to be called (stopImmediatePropagation)', () => {
                const mock1 = jest.fn()
                const mock2 = jest.fn()
                const mock3 = jest.fn()
                const dispose1 = context1.on(TestEvent, (e) => mock1(e.payload))
                const dispose2 = context2.on(TestEvent, (e) => {
                    mock2(e.payload)
                    e.stopImmediatePropagation()
                })
                const dispose3 = context2.on(TestEvent, (e) => mock3(e.payload))
                context3.dispatch(new TestEvent('world'))

                expect(mock1).toBeCalledTimes(0)
                expect(mock2).toBeCalledTimes(1)
                expect(mock2).lastCalledWith('world')
                expect(mock3).toBeCalledTimes(0)

                dispose1()
                dispose2()
                dispose3()
            })

            it('mock should not to be called because it removed through .off(ev, li) method', () => {
                const mock = jest.fn()
                context1.on(TestEvent, mock)
                context1.off(TestEvent, mock)
                context2.dispatch(new TestEvent('world'))

                expect(mock).toBeCalledTimes(0)
            })

            it('all mocks should not to be called because they removed through .off(ev) method', () => {
                const mock1 = jest.fn()
                const mock2 = jest.fn()
                context1.on(TestEvent, mock1)
                context1.on(TestEvent, mock2)
                context1.off(TestEvent)
                context2.dispatch(new TestEvent('world'))

                expect(mock1).toBeCalledTimes(0)
                expect(mock2).toBeCalledTimes(0)
            })
        })
    })
    describe('Functions', () => {
        let context1: Context
        let context2: Context
        let context3: Context
        let context4: Context

        function Test1(this: Context, _: any) {
            context1 = this

            return html('div', '', undefined, undefined, undefined, [
                component(Test2, '', undefined, undefined, undefined, [
                    component(Test3, '', undefined, undefined, undefined, [
                        component(Test4, '', undefined, undefined, undefined, []),
                    ]),
                ]),
            ])
        }
        function Test2(this: Context, props: any) {
            context2 = this

            return html('div', '', undefined, undefined, undefined, [props.children])
        }
        function Test3(this: Context, props: any) {
            context3 = this

            return html('div', '', undefined, undefined, undefined, [props.children])
        }
        function Test4(this: Context, _: any) {
            context4 = this

            return 'Hello'
        }

        render(component(Test1, '', undefined, undefined))

        describe('Sharing', () => {
            const testKey = createKey('default')

            it('should have defaultValue', () => {
                expect(testKey.defaultValue).toBe('default')
            })

            it('should return defaultValue when key is not found', () => {
                const value = context1.find(testKey)
                expect(value).toBe('default')
            })

            it('should throw error when key without defaultValue not exist in context', () => {
                const testKey = createKey()
                expect(() => context2.find(testKey)).toThrow()
            })

            it('should return test value on child levels', () => {
                context1.share(testKey, 'hello')

                expect(context2.find(testKey)).toBe('hello')
                expect(context3.find(testKey)).toBe('hello')
                expect(context4.find(testKey)).toBe('hello')
            })

            it('should override key for child levels', () => {
                context3.share(testKey, 'world')

                expect(context2.find(testKey)).toBe('hello')
                expect(context3.find(testKey)).toBe('hello')
                expect(context4.find(testKey)).toBe('world')
            })

            it('should share instance to children', () => {
                class Instance {}
                const instance = new Instance()

                context1.share(instance)

                expect(context2.find(Instance)).toBe(instance)
                expect(context3.find(Instance)).toBe(instance)
                expect(context4.find(Instance)).toBe(instance)
            })

            it('should throw error when shared instance not exist', () => {
                class Instance {}

                expect(() => context2.find(Instance)).toThrow()
                expect(() => context3.find(Instance)).toThrow()
                expect(() => context4.find(Instance)).toThrow()
            })

            it('should find instance in context', () => {
                class Base {}
                class Local extends Base {}

                const instance = new Local()

                context1.share(instance)

                expect(context2.find(Base)).toBe(instance)
                expect(context3.find(Base)).toBe(instance)
                expect(context4.find(Base)).toBe(instance)
            })

            it('should find instance in context', () => {
                class Base {}
                class Local extends Base {}

                const instance = new Local()

                context1.share(instance)

                expect(context2.find(Base)).toBe(instance)
                expect(context3.find(Base)).toBe(instance)
                expect(context4.find(Base)).toBe(instance)
            })

            it('should throw error when shared instance not found', () => {
                class Instance {}

                expect(() => context2.find(Instance)).toThrow()
                expect(() => context3.find(Instance)).toThrow()
                expect(() => context4.find(Instance)).toThrow()
            })
        })

        describe('Sharing with Symbol', () => {
            const testKey = Symbol('key')

            it('should throw error', () => {
                const testKey = createKey()
                expect(() => context2.find(testKey)).toThrow()
            })

            it('should return test value on child levels', () => {
                context1.share(testKey, 'hello')

                expect(context2.find(testKey)).toBe('hello')
                expect(context3.find(testKey)).toBe('hello')
                expect(context4.find(testKey)).toBe('hello')
            })

            it('should override key for child levels', () => {
                context3.share(testKey, 'world')

                expect(context2.find(testKey)).toBe('hello')
                expect(context3.find(testKey)).toBe('hello')
                expect(context4.find(testKey)).toBe('world')
            })
        })

        describe('Events', () => {
            class TestEvent extends Event {
                constructor(readonly payload: string) {
                    super()
                }
            }

            it('mock should to be called with "hello"', () => {
                const mock = jest.fn()
                const dispose = context1.on(TestEvent, (e) => mock(e.payload))
                context1.dispatch(new TestEvent('hello'))

                expect(mock).toBeCalledTimes(1)
                expect(mock).lastCalledWith('hello')

                dispose()
            })

            it('mock should to be called with "world" when event dispatch in deep', () => {
                const mock = jest.fn()
                const dispose = context1.on(TestEvent, (e) => mock(e.payload))
                context3.dispatch(new TestEvent('world'))

                expect(mock).toBeCalledTimes(1)
                expect(mock).lastCalledWith('world')

                dispose()
            })

            it('mocks should to be called with "world" on every level', () => {
                const mock1 = jest.fn()
                const mock2 = jest.fn()
                const dispose1 = context1.on(TestEvent, (e) => mock1(e.payload))
                const dispose2 = context2.on(TestEvent, (e) => mock2(e.payload))
                context3.dispatch(new TestEvent('world'))

                expect(mock1).toBeCalledTimes(1)
                expect(mock1).lastCalledWith('world')
                expect(mock2).toBeCalledTimes(1)
                expect(mock2).lastCalledWith('world')

                dispose1()
                dispose2()
            })

            it('mocks should to be called with "world" on every callback', () => {
                const mock1 = jest.fn()
                const mock2 = jest.fn()
                const dispose1 = context1.on(TestEvent, (e) => mock1(e.payload))
                const dispose2 = context1.on(TestEvent, (e) => mock2(e.payload))
                context3.dispatch(new TestEvent('world'))

                expect(mock1).toBeCalledTimes(1)
                expect(mock1).lastCalledWith('world')
                expect(mock2).toBeCalledTimes(1)
                expect(mock2).lastCalledWith('world')

                dispose1()
                dispose2()
            })

            it('mock2 should to be called & mock1 should not to be called (stopPropagation)', () => {
                const mock1 = jest.fn()
                const mock2 = jest.fn()
                const dispose1 = context1.on(TestEvent, (e) => mock1(e.payload))
                const dispose2 = context2.on(TestEvent, (e) => {
                    mock2(e.payload)
                    e.stopPropagation()
                })
                context3.dispatch(new TestEvent('world'))

                expect(mock1).toBeCalledTimes(0)
                expect(mock2).toBeCalledTimes(1)
                expect(mock2).lastCalledWith('world')

                dispose1()
                dispose2()
            })

            it('mock2 should to be called & mock1, mock2 should not to be called (stopImmediatePropagation)', () => {
                const mock1 = jest.fn()
                const mock2 = jest.fn()
                const mock3 = jest.fn()
                const dispose1 = context1.on(TestEvent, (e) => mock1(e.payload))
                const dispose2 = context2.on(TestEvent, (e) => {
                    mock2(e.payload)
                    e.stopImmediatePropagation()
                })
                const dispose3 = context2.on(TestEvent, (e) => mock3(e.payload))
                context3.dispatch(new TestEvent('world'))

                expect(mock1).toBeCalledTimes(0)
                expect(mock2).toBeCalledTimes(1)
                expect(mock2).lastCalledWith('world')
                expect(mock3).toBeCalledTimes(0)

                dispose1()
                dispose2()
                dispose3()
            })

            it('mock should not to be called because it removed through .off(ev, li) method', () => {
                const mock = jest.fn()
                context1.on(TestEvent, mock)
                context1.off(TestEvent, mock)
                context2.dispatch(new TestEvent('world'))

                expect(mock).toBeCalledTimes(0)
            })

            it('all mocks should not to be called because they removed through .off(ev) method', () => {
                const mock1 = jest.fn()
                const mock2 = jest.fn()
                context1.on(TestEvent, mock1)
                context1.on(TestEvent, mock2)
                context1.off(TestEvent)
                context2.dispatch(new TestEvent('world'))

                expect(mock1).toBeCalledTimes(0)
                expect(mock2).toBeCalledTimes(0)
            })
        })
    })

    describe('Defer', () => {
        const delay = <T>(t: number) => new Promise<T>((r) => setTimeout(r, t))

        it(`should trigger context.update`, async () => {
            const container = document.createElement('div')

            function* Root(this: Context) {
                this.defer(() => delay(300))
                yield 'Hello'
                yield 'World'
            }

            render(component(Root, '', undefined, undefined), container)

            expect(container.innerHTML).toBe('Hello')

            await delay(400)

            expect(container.innerHTML).toBe('World')
        })

        it(`should return {done, value}`, async () => {
            const mock = jest.fn()

            function* Root(this: Context) {
                const result = this.defer(() => new Promise((r) => setTimeout(() => r('World'), 300)))

                mock(result)
                yield 1

                mock(result)
                yield 2
            }

            render(component(Root, '', undefined, undefined))

            expect(mock.mock.calls[0][0]).toEqual({ done: false })

            await delay(400)

            expect(mock.mock.calls[1][0]).toEqual({ done: true, value: 'World' })
        })

        it(`should serve scopes`, async () => {
            const container = document.createElement('div')

            function* Root(this: Context) {
                // this
                //                      and this
                // is
                //                      is
                // sync
                //                      async
                // flow
                //                      flow
                //
                let str = ''
                str += 'this '
                this.defer(async () => delay(0).then(() => (str += 'and this ')))
                str += 'is '
                this.defer(async () => delay(0).then(() => (str += 'is ')))
                str += 'sync '
                this.defer(async () => delay(0).then(() => (str += 'async ')))
                str += 'flow '
                this.defer(async () => delay(0).then(() => (str += 'flow ')))

                const result = this.defer(async () => str)

                yield str
                yield result.value as string
            }

            render(component(Root, '', undefined, undefined), container)

            expect(container.innerHTML).toBe('this is sync flow ')

            await delay(400)

            expect(container.innerHTML).toBe('this is sync flow and this is async flow ')
        })

        it(`should preserves the order of scopes`, async () => {
            const container = document.createElement('div')

            let a0: string, a1: string, a2: string, a3: string
            let b0: string, b1: string, b2: string, b3: string

            function* Root(this: Context) {
                let str = ''

                a0 = str += 'this '
                this.defer(async () => delay(0).then(() => (b0 = str += 'and this ')))
                a1 = str += 'is '
                this.defer(async () => delay(0).then(() => (b1 = str += 'is ')))
                a2 = str += 'sync '
                this.defer(async () => delay(0).then(() => (b2 = str += 'async ')))
                a3 = str += 'flow '
                this.defer(async () => delay(0).then(() => (b3 = str += 'flow ')))

                yield str
                yield str
            }

            render(component(Root, '', undefined, undefined), container)

            expect(container.innerHTML).toBe('this is sync flow ')

            await new Promise((r) => setTimeout(r, 100))

            expect(a0!).toBe('this ')
            expect(a1!).toBe('this is ')
            expect(a2!).toBe('this is sync ')
            expect(a3!).toBe('this is sync flow ')
            expect(b0!).toBe('this is sync flow and this ')
            expect(b1!).toBe('this is sync flow and this is ')
            expect(b2!).toBe('this is sync flow and this is async ')
            expect(b3!).toBe('this is sync flow and this is async flow ')
            expect(container.innerHTML).toBe('this is sync flow and this is async flow ')
        })
    })
})
