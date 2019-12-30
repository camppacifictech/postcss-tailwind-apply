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
        '_none': null,
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

      // First, handle classes without variants.
      if (classes['_none']) {
        rule.params = classes['_none'].join(' ');
        delete classes['_none'];
      }
      else {
        rule.params = '';
      }

      // Now, loop through variants in classes object.
      let newRules = [];

      Object.keys(classes).forEach(variant => {
        if (variantSelectors[variant]) {
          // If there's a non-empty selector defined for this variant, use @apply inside that selector.
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

      if (rule.params) {
        rule.append(newRules);
      }
      else {
        rule.replaceWith(newRules);
      }
    });
  };
});
