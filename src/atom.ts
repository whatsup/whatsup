import { StreamIterator, Stream, Delegation, StreamGeneratorFunc } from './stream'
import { Context } from './context'
import { Dependencies } from './dependencies'
import { InitCommand } from './query'
import { Mutator } from './mutator'
import { SCHEDULER } from './scheduler'
import { Err, Data } from './result'
import { Stack } from './stack'
import { ActorGenerator } from './actor'

export class Atom<T = any> {
    readonly stream: Stream<T>
    readonly context: Context
    private readonly stack: Stack<StreamIterator<T>>
    private readonly consumers: Set<Atom>
    private readonly dependencies: Dependencies
    // private readonly delegations: WeakMap<Stream<any>, Delegation<T>>
    private readonly atomizer: Atomizer
    private cache: Err | Data<T | Delegation<T>> | undefined

    constructor(stream: Stream<T>, parentContext: Context | null = null) {
        this.stream = stream
        this.context = new Context(this, parentContext)
        this.consumers = new Set()
        this.stack = new Stack()
        this.dependencies = new Dependencies(this)
        //this.delegations = new WeakMap()
        this.atomizer = new Atomizer(this)
    }

    addConsumer(consumer: Atom) {
        this.consumers.add(consumer)
    }

    getConsumers() {
        return this.consumers
    }

    getContext() {
        return this.context
    }

    getCache() {
        return this.cache
    }

    getCacheValue() {
        return this.cache && this.cache.value
    }

    update() {
        SCHEDULER.run((transaction) => transaction.add(this))
    }

    exec<U, A>(generator: ActorGenerator<U, A>, arg: A): Data<U | Delegation<U>> | Err {
        const { context, stream } = this
        const stack = new Stack<StreamIterator<U>>()

        stack.push(generator.call(stream, context, arg))

        let input: any

        while (true) {
            try {
                const { done, value } = stack.last.next(input)

                if (done) {
                    stack.pop()

                    if (!stack.empty) {
                        input = value
                        continue
                    }
                } else if (value instanceof InitCommand) {
                    const { stream, multi } = value
                    const atom = this.atomizer.get(stream, multi)

                    input = atom.exec(function (ctx: Context) {
                        return atom.stream.whatsUp(ctx)
                    }, null)
                    continue
                }

                const data = this.prepareNewData(value as any)

                return new Data(data as any)

                // if (value instanceof InitCommand) {
                //     input = this
                //     continue
                // }
                // if (value instanceof Atom) {
                //     const { stream } = value

                //     const cache = value.exec(function* () {
                //         const iterator = stream.iterate(context)
                //         let input: any

                //         while (true) {
                //             const { done, value } = iterator.next(input)

                //             if (done) {
                //                 return value
                //             }
                //             if (value instanceof Command || value instanceof Atom) {
                //                 input = yield value
                //                 continue
                //             }

                //             return value
                //         }
                //     }, null)

                //     if (cache.value instanceof Delegation) {
                //         stack.push(
                //             function* () {
                //                 try {
                //                     const result = yield* cache.value

                //                     return new Data(result) as any
                //                 } catch (result) {
                //                     return new Err(result) as any
                //                 }
                //             }.call(undefined)
                //         )
                //         input = undefined
                //     } else {
                //         input = cache
                //     }

                //     continue
                // }

                throw 'Unknown value'
            } catch (error) {
                return new Err(error)
            }
        }
    }

    dispose(initiator?: Atom) {
        if (initiator) {
            this.consumers.delete(initiator)
        }
        if (this.consumers.size === 0) {
            this.cache = undefined
            this.context.dispose()
            this.dependencies.dispose()

            while (!this.stack.empty) {
                this.stack.pop()!.return!()
            }
        }
    }

    // *[Symbol.iterator](): Generator<never, T, any> {
    //     //        this is ^^^^^^^^^^^^^^^^^^^^^^^^ for better type inference
    //     //        really is Generator<this | Query, T, any>
    //     const result = (yield this as never) as Result

    //     if (result instanceof Err) {
    //         throw result.value
    //     }

    //     return result.value
    // }

    lazyBuild() {
        if (!this.cache) {
            this.rebuild()
        }
        return this.cache
    }

    rebuild() {
        this.cache = this.build(function (this: Stream<any>, ctx: Context) {
            return this.whatsUp(ctx)
        })
    }

    build(generator: StreamGeneratorFunc<T>): Err | Data<T | Delegation<T>> {
        const { stack, dependencies, context, stream } = this

        dependencies.swap()

        if (stack.empty) {
            stack.push(generator.call(stream, context) as StreamIterator<T>)
        }

        let input: any
        let result: Err | Data<T | Delegation<T>>

        while (true) {
            try {
                const { done, value } = stack.last.next(input)

                if (done) {
                    stack.pop()

                    if (!stack.empty) {
                        input = value
                        continue
                    }
                } else if (value instanceof InitCommand) {
                    const { stream, multi } = value
                    const atom = this.atomizer.get(stream, multi)

                    dependencies.add(atom)
                    atom.consumers.add(this)

                    input = atom.lazyBuild()
                    continue
                }

                const data = this.prepareNewData(value as T)
                result = new Data(data)
            } catch (error) {
                stack.pop()
                result = new Err(error)
            }

            dependencies.disposeUnused()

            return result
        }
    }

    private prepareNewData(value: T): T | Delegation<T> {
        if (value instanceof Mutator) {
            const oldValue = this.getCacheValue()
            const newValue = value.mutate(oldValue) as T
            return newValue
        }

        // if (value instanceof Stream && this.stream instanceof DelegatingStream) {
        //     return this.getDelegation(value)
        // }

        return value
    }

    // private getDelegation(stream: Stream<any>) {
    //     if (!this.delegations.has(stream)) {
    //         const delegation = new Delegation(stream, this.context)
    //         this.delegations.set(stream, delegation)
    //     }
    //     return this.delegations.get(stream)!
    // }
}

const Atoms = new WeakMap<Stream<any>, Atom>()

// export function createAtom(stream: Stream<any>, parentContext: Context | null){
//     const atom = new Atom(stream, parentContext)
//     Atoms.
// }

class Atomizer {
    static readonly multiMap = new WeakMap<Stream<any>, Atom>()

    private readonly root: Atom
    private readonly multiMap: WeakMap<Stream<any>, Atom>
    // private atom?: Atom

    constructor(root: Atom) {
        this.root = root
        this.multiMap = new WeakMap()
    }

    get(stream: Stream<any>, multi: boolean): Atom {
        //const consumer = this.getConsumer(stream)

        if (multi) {
            if (!this.multiMap.has(stream)) {
                const atom = new Atom(stream, this.root.context)
                this.multiMap.set(stream, atom)
            }

            return this.multiMap.get(stream)! //.atomizer.get(stream, false)

            //return atom.atomizer.multiGet(stream).getConsumer(stream)
        }

        //return consumer

        if (!Atomizer.multiMap.has(stream)) {
            Atomizer.multiMap.set(stream, new Atom(stream, null))
        }

        return Atomizer.multiMap.get(stream)!
    }

    // getAtom() {
    //     if (!this.atom) {
    //         this.atom = new Atom(this.root.stream, null)
    //     }
    // }

    getConsumer(stream: Stream<any>) {
        if (!Atoms.has(stream)) {
            Atoms.set(stream, new Atom(stream, null))
        }
        return Atoms.get(stream)!
    }

    // multiGet(atom: Atom) {
    //     if (!this.multiMap.has(atom)) {
    //         this.multiMap.set(atom, new Atomizer(this.root))
    //     }

    //     return this.multiMap.get(atom)!
    // }
}

/*
мы пишем код наколенке
а + б + в + 
а потом начиначем его переоформлять в нормальный вид
но у нас же есть аст - давайте его превратим в хеш
давайте кормить такими хешами нейросеть 
так чтобы на выходе она переименоавывала переменные
а,б, с0, x, y и т.д. в приемлемо читаемые имена
на свой вкус, и предлагает нам, а мы оцениваем это
например смайлами по трехбальной шкале
мы используем переименование символов в vscode как апи
для задания правильных названий, нейросеть высчитывает 
новый хеш и сопоставляет с полученным



ЖИЗНЕННЫЙ ЦИКЛ ПОТОКА
- мы создаем поток
- пишем данные в поток
- читаем данные пока они нам нужны
- закрываем поток

- yield - тут мы плюем в колодец
- yield* - а тут фонтан истины

ЧИСТАЯ СЕТЬ


Whats up Pretty!?

- ast - это дерево причин
    - мы описываем дерево причин (дерево потоков)
      в надедже получить ответы (yield*)
    = всегда возвращает хеш - на каждом уровне
      берется атом делается yield* значения 
      там все равно рано или поздно примитив или обещание
      атом спрятан за прокси - прокси делает
      каждое свойство атома причиной 
      атомы не нужно определять вручную

     
        class Stream {}
        class MonoStream extends Stream {
        }
        class MultiStream extends Stream {
            *[Symbol.iterator](){
                super({multi: true})
            }
        }
        
        class Conse ...
        class Cause ...
        class String extends Cause<string> {
            constructor(value = ''){
                super(value)
            }
        }
        class String extends Cause<number> {
            constructor(value = 0){
                super(value)
            }
        }

        type NodeSym = Symbol

        class Node<T extends Stream> {
            readonly map = new WeakMap<string, Conse<Node>>() 

            constructor(streamCtor: new (node: this)=> T){
                return new Proxy(this, new streamCtor(this))
            }

            get(target: Stream, key: string, receiver: Proxy){
                if(key === Symbol.iterator){
                    return ()=> this[Symbol.iterator]()
                }
                if(Refect.has(target, key, receiver)){
                    return Refect.get(target, key, receiver)
                }else{
                    if(Refect.has(this, key, receiver)){
                        return Refect.get(this, key, receiver)
                    }
                    if(!this.map.has(key)){
                        this.map.set(key, new Conse())
                    }
                    return this.map.get(key).get()
                }

                return undefined
            }

            set<T>(target: Stream, key: string, value: T,  receiver: Proxy){ 
                    if(!this.map.has(key)){
                        this.map.set(key, new Conse(value))
                        return
                    }
                    this.map.get(key).set(value) 
                }
                return undefined
            }
        }

        class NodeConse extends Conse<string> {
            constructor(value: T){
                return new Proxy(this, new streamCtor(this))
            }
        }

        class Name extends Conse<string>{}
        class Age extends Conse<number>{}

        class User extends Conse<{name: string: age: number}>{
            readonly name: Node<Name>
            readonly age: Node<Age>

            *whatsUp(ctx: Context){
                while(true){
                    yield {
                        name: yield* this.name
                        age: yield* this.age
                    }
                }
            }
        }

        // Создаем
        cosnt user = new Node(User)

        // Пишем
        user.name.mem('John')   // mem начинаем траназакцию 
        user.age.mem(33)        // или продолжаем существующую
        user.city.run('Moskow') // а потом запускаем (без обертывания, но нужно не забывать run)
        
        // Читаем
        whatsUp(User, (v)=> console.log(v))

        > {
            name: 'John',
            age: 33
        }

        
        под капотом ставится таймер и начинает транзакция
        если она выполнилась таймер отменяется
        иначе насильно завершает транзакцию через заданое время выкидавает throw 'не определен run'


        class Text extends Conse<string>{}

        class Program extends Conse<string>{
            readonly text: Node<Text> 

            *whatsUp(ctx: Context){
                while(true){
                    yield yield* this.text
                }
            }
        }

        const program = new Node(Program)

        program.text = 'Hello World'

        whatsUp(program, (v)=> console.log(v))

        > Hello World

        --------

        new Node(Program) - создает живую ноду (атом)
        new Program() - создает поток Conse 
    


- если нет сопоставления 
    - просто запоминаем значение ast
- если есть сопоставления предагаем варианты (alt-tab по умолчанию)
    1.  - делаем выборку сопоставлений
        - сортируем по рейтингу
        - делаем рандомную единичную выборку
        - применяем(выборку сразу к коду), ждем реакции
    2.  - делаем выборку сопоставлений
        - сортируем по рейтингу
        - делаем рандомную ограниченую выборку (5 варинтов по умолчанию)
        - создаем новый поток попап(выборка) 
        - применяем(поток), ждем реакции
        - показывается попап - ждемы выбора варианта
- если нажат смайл - обрабатываем:
    - плюс - прибавляем 5% рейтинга
    - норм - оставляем 100% рейтинга
    - минус - отнимаем 33% рейтинга
        - предлагаем вернуться к старому или выбрать следующее форматирование
        - или остаться на новом (+10% рейтинга - реабилитация)



говорит команду 
- инициализируй меня (передает себя)
- мы инициализируем 

*/
