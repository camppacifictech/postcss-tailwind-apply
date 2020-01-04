let postcss = require('postcss')

module.exports = postcss.plugin('postcss-tailwind-apply', (opts = { }) => {

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

  function getRules(prefix, classes) {
    let cssOpen = '',
        cssClose = '';

    // Allow for multiple variant prefixes, e.g. 'first:hover'.
    prefix.split(':').forEach(variant => {
      if (variantSelectors[variant]) {
        // If there's a selector defined for this variant, use @apply inside that selector.
        cssOpen += `${variantSelectors[variant]} { `;
        cssClose += ' }';
      }
      else if (breakpoints.indexOf(variant) !== -1) {
        // Else if the variant is a breakpoint, use @apply inside @screen.
        cssOpen += `@screen ${variant} { `;
        cssClose += ' }';
      }
      else {
        // Else, log an error.
        console.error(`Error [postcss-tailwind-apply]: No selector found for Tailwind variant '${variant}'`);
      }
    });

    if (cssOpen && cssClose) {
      // NB cssStr has an open curly brace.
      const root = postcss.parse(`${cssOpen} @apply ${classes.join(' ')}; ${cssClose}`);
      return root.nodes;
    }

    return [];
  }

  return (root, result) => {

    // Walk @apply rules.
    root.walkAtRules('apply', rule => {
      let classesByPrefix = {};

      rule.params.split(' ').forEach(value => {

        // Parse prefix & class.
        let [className, ...variants] = value.split(':').reverse();
        variants = variants.length ? variants : ['_none'];

        // Key the classes by the original (re-joined) prefixes.
        const prefix = variants.reverse().join(':');

        classesByPrefix[prefix] = (classesByPrefix[prefix] || []).concat(className);
      });

      let newRules = [];

      Object.keys(classesByPrefix).forEach(prefix => {
        newRules = newRules.concat(getRules(prefix, classesByPrefix[prefix]));
      });

      rule.replaceWith(newRules);
    });
  };
});
