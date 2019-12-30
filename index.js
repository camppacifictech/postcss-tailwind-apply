let postcss = require('postcss')

module.exports = postcss.plugin('postcss-tw', (opts = { }) => {

  // Work with options here

  return (root, result) => {

    // Transform CSS AST here
    root.walkAtRules('tw', rule => {
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
        'group-hover': '.group &:hover',
        'first': '&:first-child',
        'last': '&:last-child',
        'odd': '&:nth(2n+1)',
        'even': '&:nth(2n)',
        'active': '&:active',
        'visited': '&:visited',
        'disabled': '&:disabled',
      }, opts.customVariantSelectors || {});

      const breakpoints = opts.breakpoints || ['sm', 'md', 'lg', 'xl'];

      let newRules = [];

      Object.keys(classes).forEach(variant => {
        // If there's a selector defined for this variant, use @apply inside that selector.
        if (variantSelectors[variant]) {
          const newRoot = postcss.parse(`${variantSelectors[variant]} { @apply ${classes[variant].join(' ')}; }`);
          newRules.push(...newRoot.nodes);
        }
        // Else if the variant is a breakpoint, use @apply inside @screen.
        else if (breakpoints.indexOf(variant) !== -1) {
          const newRoot = postcss.parse(`@screen ${variant} { @apply ${classes[variant].join(' ')}; }`);
          newRules.push(...newRoot.nodes);
        }
      });

      rule.replaceWith(newRules);
    });
  };
});
