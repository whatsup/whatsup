---
sidebar_position: 5
---

# Styling

Whatsup has a hybrid styling system that allows you to use familiar CSS modules or a new approach. Both systems work out of the box - you decide which one to use. You can also use both at once.

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

### New whatsup way

We import html-tags from the css-file. Each such component tag has boolean properties associated with the names of css classes.

```tsx
import { Div } from './styles.css'

function Badge(props: BadgeProps) {
    const { color, text } = props
    const isRed = color === 'red'
    const isGreen = color === 'green'

    return (
        <Div badge red={isRed} green={isGreen}>
            {text}
        </Div>
    )
}
```

You can import any standard html tag. Tags are capitalized and extended with an additional set of properties, from which the className property is generated under the hood.
