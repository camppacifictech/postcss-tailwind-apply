let postcss = require('postcss')

module.exports = postcss.plugin('postcss-tailwind-apply', (opts = { }) => {

  // Work with options here

  return (root, result) => {

    // Transform CSS AST here
    root.walkAtRules('apply', rule => {
      let classes = {};
      rule.params.split(' ').forEach(value => {
        let [variant, className] = value.split(':');
        if (!className) {
          className = variant;
          variant = '_none';
        }
        if (!classes[variant]) {
          classes[variant] = [];
        }
        classes[variant].push(className);
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

      Object.keys(classes).forEach(variant => {
        if (variantSelectors[variant]) {
          // If there's a selector defined for this variant, use @apply inside that selector.
          const newRoot = postcss.parse(`${variantSelectors[variant]} { @apply ${classes[variant].join(' ')}; }`);
          newRules.push(...newRoot.nodes);
        }
        else if (breakpoints.indexOf(variant) !== -1) {
          // Else if the variant is a breakpoint, use @apply inside @screen.
          const newRoot = postcss.parse(`@screen ${variant} { @apply ${classes[variant].join(' ')}; }`);
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
