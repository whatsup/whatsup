---
sidebar_position: 5
---

# Styling

Whatsup has a hybrid styling system that allows you to use familiar `CSS modules` or a new `CSSX` approach. Both systems work out of the box - you decide which one to use. You can also use both at once.

Imagine that we have such a css.

```css
/* styles.css */

.badge {
    color: white;
}

.red {
    backgroung-color: red;
}

.green {
    backgroung-color: green;
}
```

And we need to create such a component

```tsx
interface BadgeProps {
    color: 'red' | 'green'
    text: string
}

function Badge(props: BadgeProps) {
    //....
}
```

### CSS modules way

Here everything is as usual

```tsx
import styles from './styles.css'

function Badge(props: BadgeProps) {
    const { color, text } = props

    let cn = styles.badge

    if (color === 'red') cn += ' ' + styles.red
    if (color === 'green') cn += ' ' + styles.green

    return <div className={cn}>{text}</div>
}
```

### New CSSX way

We import components named as html-tags from the css-file. Each such component tag has boolean css:namespaced properties associated with the names of css classes.

```tsx
import { Div } from './styles.css'

function Badge(props: BadgeProps) {
    const { color, text } = props
    const isRed = color === 'red'
    const isGreen = color === 'green'

    return (
        <Div css:badge css:red={isRed} css:green={isGreen}>
            {text}
        </Div>
    )
}
```

in this example

```tsx
<Div css:badge />
```

is equal to

```tsx
<div className={styles.badge} />
```

### Custom CSSX components

You can convert any custom component to CSSX component

```tsx
import styles from './styles.css'
import { cssx } from 'whatsup/cssx'

function Block(props) {
    const { className } = props

    return <div className={className} />
}

const BlockX = cssx(Block, styles)

function Badge(props: BadgeProps) {
    const { color, text } = props
    const isRed = color === 'red'
    const isGreen = color === 'green'

    return (
        <BlockX css:badge css:red={isRed} css:green={isGreen}>
            {text}
        </BlockX>
    )
}
```

To do this, you just need to pass the `className` property or use the `{...spread}` operator

```tsx
import styles from './styles.css'

function Block(props) {
    // any logic
    return <div {...props} />
}
```

And then wrap it with the `cssx` function

```tsx
const BlockX = cssx(Block, styles)
```
