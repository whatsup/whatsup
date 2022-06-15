// Based on type definitions for React 16.9
// Thanks react team

import * as CSS from 'csstype'
import { Atom } from 'whatsup'
import { Context } from './context'
import { JsxMutator } from './mutator'
import { ReconcileMap } from './reconcile_map'

type Booleanish = boolean | 'true' | 'false'

//
// Events
// ----------------------------------------------------------------------

export namespace WhatsJSX {
    export interface Event<T = Element> {
        readonly AT_TARGET: number
        readonly BUBBLING_PHASE: number
        readonly CAPTURING_PHASE: number
        readonly NONE: number
        readonly bubbles: boolean
        readonly cancelable: boolean
        readonly composed: boolean
        readonly currentTarget: EventTarget & T
        readonly defaultPrevented: boolean
        readonly eventPhase: number
        readonly isTrusted: boolean
        readonly target: EventTarget
        readonly timeStamp: number
        readonly type: string
        cancelBubble: boolean
        returnValue: boolean
        composedPath(): EventTarget[]
        initEvent(type: string, bubbles?: boolean, cancelable?: boolean): void
        preventDefault(): void
        stopImmediatePropagation(): void
        stopPropagation(): void
    }

    export interface ClipboardEvent<T = Element> extends Event<T> {
        clipboardData: DataTransfer
    }

    export interface CompositionEvent<T = Element> extends Event<T> {
        data: string
    }

    export interface DragEvent<T = Element> extends MouseEvent<T> {
        dataTransfer: DataTransfer
    }

    export interface PointerEvent<T = Element> extends MouseEvent<T> {
        pointerId: number
        pressure: number
        tangentialPressure: number
        tiltX: number
        tiltY: number
        twist: number
        width: number
        height: number
        pointerType: 'mouse' | 'pen' | 'touch'
        isPrimary: boolean
    }

    export interface FocusEvent<T = Element> extends Event<T> {
        relatedTarget: EventTarget | null
        target: EventTarget & T
    }

    export interface FormEvent<T = Element> extends Event<T> {}

    export interface InvalidEvent<T = Element> extends Event<T> {
        target: EventTarget & T
    }

    export interface ChangeEvent<T = Element> extends Event<T> {
        target: EventTarget & T
    }

    export interface InputEvent<T = Element> extends Event<T> {
        target: EventTarget & T
    }

    export interface KeyboardEvent<T = Element> extends Event<T> {
        altKey: boolean
        charCode: number
        ctrlKey: boolean
        /**
         * See [DOM Level 3 Events spec](https://www.w3.org/TR/uievents-key/#keys-modifier). for a list of valid (case-sensitive) arguments to this method.
         */
        getModifierState(key: string): boolean
        /**
         * See the [DOM Level 3 Events spec](https://www.w3.org/TR/uievents-key/#named-key-attribute-values). for possible values
         */
        key: string
        keyCode: number
        locale: string
        location: number
        metaKey: boolean
        repeat: boolean
        shiftKey: boolean
        /** @deprecated */
        which: number
    }

    export interface MouseEvent<T = Element> extends UIEvent<T> {
        altKey: boolean
        button: number
        buttons: number
        clientX: number
        clientY: number
        ctrlKey: boolean
        /**
         * See [DOM Level 3 Events spec](https://www.w3.org/TR/uievents-key/#keys-modifier). for a list of valid (case-sensitive) arguments to this method.
         */
        getModifierState(key: string): boolean
        metaKey: boolean
        movementX: number
        movementY: number
        pageX: number
        pageY: number
        relatedTarget: EventTarget | null
        screenX: number
        screenY: number
        shiftKey: boolean
    }

    export interface TouchEvent<T = Element> extends UIEvent<T> {
        altKey: boolean
        changedTouches: TouchList
        ctrlKey: boolean
        /**
         * See [DOM Level 3 Events spec](https://www.w3.org/TR/uievents-key/#keys-modifier). for a list of valid (case-sensitive) arguments to this method.
         */
        getModifierState(key: string): boolean
        metaKey: boolean
        shiftKey: boolean
        targetTouches: TouchList
        touches: TouchList
    }

    export interface UIEvent<T = Element> extends Event<T> {
        detail: number
        view: Window | null
    }

    export interface WheelEvent<T = Element> extends MouseEvent<T> {
        deltaMode: number
        deltaX: number
        deltaY: number
        deltaZ: number
    }

    export interface AnimationEvent<T = Element> extends Event<T> {
        animationName: string
        elapsedTime: number
        pseudoElement: string
    }

    export interface TransitionEvent<T = Element> extends Event<T> {
        elapsedTime: number
        propertyName: string
        pseudoElement: string
    }

    //
    // Event Handler Types
    // ----------------------------------------------------------------------

    export type EventHandler<E extends Event<any>> = { bivarianceHack(event: E): void }['bivarianceHack']

    type SimpleEventHandler<T = Element> = EventHandler<Event<T>>
    type ClipboardEventHandler<T = Element> = EventHandler<ClipboardEvent<T>>
    type CompositionEventHandler<T = Element> = EventHandler<CompositionEvent<T>>
    type DragEventHandler<T = Element> = EventHandler<DragEvent<T>>
    type FocusEventHandler<T = Element> = EventHandler<FocusEvent<T>>
    type FormEventHandler<T = Element> = EventHandler<FormEvent<T>>
    type ChangeEventHandler<T = Element> = EventHandler<ChangeEvent<T>>
    type InputEventHandler<T = Element> = EventHandler<InputEvent<T>>
    type KeyboardEventHandler<T = Element> = EventHandler<KeyboardEvent<T>>
    type MouseEventHandler<T = Element> = EventHandler<MouseEvent<T>>
    type TouchEventHandler<T = Element> = EventHandler<TouchEvent<T>>
    type PointerEventHandler<T = Element> = EventHandler<PointerEvent<T>>
    type UIEventHandler<T = Element> = EventHandler<UIEvent<T>>
    type WheelEventHandler<T = Element> = EventHandler<WheelEvent<T>>
    type AnimationEventHandler<T = Element> = EventHandler<AnimationEvent<T>>
    type TransitionEventHandler<T = Element> = EventHandler<TransitionEvent<T>>

    //
    // Event Attributes
    // ----------------------------------------------------------------------

    export interface EventAttributes<T> {
        // Clipboard Events
        onCopy?: ClipboardEventHandler<T>
        onCopyCapture?: ClipboardEventHandler<T>
        onCut?: ClipboardEventHandler<T>
        onCutCapture?: ClipboardEventHandler<T>
        onPaste?: ClipboardEventHandler<T>
        onPasteCapture?: ClipboardEventHandler<T>

        // Composition Events
        onCompositionEnd?: CompositionEventHandler<T>
        onCompositionEndCapture?: CompositionEventHandler<T>
        onCompositionStart?: CompositionEventHandler<T>
        onCompositionStartCapture?: CompositionEventHandler<T>
        onCompositionUpdate?: CompositionEventHandler<T>
        onCompositionUpdateCapture?: CompositionEventHandler<T>

        // Focus Events
        onFocus?: FocusEventHandler<T>
        onFocusCapture?: FocusEventHandler<T>
        onBlur?: FocusEventHandler<T>
        onBlurCapture?: FocusEventHandler<T>

        // Form Events
        onChange?: FormEventHandler<T>
        onChangeCapture?: FormEventHandler<T>
        onBeforeInput?: FormEventHandler<T>
        onBeforeInputCapture?: FormEventHandler<T>
        onInput?: FormEventHandler<T>
        onInputCapture?: FormEventHandler<T>
        onReset?: FormEventHandler<T>
        onResetCapture?: FormEventHandler<T>
        onSubmit?: FormEventHandler<T>
        onSubmitCapture?: FormEventHandler<T>
        onInvalid?: FormEventHandler<T>
        onInvalidCapture?: FormEventHandler<T>

        // Image Events
        onLoad?: SimpleEventHandler<T>
        onLoadCapture?: SimpleEventHandler<T>
        onError?: SimpleEventHandler<T>
        onErrorCapture?: SimpleEventHandler<T>

        // Keyboard Events
        onKeyDown?: KeyboardEventHandler<T>
        onKeyDownCapture?: KeyboardEventHandler<T>
        onKeyPress?: KeyboardEventHandler<T>
        onKeyPressCapture?: KeyboardEventHandler<T>
        onKeyUp?: KeyboardEventHandler<T>
        onKeyUpCapture?: KeyboardEventHandler<T>

        // Media Events
        onAbort?: SimpleEventHandler<T>
        onAbortCapture?: SimpleEventHandler<T>
        onCanPlay?: SimpleEventHandler<T>
        onCanPlayCapture?: SimpleEventHandler<T>
        onCanPlayThrough?: SimpleEventHandler<T>
        onCanPlayThroughCapture?: SimpleEventHandler<T>
        onDurationChange?: SimpleEventHandler<T>
        onDurationChangeCapture?: SimpleEventHandler<T>
        onEmptied?: SimpleEventHandler<T>
        onEmptiedCapture?: SimpleEventHandler<T>
        onEncrypted?: SimpleEventHandler<T>
        onEncryptedCapture?: SimpleEventHandler<T>
        onEnded?: SimpleEventHandler<T>
        onEndedCapture?: SimpleEventHandler<T>
        onLoadedData?: SimpleEventHandler<T>
        onLoadedDataCapture?: SimpleEventHandler<T>
        onLoadedMetadata?: SimpleEventHandler<T>
        onLoadedMetadataCapture?: SimpleEventHandler<T>
        onLoadStart?: SimpleEventHandler<T>
        onLoadStartCapture?: SimpleEventHandler<T>
        onPause?: SimpleEventHandler<T>
        onPauseCapture?: SimpleEventHandler<T>
        onPlay?: SimpleEventHandler<T>
        onPlayCapture?: SimpleEventHandler<T>
        onPlaying?: SimpleEventHandler<T>
        onPlayingCapture?: SimpleEventHandler<T>
        onProgress?: SimpleEventHandler<T>
        onProgressCapture?: SimpleEventHandler<T>
        onRateChange?: SimpleEventHandler<T>
        onRateChangeCapture?: SimpleEventHandler<T>
        onSeeked?: SimpleEventHandler<T>
        onSeekedCapture?: SimpleEventHandler<T>
        onSeeking?: SimpleEventHandler<T>
        onSeekingCapture?: SimpleEventHandler<T>
        onStalled?: SimpleEventHandler<T>
        onStalledCapture?: SimpleEventHandler<T>
        onSuspend?: SimpleEventHandler<T>
        onSuspendCapture?: SimpleEventHandler<T>
        onTimeUpdate?: SimpleEventHandler<T>
        onTimeUpdateCapture?: SimpleEventHandler<T>
        onVolumeChange?: SimpleEventHandler<T>
        onVolumeChangeCapture?: SimpleEventHandler<T>
        onWaiting?: SimpleEventHandler<T>
        onWaitingCapture?: SimpleEventHandler<T>

        // MouseEvents
        onAuxClick?: MouseEventHandler<T>
        onAuxClickCapture?: MouseEventHandler<T>
        onClick?: MouseEventHandler<T>
        onClickCapture?: MouseEventHandler<T>
        onContextMenu?: MouseEventHandler<T>
        onContextMenuCapture?: MouseEventHandler<T>
        onDblClick?: MouseEventHandler<T>
        onDblClickCapture?: MouseEventHandler<T>
        onDrag?: DragEventHandler<T>
        onDragCapture?: DragEventHandler<T>
        onDragEnd?: DragEventHandler<T>
        onDragEndCapture?: DragEventHandler<T>
        onDragEnter?: DragEventHandler<T>
        onDragEnterCapture?: DragEventHandler<T>
        onDragExit?: DragEventHandler<T>
        onDragExitCapture?: DragEventHandler<T>
        onDragLeave?: DragEventHandler<T>
        onDragLeaveCapture?: DragEventHandler<T>
        onDragOver?: DragEventHandler<T>
        onDragOverCapture?: DragEventHandler<T>
        onDragStart?: DragEventHandler<T>
        onDragStartCapture?: DragEventHandler<T>
        onDrop?: DragEventHandler<T>
        onDropCapture?: DragEventHandler<T>
        onMouseDown?: MouseEventHandler<T>
        onMouseDownCapture?: MouseEventHandler<T>
        onMouseEnter?: MouseEventHandler<T>
        onMouseLeave?: MouseEventHandler<T>
        onMouseMove?: MouseEventHandler<T>
        onMouseMoveCapture?: MouseEventHandler<T>
        onMouseOut?: MouseEventHandler<T>
        onMouseOutCapture?: MouseEventHandler<T>
        onMouseOver?: MouseEventHandler<T>
        onMouseOverCapture?: MouseEventHandler<T>
        onMouseUp?: MouseEventHandler<T>
        onMouseUpCapture?: MouseEventHandler<T>

        // Selection Events
        onSelect?: SimpleEventHandler<T>
        onSelectCapture?: SimpleEventHandler<T>

        // Touch Events
        onTouchCancel?: TouchEventHandler<T>
        onTouchCancelCapture?: TouchEventHandler<T>
        onTouchEnd?: TouchEventHandler<T>
        onTouchEndCapture?: TouchEventHandler<T>
        onTouchMove?: TouchEventHandler<T>
        onTouchMoveCapture?: TouchEventHandler<T>
        onTouchStart?: TouchEventHandler<T>
        onTouchStartCapture?: TouchEventHandler<T>

        // Pointer Events
        onPointerDown?: PointerEventHandler<T>
        onPointerDownCapture?: PointerEventHandler<T>
        onPointerMove?: PointerEventHandler<T>
        onPointerMoveCapture?: PointerEventHandler<T>
        onPointerUp?: PointerEventHandler<T>
        onPointerUpCapture?: PointerEventHandler<T>
        onPointerCancel?: PointerEventHandler<T>
        onPointerCancelCapture?: PointerEventHandler<T>
        onPointerEnter?: PointerEventHandler<T>
        onPointerEnterCapture?: PointerEventHandler<T>
        onPointerLeave?: PointerEventHandler<T>
        onPointerLeaveCapture?: PointerEventHandler<T>
        onPointerOver?: PointerEventHandler<T>
        onPointerOverCapture?: PointerEventHandler<T>
        onPointerOut?: PointerEventHandler<T>
        onPointerOutCapture?: PointerEventHandler<T>
        onGotPointerCapture?: PointerEventHandler<T>
        onGotPointerCaptureCapture?: PointerEventHandler<T>
        onLostPointerCapture?: PointerEventHandler<T>
        onLostPointerCaptureCapture?: PointerEventHandler<T>

        // UI Events
        onScroll?: UIEventHandler<T>
        onScrollCapture?: UIEventHandler<T>

        // Wheel Events
        onWheel?: WheelEventHandler<T>
        onWheelCapture?: WheelEventHandler<T>

        // Animation Events
        onAnimationStart?: AnimationEventHandler<T>
        onAnimationStartCapture?: AnimationEventHandler<T>
        onAnimationEnd?: AnimationEventHandler<T>
        onAnimationEndCapture?: AnimationEventHandler<T>
        onAnimationIteration?: AnimationEventHandler<T>
        onAnimationIterationCapture?: AnimationEventHandler<T>

        // Transition Events
        onTransitionEnd?: TransitionEventHandler<T>
        onTransitionEndCapture?: TransitionEventHandler<T>
    }

    export interface CSSProperties extends CSS.Properties<string | number, string> {}

    // All the WAI-ARIA 1.1 attributes from https://www.w3.org/TR/wai-aria-1.1/
    export interface AriaAttributes {
        /** Identifies the currently active element when DOM focus is on a composite widget, textbox, group, or application. */
        ariaActivedescendant?: string
        /** Indicates whether assistive technologies will present all, or only parts of, the changed region based on the change notifications defined by the aria-relevant attribute. */
        ariaAtomic?: boolean | 'false' | 'true'
        /**
         * Indicates whether inputting text could trigger display of one or more predictions of the user's intended value for an input and specifies how predictions would be
         * presented if they are made.
         */
        ariaAutocomplete?: 'none' | 'inline' | 'list' | 'both'
        /** Indicates an element is being modified and that assistive technologies MAY want to wait until the modifications are complete before exposing them to the user. */
        ariaBusy?: boolean | 'false' | 'true'
        /**
         * Indicates the current "checked" state of checkboxes, radio buttons, and other widgets.
         * @see aria-pressed @see aria-selected.
         */
        ariaChecked?: boolean | 'false' | 'mixed' | 'true'
        /**
         * Defines the total number of columns in a table, grid, or treegrid.
         * @see aria-colindex.
         */
        ariaColcount?: number
        /**
         * Defines an element's column index or position with respect to the total number of columns within a table, grid, or treegrid.
         * @see aria-colcount @see aria-colspan.
         */
        ariaColindex?: number
        /**
         * Defines the number of columns spanned by a cell or gridcell within a table, grid, or treegrid.
         * @see aria-colindex @see aria-rowspan.
         */
        ariaColspan?: number
        /**
         * Identifies the element (or elements) whose contents or presence are controlled by the current element.
         * @see aria-owns.
         */
        ariaControls?: string
        /** Indicates the element that represents the current item within a container or set of related elements. */
        ariaCurrent?: boolean | 'false' | 'true' | 'page' | 'step' | 'location' | 'date' | 'time'
        /**
         * Identifies the element (or elements) that describes the object.
         * @see aria-labelledby
         */
        ariaDescribedby?: string
        /**
         * Identifies the element that provides a detailed, extended description for the object.
         * @see aria-describedby.
         */
        ariaDetails?: string
        /**
         * Indicates that the element is perceivable but disabled, so it is not editable or otherwise operable.
         * @see aria-hidden @see aria-readonly.
         */
        ariaDisabled?: boolean | 'false' | 'true'
        /**
         * Indicates what functions can be performed when a dragged object is released on the drop target.
         * @deprecated in ARIA 1.1
         */
        ariaDropeffect?: 'none' | 'copy' | 'execute' | 'link' | 'move' | 'popup'
        /**
         * Identifies the element that provides an error message for the object.
         * @see aria-invalid @see aria-describedby.
         */
        ariaErrormessage?: string
        /** Indicates whether the element, or another grouping element it controls, is currently expanded or collapsed. */
        ariaExpanded?: boolean | 'false' | 'true'
        /**
         * Identifies the next element (or elements) in an alternate reading order of content which, at the user's discretion,
         * allows assistive technology to override the general default of reading in document source order.
         */
        ariaFlowto?: string
        /**
         * Indicates an element's "grabbed" state in a drag-and-drop operation.
         * @deprecated in ARIA 1.1
         */
        ariaGrabbed?: boolean | 'false' | 'true'
        /** Indicates the availability and type of interactive popup element, such as menu or dialog, that can be triggered by an element. */
        ariaHaspopup?: boolean | 'false' | 'true' | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog'
        /**
         * Indicates whether the element is exposed to an accessibility API.
         * @see aria-disabled.
         */
        ariaHidden?: boolean | 'false' | 'true'
        /**
         * Indicates the entered value does not conform to the format expected by the application.
         * @see aria-errormessage.
         */
        ariaInvalid?: boolean | 'false' | 'true' | 'grammar' | 'spelling'
        /** Indicates keyboard shortcuts that an author has implemented to activate or give focus to an element. */
        ariaKeyshortcuts?: string
        /**
         * Defines a string value that labels the current element.
         * @see aria-labelledby.
         */
        ariaLabel?: string
        /**
         * Identifies the element (or elements) that labels the current element.
         * @see aria-describedby.
         */
        ariaLabelledby?: string
        /** Defines the hierarchical level of an element within a structure. */
        ariaLevel?: number
        /** Indicates that an element will be updated, and describes the types of updates the user agents, assistive technologies, and user can expect from the live region. */
        ariaLive?: 'off' | 'assertive' | 'polite'
        /** Indicates whether an element is modal when displayed. */
        ariaModal?: boolean | 'false' | 'true'
        /** Indicates whether a text box accepts multiple lines of input or only a single line. */
        ariaMultiline?: boolean | 'false' | 'true'
        /** Indicates that the user may select more than one item from the current selectable descendants. */
        ariaMultiselectable?: boolean | 'false' | 'true'
        /** Indicates whether the element's orientation is horizontal, vertical, or unknown/ambiguous. */
        ariaOrientation?: 'horizontal' | 'vertical'
        /**
         * Identifies an element (or elements) in order to define a visual, functional, or contextual parent/child relationship
         * between DOM elements where the DOM hierarchy cannot be used to represent the relationship.
         * @see aria-controls.
         */
        ariaOwns?: string
        /**
         * Defines a short hint (a word or short phrase) intended to aid the user with data entry when the control has no value.
         * A hint could be a sample value or a brief description of the expected format.
         */
        ariaPlaceholder?: string
        /**
         * Defines an element's number or position in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM.
         * @see aria-setsize.
         */
        ariaPosinset?: number
        /**
         * Indicates the current "pressed" state of toggle buttons.
         * @see aria-checked @see aria-selected.
         */
        ariaPressed?: boolean | 'false' | 'mixed' | 'true'
        /**
         * Indicates that the element is not editable, but is otherwise operable.
         * @see aria-disabled.
         */
        ariaReadonly?: boolean | 'false' | 'true'
        /**
         * Indicates what notifications the user agent will trigger when the accessibility tree within a live region is modified.
         * @see aria-atomic.
         */
        ariaRelevant?: 'additions' | 'additions text' | 'all' | 'removals' | 'text'
        /** Indicates that user input is required on the element before a form may be submitted. */
        ariaRequired?: boolean | 'false' | 'true'
        /** Defines a human-readable, author-localized description for the role of an element. */
        ariaRoledescription?: string
        /**
         * Defines the total number of rows in a table, grid, or treegrid.
         * @see aria-rowindex.
         */
        ariaRowcount?: number
        /**
         * Defines an element's row index or position with respect to the total number of rows within a table, grid, or treegrid.
         * @see aria-rowcount @see aria-rowspan.
         */
        ariaRowindex?: number
        /**
         * Defines the number of rows spanned by a cell or gridcell within a table, grid, or treegrid.
         * @see aria-rowindex @see aria-colspan.
         */
        ariaRowspan?: number
        /**
         * Indicates the current "selected" state of various widgets.
         * @see aria-checked @see aria-pressed.
         */
        ariaSelected?: boolean | 'false' | 'true'
        /**
         * Defines the number of items in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM.
         * @see aria-posinset.
         */
        ariaSetsize?: number
        /** Indicates if items in a table or grid are sorted in ascending or descending order. */
        ariaSort?: 'none' | 'ascending' | 'descending' | 'other'
        /** Defines the maximum allowed value for a range widget. */
        ariaValuemax?: number
        /** Defines the minimum allowed value for a range widget. */
        ariaValuemin?: number
        /**
         * Defines the current value for a range widget.
         * @see aria-valuetext.
         */
        ariaValuenow?: number
        /** Defines the human readable text alternative of aria-valuenow for a range widget. */
        ariaValuetext?: string
    }

    export interface HTMLAttributes<T> extends AriaAttributes, EventAttributes<T> {
        // Standard HTML Attributes
        accessKey?: string
        className?: string
        contentEditable?: Booleanish | 'inherit'
        contextMenu?: string
        dir?: string
        draggable?: Booleanish
        hidden?: boolean
        id?: string
        lang?: string
        placeholder?: string
        slot?: string
        spellCheck?: Booleanish
        style?: CSSProperties | CSSStyleDeclaration
        tabIndex?: number
        title?: string
        translate?: 'yes' | 'no'

        // WAI-ARIA
        role?: string

        // RDFa Attributes
        about?: string
        datatype?: string
        inlist?: any
        prefix?: string
        property?: string
        resource?: string
        typeof?: string
        vocab?: string

        // Non-standard Attributes
        autoCapitalize?: string
        autoCorrect?: string
        autoSave?: string
        color?: string
        itemProp?: string
        itemScope?: boolean
        itemType?: string
        itemID?: string
        itemRef?: string
        results?: number
        security?: string
        unselectable?: 'on' | 'off'

        // Living Standard
        /**
         * Hints at the type of data that might be entered by the user while editing the element or its contents
         * @see https://html.spec.whatwg.org/multipage/interaction.html#input-modalities:-the-inputmode-attribute
         */
        inputMode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search'
        /**
         * Specify that a standard HTML element should behave like a defined custom built-in element
         * @see https://html.spec.whatwg.org/multipage/custom-elements.html#attr-is
         */
        is?: string
    }

    export interface AnchorHTMLAttributes<T> extends HTMLAttributes<T> {
        download?: any
        href?: string
        hrefLang?: string
        media?: string
        ping?: string
        rel?: string
        target?: string
        type?: string
        referrerPolicy?: string
    }

    export interface AudioHTMLAttributes<T> extends MediaHTMLAttributes<T> {}

    export interface AreaHTMLAttributes<T> extends HTMLAttributes<T> {
        alt?: string
        coords?: string
        download?: any
        href?: string
        hrefLang?: string
        media?: string
        rel?: string
        shape?: string
        target?: string
    }

    export interface BaseHTMLAttributes<T> extends HTMLAttributes<T> {
        href?: string
        target?: string
    }

    export interface BlockquoteHTMLAttributes<T> extends HTMLAttributes<T> {
        cite?: string
    }

    export interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> {
        autoFocus?: boolean
        disabled?: boolean
        form?: string
        formAction?: string
        formEncType?: string
        formMethod?: string
        formNoValidate?: boolean
        formTarget?: string
        name?: string
        type?: 'submit' | 'reset' | 'button'
        value?: string | ReadonlyArray<string> | number
    }

    export interface CanvasHTMLAttributes<T> extends HTMLAttributes<T> {
        height?: number | string
        width?: number | string
    }

    export interface ColHTMLAttributes<T> extends HTMLAttributes<T> {
        span?: number
        width?: number | string
    }

    export interface ColgroupHTMLAttributes<T> extends HTMLAttributes<T> {
        span?: number
    }

    export interface DataHTMLAttributes<T> extends HTMLAttributes<T> {
        value?: string | ReadonlyArray<string> | number
    }

    export interface DetailsHTMLAttributes<T> extends HTMLAttributes<T> {
        open?: boolean
        onToggle?: SimpleEventHandler<T>
    }

    export interface DelHTMLAttributes<T> extends HTMLAttributes<T> {
        cite?: string
        dateTime?: string
    }

    export interface DialogHTMLAttributes<T> extends HTMLAttributes<T> {
        open?: boolean
    }

    export interface EmbedHTMLAttributes<T> extends HTMLAttributes<T> {
        height?: number | string
        src?: string
        type?: string
        width?: number | string
    }

    export interface FieldsetHTMLAttributes<T> extends HTMLAttributes<T> {
        disabled?: boolean
        form?: string
        name?: string
    }

    export interface FormHTMLAttributes<T> extends HTMLAttributes<T> {
        acceptCharset?: string
        action?: string
        autoComplete?: string
        encType?: string
        method?: string
        name?: string
        noValidate?: boolean
        target?: string
    }

    export interface HtmlHTMLAttributes<T> extends HTMLAttributes<T> {
        manifest?: string
    }

    export interface IframeHTMLAttributes<T> extends HTMLAttributes<T> {
        allow?: string
        allowFullScreen?: boolean
        allowTransparency?: boolean
        frameBorder?: number | string
        height?: number | string
        loading?: 'eager' | 'lazy'
        marginHeight?: number
        marginWidth?: number
        name?: string
        referrerPolicy?: string
        sandbox?: string
        scrolling?: string
        seamless?: boolean
        src?: string
        srcDoc?: string
        width?: number | string
    }

    export interface ImgHTMLAttributes<T> extends HTMLAttributes<T> {
        alt?: string
        crossOrigin?: 'anonymous' | 'use-credentials' | ''
        decoding?: 'async' | 'auto' | 'sync'
        height?: number | string
        loading?: 'eager' | 'lazy'
        referrerPolicy?: 'no-referrer' | 'origin' | 'unsafe-url'
        sizes?: string
        src?: string
        srcSet?: string
        useMap?: string
        width?: number | string
    }

    export interface InsHTMLAttributes<T> extends HTMLAttributes<T> {
        cite?: string
        dateTime?: string
    }

    export interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
        accept?: string
        alt?: string
        autoComplete?: string
        autoFocus?: boolean
        capture?: boolean | string
        checked?: boolean
        crossOrigin?: string
        defaultValue?: number | string
        disabled?: boolean
        form?: string
        formAction?: string
        formEncType?: string
        formMethod?: string
        formNoValidate?: boolean
        formTarget?: string
        height?: number | string
        list?: string
        max?: number | string
        maxLength?: number
        min?: number | string
        minLength?: number
        multiple?: boolean
        name?: string
        pattern?: string
        placeholder?: string
        readOnly?: boolean
        required?: boolean
        size?: number
        src?: string
        step?: number | string
        type?: string
        value?: string | ReadonlyArray<string> | number
        width?: number | string

        onChange?: ChangeEventHandler<T>
        onInput?: InputEventHandler<T>
    }

    export interface KeygenHTMLAttributes<T> extends HTMLAttributes<T> {
        autoFocus?: boolean
        challenge?: string
        disabled?: boolean
        form?: string
        keyType?: string
        keyParams?: string
        name?: string
    }

    export interface LabelHTMLAttributes<T> extends HTMLAttributes<T> {
        form?: string
        htmlFor?: string
    }

    export interface LiHTMLAttributes<T> extends HTMLAttributes<T> {
        value?: string | ReadonlyArray<string> | number
    }

    export interface LinkHTMLAttributes<T> extends HTMLAttributes<T> {
        as?: string
        crossOrigin?: string
        href?: string
        hrefLang?: string
        integrity?: string
        media?: string
        rel?: string
        sizes?: string
        type?: string
        charSet?: string
    }

    export interface MapHTMLAttributes<T> extends HTMLAttributes<T> {
        name?: string
    }

    export interface MenuHTMLAttributes<T> extends HTMLAttributes<T> {
        type?: string
    }

    export interface MediaHTMLAttributes<T> extends HTMLAttributes<T> {
        autoPlay?: boolean
        controls?: boolean
        controlsList?: string
        crossOrigin?: string
        loop?: boolean
        mediaGroup?: string
        muted?: boolean
        playsInline?: boolean
        preload?: string
        src?: string
    }

    export interface MetaHTMLAttributes<T> extends HTMLAttributes<T> {
        charSet?: string
        content?: string
        httpEquiv?: string
        name?: string
    }

    export interface MeterHTMLAttributes<T> extends HTMLAttributes<T> {
        form?: string
        high?: number
        low?: number
        max?: number | string
        min?: number | string
        optimum?: number
        value?: string | ReadonlyArray<string> | number
    }

    export interface QuoteHTMLAttributes<T> extends HTMLAttributes<T> {
        cite?: string
    }

    export interface ObjectHTMLAttributes<T> extends HTMLAttributes<T> {
        classID?: string
        data?: string
        form?: string
        height?: number | string
        name?: string
        type?: string
        useMap?: string
        width?: number | string
        wmode?: string
    }

    export interface OlHTMLAttributes<T> extends HTMLAttributes<T> {
        reversed?: boolean
        start?: number
        type?: '1' | 'a' | 'A' | 'i' | 'I'
    }

    export interface OptgroupHTMLAttributes<T> extends HTMLAttributes<T> {
        disabled?: boolean
        label?: string
    }

    export interface OptionHTMLAttributes<T> extends HTMLAttributes<T> {
        disabled?: boolean
        label?: string
        selected?: boolean
        value?: string | ReadonlyArray<string> | number
    }

    export interface OutputHTMLAttributes<T> extends HTMLAttributes<T> {
        form?: string
        htmlFor?: string
        name?: string
    }

    export interface ParamHTMLAttributes<T> extends HTMLAttributes<T> {
        name?: string
        value?: string | ReadonlyArray<string> | number
    }

    export interface ProgressHTMLAttributes<T> extends HTMLAttributes<T> {
        max?: number | string
        value?: string | ReadonlyArray<string> | number
    }

    export interface SlotHTMLAttributes<T> extends HTMLAttributes<T> {
        name?: string
    }

    export interface ScriptHTMLAttributes<T> extends HTMLAttributes<T> {
        async?: boolean
        charSet?: string
        crossOrigin?: string
        defer?: boolean
        integrity?: string
        noModule?: boolean
        nonce?: string
        src?: string
        type?: string
    }

    export interface SelectHTMLAttributes<T> extends HTMLAttributes<T> {
        autoComplete?: string
        autoFocus?: boolean
        disabled?: boolean
        form?: string
        multiple?: boolean
        name?: string
        required?: boolean
        size?: number
        value?: string | ReadonlyArray<string> | number
        onChange?: ChangeEventHandler<T>
    }

    export interface SourceHTMLAttributes<T> extends HTMLAttributes<T> {
        media?: string
        sizes?: string
        src?: string
        srcSet?: string
        type?: string
    }

    export interface StyleHTMLAttributes<T> extends HTMLAttributes<T> {
        media?: string
        nonce?: string
        scoped?: boolean
        type?: string
    }

    export interface TableHTMLAttributes<T> extends HTMLAttributes<T> {
        cellPadding?: number | string
        cellSpacing?: number | string
        summary?: string
        width?: number | string
    }

    export interface TextareaHTMLAttributes<T> extends HTMLAttributes<T> {
        autoComplete?: string
        autoFocus?: boolean
        cols?: number
        dirName?: string
        disabled?: boolean
        form?: string
        maxLength?: number
        minLength?: number
        name?: string
        placeholder?: string
        readOnly?: boolean
        required?: boolean
        rows?: number
        value?: string | ReadonlyArray<string> | number
        wrap?: string

        onChange?: ChangeEventHandler<T>
    }

    export interface TdHTMLAttributes<T> extends HTMLAttributes<T> {
        align?: 'left' | 'center' | 'right' | 'justify' | 'char'
        colSpan?: number
        headers?: string
        rowSpan?: number
        scope?: string
        abbr?: string
        height?: number | string
        width?: number | string
        valign?: 'top' | 'middle' | 'bottom' | 'baseline'
    }

    export interface ThHTMLAttributes<T> extends HTMLAttributes<T> {
        align?: 'left' | 'center' | 'right' | 'justify' | 'char'
        colSpan?: number
        headers?: string
        rowSpan?: number
        scope?: string
        abbr?: string
    }

    export interface TimeHTMLAttributes<T> extends HTMLAttributes<T> {
        dateTime?: string
    }

    export interface TrackHTMLAttributes<T> extends HTMLAttributes<T> {
        default?: boolean
        kind?: string
        label?: string
        src?: string
        srcLang?: string
    }

    export interface VideoHTMLAttributes<T> extends MediaHTMLAttributes<T> {
        height?: number | string
        playsInline?: boolean
        poster?: string
        width?: number | string
        disablePictureInPicture?: boolean
    }

    // SVG

    export interface SVGAttributes<T> extends AriaAttributes, EventAttributes<T> {
        // Attributes which also defined in HTMLAttributes
        className?: string
        color?: string
        height?: number | string
        id?: string
        lang?: string
        max?: number | string
        media?: string
        method?: string
        min?: number | string
        name?: string
        style?: CSSProperties | CSSStyleDeclaration
        target?: string
        type?: string
        width?: number | string

        // Other HTML properties supported by SVG elements in browsers
        role?: string
        tabIndex?: number
        crossOrigin?: 'anonymous' | 'use-credentials' | ''

        // SVG Specific attributes
        accentHeight?: number | string
        accumulate?: 'none' | 'sum'
        additive?: 'replace' | 'sum'
        alignmentBaseline?:
            | 'auto'
            | 'baseline'
            | 'before-edge'
            | 'text-before-edge'
            | 'middle'
            | 'central'
            | 'after-edge'
            | 'text-after-edge'
            | 'ideographic'
            | 'alphabetic'
            | 'hanging'
            | 'mathematical'
            | 'inherit'
        allowReorder?: 'no' | 'yes'
        alphabetic?: number | string
        amplitude?: number | string
        arabicForm?: 'initial' | 'medial' | 'terminal' | 'isolated'
        ascent?: number | string
        attributeName?: string
        attributeType?: string
        autoReverse?: Booleanish
        azimuth?: number | string
        baseFrequency?: number | string
        baselineShift?: number | string
        baseProfile?: number | string
        bbox?: number | string
        begin?: number | string
        bias?: number | string
        by?: number | string
        calcMode?: number | string
        capHeight?: number | string
        clip?: number | string
        clipPath?: string
        clipPathUnits?: number | string
        clipRule?: number | string
        colorInterpolation?: number | string
        colorInterpolationFilters?: 'auto' | 'sRGB' | 'linearRGB' | 'inherit'
        colorProfile?: number | string
        colorRendering?: number | string
        contentScriptType?: number | string
        contentStyleType?: number | string
        cursor?: number | string
        cx?: number | string
        cy?: number | string
        d?: string
        decelerate?: number | string
        descent?: number | string
        diffuseConstant?: number | string
        direction?: number | string
        display?: number | string
        divisor?: number | string
        dominantBaseline?: number | string
        dur?: number | string
        dx?: number | string
        dy?: number | string
        edgeMode?: number | string
        elevation?: number | string
        enableBackground?: number | string
        end?: number | string
        exponent?: number | string
        externalResourcesRequired?: Booleanish
        fill?: string
        fillOpacity?: number | string
        fillRule?: 'nonzero' | 'evenodd' | 'inherit'
        filter?: string
        filterRes?: number | string
        filterUnits?: number | string
        floodColor?: number | string
        floodOpacity?: number | string
        focusable?: Booleanish | 'auto'
        fontFamily?: string
        fontSize?: number | string
        fontSizeAdjust?: number | string
        fontStretch?: number | string
        fontStyle?: number | string
        fontVariant?: number | string
        fontWeight?: number | string
        format?: number | string
        from?: number | string
        fx?: number | string
        fy?: number | string
        g1?: number | string
        g2?: number | string
        glyphName?: number | string
        glyphOrientationHorizontal?: number | string
        glyphOrientationVertical?: number | string
        glyphRef?: number | string
        gradientTransform?: string
        gradientUnits?: string
        hanging?: number | string
        horizAdvX?: number | string
        horizOriginX?: number | string
        href?: string
        ideographic?: number | string
        imageRendering?: number | string
        in2?: number | string
        in?: string
        intercept?: number | string
        k1?: number | string
        k2?: number | string
        k3?: number | string
        k4?: number | string
        k?: number | string
        kernelMatrix?: number | string
        kernelUnitLength?: number | string
        kerning?: number | string
        keyPoints?: number | string
        keySplines?: number | string
        keyTimes?: number | string
        lengthAdjust?: number | string
        letterSpacing?: number | string
        lightingColor?: number | string
        limitingConeAngle?: number | string
        local?: number | string
        markerEnd?: string
        markerHeight?: number | string
        markerMid?: string
        markerStart?: string
        markerUnits?: number | string
        markerWidth?: number | string
        mask?: string
        maskContentUnits?: number | string
        maskUnits?: number | string
        mathematical?: number | string
        mode?: number | string
        numOctaves?: number | string
        offset?: number | string
        opacity?: number | string
        operator?: number | string
        order?: number | string
        orient?: number | string
        orientation?: number | string
        origin?: number | string
        overflow?: number | string
        overlinePosition?: number | string
        overlineThickness?: number | string
        paintOrder?: number | string
        panose1?: number | string
        path?: string
        pathLength?: number | string
        patternContentUnits?: string
        patternTransform?: number | string
        patternUnits?: string
        pointerEvents?: number | string
        points?: string
        pointsAtX?: number | string
        pointsAtY?: number | string
        pointsAtZ?: number | string
        preserveAlpha?: Booleanish
        preserveAspectRatio?: string
        primitiveUnits?: number | string
        r?: number | string
        radius?: number | string
        refX?: number | string
        refY?: number | string
        renderingIntent?: number | string
        repeatCount?: number | string
        repeatDur?: number | string
        requiredExtensions?: number | string
        requiredFeatures?: number | string
        restart?: number | string
        result?: string
        rotate?: number | string
        rx?: number | string
        ry?: number | string
        scale?: number | string
        seed?: number | string
        shapeRendering?: number | string
        slope?: number | string
        spacing?: number | string
        specularConstant?: number | string
        specularExponent?: number | string
        speed?: number | string
        spreadMethod?: string
        startOffset?: number | string
        stdDeviation?: number | string
        stemh?: number | string
        stemv?: number | string
        stitchTiles?: number | string
        stopColor?: string
        stopOpacity?: number | string
        strikethroughPosition?: number | string
        strikethroughThickness?: number | string
        string?: number | string
        stroke?: string
        strokeDasharray?: string | number
        strokeDashoffset?: string | number
        strokeLinecap?: 'butt' | 'round' | 'square' | 'inherit'
        strokeLinejoin?: 'miter' | 'round' | 'bevel' | 'inherit'
        strokeMiterlimit?: number | string
        strokeOpacity?: number | string
        strokeWidth?: number | string
        surfaceScale?: number | string
        systemLanguage?: number | string
        tableValues?: number | string
        targetX?: number | string
        targetY?: number | string
        textAnchor?: string
        textDecoration?: number | string
        textLength?: number | string
        textRendering?: number | string
        to?: number | string
        transform?: string
        u1?: number | string
        u2?: number | string
        underlinePosition?: number | string
        underlineThickness?: number | string
        unicode?: number | string
        unicodeBidi?: number | string
        unicodeRange?: number | string
        unitsPerEm?: number | string
        vAlphabetic?: number | string
        values?: string
        vectorEffect?: number | string
        version?: string
        vertAdvY?: number | string
        vertOriginX?: number | string
        vertOriginY?: number | string
        vHanging?: number | string
        vIdeographic?: number | string
        viewBox?: string
        viewTarget?: number | string
        visibility?: number | string
        vMathematical?: number | string
        widths?: number | string
        wordSpacing?: number | string
        writingMode?: number | string
        x1?: number | string
        x2?: number | string
        x?: number | string
        xChannelSelector?: string
        xHeight?: number | string
        xlinkActuate?: string
        xlinkArcrole?: string
        xlinkHref?: string
        xlinkRole?: string
        xlinkShow?: string
        xlinkTitle?: string
        xlinkType?: string
        xmlBase?: string
        xmlLang?: string
        xmlns?: string
        xmlnsXlink?: string
        xmlSpace?: string
        y1?: number | string
        y2?: number | string
        y?: number | string
        yChannelSelector?: string
        z?: number | string
        zoomAndPan?: string
    }

    type SVGProps<T> = SVGAttributes<T> & Attributes

    type HTMLProps<T extends HTMLAttributes<any>> = T & Attributes

    export interface Elements {
        // HTML
        a: HTMLProps<AnchorHTMLAttributes<HTMLAnchorElement>>
        abbr: HTMLProps<HTMLAttributes<HTMLElement>>
        address: HTMLProps<HTMLAttributes<HTMLElement>>
        area: HTMLProps<AreaHTMLAttributes<HTMLAreaElement>>
        article: HTMLProps<HTMLAttributes<HTMLElement>>
        aside: HTMLProps<HTMLAttributes<HTMLElement>>
        audio: HTMLProps<AudioHTMLAttributes<HTMLAudioElement>>
        b: HTMLProps<HTMLAttributes<HTMLElement>>
        base: HTMLProps<BaseHTMLAttributes<HTMLBaseElement>>
        bdi: HTMLProps<HTMLAttributes<HTMLElement>>
        bdo: HTMLProps<HTMLAttributes<HTMLElement>>
        big: HTMLProps<HTMLAttributes<HTMLElement>>
        blockquote: HTMLProps<BlockquoteHTMLAttributes<HTMLElement>>
        body: HTMLProps<HTMLAttributes<HTMLBodyElement>>
        br: HTMLProps<HTMLAttributes<HTMLBRElement>>
        button: HTMLProps<ButtonHTMLAttributes<HTMLButtonElement>>
        canvas: HTMLProps<CanvasHTMLAttributes<HTMLCanvasElement>>
        caption: HTMLProps<HTMLAttributes<HTMLElement>>
        cite: HTMLProps<HTMLAttributes<HTMLElement>>
        code: HTMLProps<HTMLAttributes<HTMLElement>>
        col: HTMLProps<ColHTMLAttributes<HTMLTableColElement>>
        colgroup: HTMLProps<ColgroupHTMLAttributes<HTMLTableColElement>>
        data: HTMLProps<DataHTMLAttributes<HTMLDataElement>>
        datalist: HTMLProps<HTMLAttributes<HTMLDataListElement>>
        dd: HTMLProps<HTMLAttributes<HTMLElement>>
        del: HTMLProps<DelHTMLAttributes<HTMLElement>>
        details: HTMLProps<DetailsHTMLAttributes<HTMLElement>>
        dfn: HTMLProps<HTMLAttributes<HTMLElement>>
        dialog: HTMLProps<DialogHTMLAttributes<HTMLDialogElement>>
        div: HTMLProps<HTMLAttributes<HTMLDivElement>>
        dl: HTMLProps<HTMLAttributes<HTMLDListElement>>
        dt: HTMLProps<HTMLAttributes<HTMLElement>>
        em: HTMLProps<HTMLAttributes<HTMLElement>>
        embed: HTMLProps<EmbedHTMLAttributes<HTMLEmbedElement>>
        fieldset: HTMLProps<FieldsetHTMLAttributes<HTMLFieldSetElement>>
        figcaption: HTMLProps<HTMLAttributes<HTMLElement>>
        figure: HTMLProps<HTMLAttributes<HTMLElement>>
        footer: HTMLProps<HTMLAttributes<HTMLElement>>
        form: HTMLProps<FormHTMLAttributes<HTMLFormElement>>
        h1: HTMLProps<HTMLAttributes<HTMLHeadingElement>>
        h2: HTMLProps<HTMLAttributes<HTMLHeadingElement>>
        h3: HTMLProps<HTMLAttributes<HTMLHeadingElement>>
        h4: HTMLProps<HTMLAttributes<HTMLHeadingElement>>
        h5: HTMLProps<HTMLAttributes<HTMLHeadingElement>>
        h6: HTMLProps<HTMLAttributes<HTMLHeadingElement>>
        head: HTMLProps<HTMLAttributes<HTMLHeadElement>>
        header: HTMLProps<HTMLAttributes<HTMLElement>>
        hgroup: HTMLProps<HTMLAttributes<HTMLElement>>
        hr: HTMLProps<HTMLAttributes<HTMLHRElement>>
        html: HTMLProps<HtmlHTMLAttributes<HTMLHtmlElement>>
        i: HTMLProps<HTMLAttributes<HTMLElement>>
        iframe: HTMLProps<IframeHTMLAttributes<HTMLIFrameElement>>
        img: HTMLProps<ImgHTMLAttributes<HTMLImageElement>>
        input: HTMLProps<InputHTMLAttributes<HTMLInputElement>>
        ins: HTMLProps<InsHTMLAttributes<HTMLModElement>>
        kbd: HTMLProps<HTMLAttributes<HTMLElement>>
        keygen: HTMLProps<KeygenHTMLAttributes<HTMLElement>>
        label: HTMLProps<LabelHTMLAttributes<HTMLLabelElement>>
        legend: HTMLProps<HTMLAttributes<HTMLLegendElement>>
        li: HTMLProps<LiHTMLAttributes<HTMLLIElement>>
        link: HTMLProps<LinkHTMLAttributes<HTMLLinkElement>>
        main: HTMLProps<HTMLAttributes<HTMLElement>>
        map: HTMLProps<MapHTMLAttributes<HTMLMapElement>>
        mark: HTMLProps<HTMLAttributes<HTMLElement>>
        menu: HTMLProps<MenuHTMLAttributes<HTMLElement>>
        menuitem: HTMLProps<HTMLAttributes<HTMLElement>>
        meta: HTMLProps<MetaHTMLAttributes<HTMLMetaElement>>
        meter: HTMLProps<MeterHTMLAttributes<HTMLElement>>
        nav: HTMLProps<HTMLAttributes<HTMLElement>>
        noindex: HTMLProps<HTMLAttributes<HTMLElement>>
        noscript: HTMLProps<HTMLAttributes<HTMLElement>>
        object: HTMLProps<ObjectHTMLAttributes<HTMLObjectElement>>
        ol: HTMLProps<OlHTMLAttributes<HTMLOListElement>>
        optgroup: HTMLProps<OptgroupHTMLAttributes<HTMLOptGroupElement>>
        option: HTMLProps<OptionHTMLAttributes<HTMLOptionElement>>
        output: HTMLProps<OutputHTMLAttributes<HTMLElement>>
        p: HTMLProps<HTMLAttributes<HTMLParagraphElement>>
        param: HTMLProps<ParamHTMLAttributes<HTMLParamElement>>
        picture: HTMLProps<HTMLAttributes<HTMLElement>>
        pre: HTMLProps<HTMLAttributes<HTMLPreElement>>
        progress: HTMLProps<ProgressHTMLAttributes<HTMLProgressElement>>
        q: HTMLProps<QuoteHTMLAttributes<HTMLQuoteElement>>
        rp: HTMLProps<HTMLAttributes<HTMLElement>>
        rt: HTMLProps<HTMLAttributes<HTMLElement>>
        ruby: HTMLProps<HTMLAttributes<HTMLElement>>
        s: HTMLProps<HTMLAttributes<HTMLElement>>
        samp: HTMLProps<HTMLAttributes<HTMLElement>>
        slot: HTMLProps<SlotHTMLAttributes<HTMLSlotElement>>
        script: HTMLProps<ScriptHTMLAttributes<HTMLScriptElement>>
        section: HTMLProps<HTMLAttributes<HTMLElement>>
        select: HTMLProps<SelectHTMLAttributes<HTMLSelectElement>>
        small: HTMLProps<HTMLAttributes<HTMLElement>>
        source: HTMLProps<SourceHTMLAttributes<HTMLSourceElement>>
        span: HTMLProps<HTMLAttributes<HTMLSpanElement>>
        strong: HTMLProps<HTMLAttributes<HTMLElement>>
        style: HTMLProps<StyleHTMLAttributes<HTMLStyleElement>>
        sub: HTMLProps<HTMLAttributes<HTMLElement>>
        summary: HTMLProps<HTMLAttributes<HTMLElement>>
        sup: HTMLProps<HTMLAttributes<HTMLElement>>
        table: HTMLProps<TableHTMLAttributes<HTMLTableElement>>
        template: HTMLProps<HTMLAttributes<HTMLTemplateElement>>
        tbody: HTMLProps<HTMLAttributes<HTMLTableSectionElement>>
        td: HTMLProps<TdHTMLAttributes<HTMLTableDataCellElement>>
        textarea: HTMLProps<TextareaHTMLAttributes<HTMLTextAreaElement>>
        tfoot: HTMLProps<HTMLAttributes<HTMLTableSectionElement>>
        th: HTMLProps<ThHTMLAttributes<HTMLTableHeaderCellElement>>
        thead: HTMLProps<HTMLAttributes<HTMLTableSectionElement>>
        time: HTMLProps<TimeHTMLAttributes<HTMLElement>>
        title: HTMLProps<HTMLAttributes<HTMLTitleElement>>
        tr: HTMLProps<HTMLAttributes<HTMLTableRowElement>>
        track: HTMLProps<TrackHTMLAttributes<HTMLTrackElement>>
        u: HTMLProps<HTMLAttributes<HTMLElement>>
        ul: HTMLProps<HTMLAttributes<HTMLUListElement>>
        var: HTMLProps<HTMLAttributes<HTMLElement>>
        video: HTMLProps<VideoHTMLAttributes<HTMLVideoElement>>
        wbr: HTMLProps<HTMLAttributes<HTMLElement>>

        // SVG
        svg: SVGProps<SVGSVGElement>
        animate: SVGProps<SVGAnimateElement>
        animateMotion: SVGProps<SVGAnimateMotionElement>
        animateTransform: SVGProps<SVGAnimateTransformElement>
        circle: SVGProps<SVGCircleElement>
        clipPath: SVGProps<SVGClipPathElement>
        defs: SVGProps<SVGDefsElement>
        desc: SVGProps<SVGDescElement>
        ellipse: SVGProps<SVGEllipseElement>
        feBlend: SVGProps<SVGFEBlendElement>
        feColorMatrix: SVGProps<SVGFEColorMatrixElement>
        feComponentTransfer: SVGProps<SVGFEComponentTransferElement>
        feComposite: SVGProps<SVGFECompositeElement>
        feConvolveMatrix: SVGProps<SVGFEConvolveMatrixElement>
        feDiffuseLighting: SVGProps<SVGFEDiffuseLightingElement>
        feDisplacementMap: SVGProps<SVGFEDisplacementMapElement>
        feDistantLight: SVGProps<SVGFEDistantLightElement>
        feDropShadow: SVGProps<SVGFEDropShadowElement>
        feFlood: SVGProps<SVGFEFloodElement>
        feFuncA: SVGProps<SVGFEFuncAElement>
        feFuncB: SVGProps<SVGFEFuncBElement>
        feFuncG: SVGProps<SVGFEFuncGElement>
        feFuncR: SVGProps<SVGFEFuncRElement>
        feGaussianBlur: SVGProps<SVGFEGaussianBlurElement>
        feImage: SVGProps<SVGFEImageElement>
        feMerge: SVGProps<SVGFEMergeElement>
        feMergeNode: SVGProps<SVGFEMergeNodeElement>
        feMorphology: SVGProps<SVGFEMorphologyElement>
        feOffset: SVGProps<SVGFEOffsetElement>
        fePointLight: SVGProps<SVGFEPointLightElement>
        feSpecularLighting: SVGProps<SVGFESpecularLightingElement>
        feSpotLight: SVGProps<SVGFESpotLightElement>
        feTile: SVGProps<SVGFETileElement>
        feTurbulence: SVGProps<SVGFETurbulenceElement>
        filter: SVGProps<SVGFilterElement>
        foreignObject: SVGProps<SVGForeignObjectElement>
        g: SVGProps<SVGGElement>
        image: SVGProps<SVGImageElement>
        line: SVGProps<SVGLineElement>
        linearGradient: SVGProps<SVGLinearGradientElement>
        marker: SVGProps<SVGMarkerElement>
        mask: SVGProps<SVGMaskElement>
        metadata: SVGProps<SVGMetadataElement>
        mpath: SVGProps<SVGElement>
        path: SVGProps<SVGPathElement>
        pattern: SVGProps<SVGPatternElement>
        polygon: SVGProps<SVGPolygonElement>
        polyline: SVGProps<SVGPolylineElement>
        radialGradient: SVGProps<SVGRadialGradientElement>
        rect: SVGProps<SVGRectElement>
        stop: SVGProps<SVGStopElement>
        switch: SVGProps<SVGSwitchElement>
        symbol: SVGProps<SVGSymbolElement>
        text: SVGProps<SVGTextElement>
        textPath: SVGProps<SVGTextPathElement>
        tspan: SVGProps<SVGTSpanElement>
        use: SVGProps<SVGUseElement>
        view: SVGProps<SVGViewElement>
    }

    export type TagName = keyof Elements

    export type Type = TagName | Component
    export type Uid = string
    export type Prop = keyof ComponentProps & string
    export type Key = string | number
    export type Child =
        | JsxMutator<any, any>
        | HTMLElement
        | SVGElement
        | Text
        | string
        | number
        | boolean
        | null
        | Child[]
        | Generator<Child, Child | unknown>

    export type AmComponent = () => Child | Generator<Child | never, Child | unknown>
    export type FnComponent<P extends ComponentProps = {}> = (props: P) => Child
    export type GnComponent<P extends ComponentProps = {}> = (props: P) => Generator<Child | never, Child | unknown, P>
    export type Component<P extends ComponentProps = {}> = FnComponent<P> | GnComponent<P>

    export interface Ref {
        current?: any
    }

    export interface Attributes {
        key?: Key
        ref?: Ref
        children?: Child
        onMount?: (node: Element) => void
        onUnmount?: (node: Element) => void
    }

    export interface ElementProps extends Attributes {
        [k: string]: any
    }

    export interface ComponentProps extends Attributes {}

    export interface JsxMutatorLike<R> {
        result?: R
    }

    export interface ElementMutatorLike<R> extends JsxMutatorLike<R> {
        props: ElementProps
        children: ComponentMutatorLike<(HTMLElement | SVGElement | Text)[]>
    }

    export interface ComponentMutatorLike<R> extends JsxMutatorLike<R> {
        reconcileMap: ReconcileMap
        context?: Context
        atom?: Atom<WhatsJSX.Child>
    }

    export interface GnComponentMutatorLike<R> extends ComponentMutatorLike<R> {
        iterator?: Iterator<Child | never, Child | unknown, unknown>
    }

    export interface AmComponentMutatorLike<R> extends ComponentMutatorLike<R> {
        atom?: Atom<Child>
    }
}

declare global {
    namespace JSX {
        export type Element = WhatsJSX.Child

        export interface ElementAttributesProperty {
            props: {}
        }

        export interface ElementChildrenAttribute {
            children: {}
        }

        export interface IntrinsicAttributes extends WhatsJSX.Attributes {}

        export interface IntrinsicElements extends WhatsJSX.Elements {}
    }
}
