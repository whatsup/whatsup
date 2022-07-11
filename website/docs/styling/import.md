---
sidebar_position: 1
---

# Import directive

You can include css files and access their styles.

```css
/* styles.css */
@import 'grid.css';
/*...*/
```

In this example, we are importing a grid and we are immediately able to use its properties.

```tsx
function Badge(props: BadgeProps) {
    // ...
    return (
        <Div badge red={isRed} green={isGreen} col_xs_12 col_sm_8>
            {text}
        </Div>
    )
}
```
