const { defineConfig } = require('@vue/cli-service')
const chunkPrefix = '[name].janga'

module.exports = defineConfig({
  transpileDependencies: false,
  base: './',

  devServer: {
    client: {
      overlay: {
        runtimeErrors: (error) => {
          const ignoreErrors = [
            'ResizeObserver loop limit exceeded',
            'ResizeObserver loop completed with undelivered notifications.',
          ]
          return !ignoreErrors.includes(error.message)
        },
      },
    },
    proxy: {
      '/dataEngine/v5/': {
        target: 'https://surupas-run.native365.net',
        changeOrigin: true,
      },
    },
  },

  chainWebpack: (config) => {
    config.module
      .rule('vue')
      .use('vue-loader')
      .tap((options) => ({
        ...options,
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('hoge-'),
        },
      }))

    config.module
      .rule('js')
      .exclude
      .add(/node_modules[\\/]papaparse/)
      .end()
  },

  configureWebpack: {
    resolve: {
      fallback: {
        stream: false,
        buffer: require.resolve('buffer/'),
        string_decoder: require.resolve('string_decoder/'),
      },
    },
    output: {
      filename: `${chunkPrefix}.js`,
      chunkFilename: `${chunkPrefix}.js`,
    },
  },

  css: {
    extract: {
      filename: `${chunkPrefix}.css`,
      chunkFilename: `${chunkPrefix}.css`,
    },
  }
})