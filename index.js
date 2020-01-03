let postcss = require('postcss')

module.exports = postcss.plugin('postcss-tailwind-apply', (opts = { }) => {

  return (root, result) => {

    // Walk @apply rules.
    root.walkAtRules('apply', rule => {
      let classesByVariant = {};

      rule.params.split(' ').forEach(value => {

        // Parse variant & classes.
        // Allow for multiple classes grouped in parentheses, e.g. hover:(text-red underline).
        let [classes, variant] = value.split(':').reverse();
        variant = variant || '_none';
        classes = classes.replace('(', '').replace(')', '').split(' ');

        classesByVariant[variant] = (classesByVariant[variant] || []).concat(classes);
      });

      const variantSelectors = Object.assign({
        '_none': '&',
        'hover': '&:hover',
        'focus': '&:focus',
        'active': '&:active',
        'disabled': '&:disabled',
        'visited': '&:visited',
        'first': '&:first-child',
        'last': '&:last-child',
        'odd': '&:nth-child(odd)',
        'even': '&:nth-child(even)',
        'group-hover': '.group:hover &',
        'focus-within': '&:focus-within',
      }, opts.customVariantSelectors || {});

      const breakpoints = opts.breakpoints || ['sm', 'md', 'lg', 'xl'];

      let newRules = [];

      Object.keys(classesByVariant).forEach(variant => {
        if (variantSelectors[variant]) {
          // If there's a selector defined for this variant, use @apply inside that selector.
          const newRoot = postcss.parse(`${variantSelectors[variant]} { @apply ${classesByVariant[variant].join(' ')}; }`);
          newRules.push(...newRoot.nodes);
        }
        else if (breakpoints.indexOf(variant) !== -1) {
          // Else if the variant is a breakpoint, use @apply inside @screen.
          const newRoot = postcss.parse(`@screen ${variant} { @apply ${classesByVariant[variant].join(' ')}; }`);
          newRules.push(...newRoot.nodes);
        }
        else {
          console.error(`Error [postcss-tailwind-apply]: No selector found for Tailwind variant '${variant}'`);
        }
      });

      rule.replaceWith(newRules);
    });
  };
});
