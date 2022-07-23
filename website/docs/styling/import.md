---
sidebar_position: 2
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
        <Div
            css:badge
            css:red={isRed}
            css:green={isGreen}
            css:col_xs_12
            css:col_sm_8
        >
            {text}
        </Div>
    )
}
```
