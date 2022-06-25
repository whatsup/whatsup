/**
 * @jest-environment jsdom
 */
import { ReconcileMap } from '../src/reconcile_map'

function uid() {
    return (~~(Math.random() * 1e8)).toString(16)
}

function createElement() {
    return document.createElement('div')
}

function createText() {
    return document.createTextNode('')
}

describe('Reconcile map', function () {
    const reconcileMap = new ReconcileMap()
    const element = createElement()
    const elementReconcileId = uid()
    const array = [createElement(), createElement()]
    const arrayReconcileId = uid()
    const textNode = createText()
    const renderedItem = createElement()

    it('should add reconcilable item', () => {
        reconcileMap.addReconcilable(elementReconcileId, element)

        expect(reconcileMap['tracker'].has(element)).toBeTruthy()
        expect(reconcileMap['queueMap'].get(elementReconcileId)['items'][0]).toBe(element)
    })

    it('should give next reconcilable element', () => {
        expect(reconcileMap.nextReconcilable(elementReconcileId)).toBe(element)
        expect(reconcileMap['tracker'].has(element)).toBeFalsy()
    })

    it('should add reconcilable elements array', () => {
        reconcileMap.addReconcilable(arrayReconcileId, array)

        expect(reconcileMap['tracker'].has(array)).toBeTruthy()
        expect(reconcileMap['queueMap'].get(arrayReconcileId)['items'][0]).toBe(array)
    })

    it('should give next reconcilable elements array', () => {
        expect(reconcileMap.nextReconcilable(arrayReconcileId)).toBe(array)
        expect(reconcileMap['tracker'].has(array)).toBeFalsy()
    })

    it('should add reconcilable text node', () => {
        reconcileMap.addReconcilableTextNode(textNode)
        expect(reconcileMap['tracker'].has(textNode)).toBeTruthy()
    })

    it('should give next reconcilable text node', () => {
        expect(reconcileMap.nextReconcilableTextNode()).toBe(textNode)
        expect(reconcileMap['tracker'].has(textNode)).toBeFalsy()
    })

    it('should add rendered', () => {
        reconcileMap.addRendered(renderedItem)
        expect(reconcileMap['tracker'].has(renderedItem)).toBeTruthy()
    })

    it('should delete rendered', () => {
        reconcileMap.deleteRendered(renderedItem)
        expect(reconcileMap['tracker'].has(renderedItem)).toBeFalsy()
    })

    it('should return undefined when next not exists', () => {
        expect(reconcileMap.nextReconcilable(elementReconcileId)).toBeUndefined()
        expect(reconcileMap.nextReconcilableTextNode()).toBeUndefined()
    })

    it('should return undefined when reconcileId not exists', () => {
        expect(reconcileMap.nextReconcilable('Unknown reconcileId')).toBeUndefined()
    })

    it('should iterate unused elements (variant one)', () => {
        reconcileMap.addReconcilable(elementReconcileId, element)
        reconcileMap.addReconcilable(arrayReconcileId, array)
        reconcileMap.addReconcilableTextNode(textNode)
        reconcileMap.addRendered(renderedItem)

        reconcileMap.nextReconcilable(arrayReconcileId)
        reconcileMap.deleteRendered(renderedItem)

        const iterator = reconcileMap.elements()

        expect(iterator.next().value).toBe(element)
        expect(iterator.next().value).toBe(textNode)
    })

    it('should iterate unused elements (variant two)', () => {
        reconcileMap.addReconcilable(elementReconcileId, element)
        reconcileMap.addReconcilable(arrayReconcileId, array)
        reconcileMap.addReconcilableTextNode(textNode)
        reconcileMap.addRendered(renderedItem)

        reconcileMap.nextReconcilable(elementReconcileId)
        reconcileMap.nextReconcilableTextNode()

        const iterator = reconcileMap.elements()

        expect(iterator.next().value).toBe(array[0])
        expect(iterator.next().value).toBe(array[1])
        expect(iterator.next().value).toBe(renderedItem)
    })
})
