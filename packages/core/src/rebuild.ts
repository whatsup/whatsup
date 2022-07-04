import { Atom } from './atom'
import { transaction } from './scheduler'

export const rebuild = <T>(atom: Atom<T>): void => {
    transaction((t) => t.addEntry(atom))
}
