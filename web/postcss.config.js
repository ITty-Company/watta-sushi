module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    ...(process.env.NODE_ENV === 'production'
      ? {
          cssnano: {
            preset: [
              'default',
              {
                discardComments: { removeAll: true },
                normalizeWhitespace: true,
                colormin: true,
                minifySelectors: true,
                minifyParams: true,
                mergeLonghand: true,
                mergeRules: true,
              },
            ],
          },
        }
      : {}),
  },
}

