let postcss = require('postcss')

module.exports = postcss.plugin('postcss-tailwind-apply', (opts = { }) => {

  const variantSelectors = Object.assign({
    '_none': null,
    'important': c => `@apply ${c} !important;`,
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
  }, opts.customVariants || {});

  const breakpoints = opts.breakpoints || ['sm', 'md', 'lg', 'xl'];

  function getRule(prefix, classes) {
    // Init rule and selector.
    let rules = [], selectors = [];

    // Allow for multiple variant prefixes, e.g. 'first:hover'. These need to be applied inside-out.
    prefix.split(':').reverse().forEach(variant => {
      if (typeof variantSelectors[variant] !== 'undefined') {
        // If there's a selector defined for this variant, use @apply inside that selector.
        if (typeof variantSelectors[variant] === 'function') {
          rules = rules.concat(classes.map(variantSelectors[variant]));
        }
        else {
          selectors.push(variantSelectors[variant]);
        }
      }
      else if (breakpoints.indexOf(variant) !== -1) {
        // Else if the variant is a breakpoint, use @screen.
        selectors.push(`@screen ${variant}`);
      }
      else {
        // Else, log an error.
        console.warn(`Error [postcss-tailwind-apply]: No selector found for Tailwind variant '${variant}'`);
      }
    });

    // Generate rule.
    selectors = selectors.filter(v => v);
    if (!rules.length) {
      rules = [`@apply ${classes.join(' ')};`];
    }
    const rule = `${selectors.map(s =>`${s} { `).join('')} ${rules.join(' ')} ${selectors.map(s => ' } ').join('')}`;

    // Return postcss rule/s.
    const root = postcss.parse(rule);
    return root.nodes;
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
        newRules = newRules.concat(getRule(prefix, classesByPrefix[prefix]));
      });

      rule.replaceWith(newRules);
    });
  };
});
