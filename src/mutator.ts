
export abstract class Mutator<T> {
    abstract mutate(prev?: T): T
}