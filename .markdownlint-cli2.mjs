export default {
  config: {
    MD007: false, // Unordered list indentation
    MD013: false, // Line length - disabled for flexibility
    MD024: false, // Allow duplicate headings
    MD028: false, // Blank line inside blockquote
    MD029: false, // Ordered list item prefix
    MD032: false, // Lists should be surrounded by blank lines
    MD033: false, // Allow inline HTML
    MD034: false, // Allow bare URLs
    MD041: false, // First line doesn't need to be a heading
    MD045: false, // Images should have alternate text
    MD047: false, // Files should end with a single newline
    MD059: false, // Link text should be descriptive
  },
  globs: ['**/*.md'],
  ignores: ['node_modules', 'dist', 'CHANGELOG.md'],
};
