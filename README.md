# PostCSS Tailwind Apply

[PostCSS] plugin to preprocess Tailwind's @apply at-rule to handle variants, e.g. @apply hover:text-red.

[PostCSS]: https://github.com/postcss/postcss

```css
/* Input */
a {
  @apply text-black hover:text-red;
}
```

```css
/* Output */
a {
  @apply text-black;

  &:hover {
    @apply text-red;
  }
}
```

**N.B.: since this uses the parent selector, an appropriate postcss plugin should be used to handle it, e.g.
[postcss-nested](https://github.com/postcss/postcss-nested).**

Variant prefixes can even be chained, for example:

## Installation
```css
/* Input */
a {
  @apply text-black hover:text-red first:hover:text-blue;
}
```

```css
/* Output */
a {
  @apply text-black;

  &:hover {
    @apply text-red;
  }

  &:first-child {
    &:hover {
      @apply text-blue;
    }
  }
}
```

Ensure to add the plugin before the tailwindcss plugin, as below:

```diff
module.exports = {
  plugins: [
+   require('postcss-tw')({ //options }),
    require('tailwindcss'),
    //...
  ]
}
```

## Options
### breakpoints
Array of breakpoint names used in responsive variants - defaults to Tailwind's ['sm', 'md', 'lg', 'xl'].

### customVariantSelectors
Map of any custom variants required, along with the selector to be used to handle it, e.g.:

`{
    before: '&::before'
}`

These variants don't even have to be registered in Tailwind, since this plugin processes them to regular @apply at-rules.

