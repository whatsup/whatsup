// import { Atom } from './atom'
// import { Context } from './context'
// import { Stream } from './stream'

// export abstract class Atomizer<T> {
//     abstract get(consumer: Atom): Atom

//     protected readonly stream: Stream<T>
//     protected readonly parentContext: Context | null

//     constructor(stream: Stream<T>, parentContext: Context | null = null) {
//         this.stream = stream
//         this.parentContext = parentContext
//     }
// }

// export class ExclusiveAtomizer<T> extends Atomizer<T> {
//     private readonly atoms = new WeakMap<Atom, Atom>()

//     get(consumer: Atom) {
//         if (!this.atoms.has(consumer)) {
//             const parentContext = this.parentContext || consumer.getContext()
//             const atom = new Atom(this.stream, parentContext)

//             this.atoms.set(consumer, atom)
//         }

//         return this.atoms.get(consumer)!
//     }
// }

// export class CommunalAtomizer<T> extends Atomizer<T> {
//     private atom!: Atom<T>

//     get() {
//         if (!this.atom) {
//             this.atom = new Atom(this.stream)
//         }
//         return this.atom
//     }
// }
