---
sidebar_position: 1
---

# Passing CSS-variables

Any property that starts with a double underscore will be converted to a css variable

```css
/* styles.css */

.box {
    width: var(--size);
    height: var(--size);
}
```

```tsx
import { Div } from './styles.css'

interface BoxProps {
    size: number
}

function Box(props: BoxProps) {
    const { size } = props

    return <Div box __size={size + 'px'} />
}
```

This is equivalent to the following code

```tsx
import styles from './styles.css'

interface BoxProps {
    size: number
}

function Box(props: BoxProps) {
    const { size } = props

    return <div className={styles.box} style={`--size: ${size}px`} />
}
```
