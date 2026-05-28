// src/utils/loadLocaleMessages.js
import i18n from '@/i18n'

/**
/src
  /components
    LanguageSwitcher.vue
  /i18n.js
  /locales
    common.en.json
    common.ja.json
    common.zh.json
    common.ko.json
    common.vi.json
    login.en.json
    login.ja.json
    ...
  /utils
    loadLocaleMessages.js
  /views
    LoginPage.vue
  main.js
 */

// Function to load locale messages dynamically
// This function will be called when the user switches languages
// It will import the corresponding JSON files for the selected locale
// and set them in the i18n instance.
// This allows for lazy loading of translations, reducing the initial bundle size.
// Usage: Call this function with the desired locale code (e.g., 'en', 'ja', 'zh', etc.)
// to load the corresponding translations for the common and login namespaces.
// Example: loadLocaleMessages('en') will load common.en.json and login.en.json
// and set them in the i18n instance under the 'common' and 'login' namespaces respectively.
// Note: Ensure that the JSON files are structured correctly and exist in the specified paths.
// This function is typically used in conjunction with a language switcher component
// to allow users to change the language of the application dynamically.
// It is also useful for applications that need to support multiple languages
// without loading all translations at once, thus improving performance and user experience.
// This function is designed to be used in a Vue.js application with Vue I18n for internationalization.
// It leverages dynamic imports to load the translation files only when needed,
// which helps in keeping the initial load time of the application low.
// It is recommended to call this function when the application initializes or when the user selects a different language.
// This function is part of a larger internationalization setup in a Vue.js application
// and is intended to be used alongside other i18n configurations and components.
// It is a best practice to handle errors gracefully, as shown in the catch block,
// to ensure that the application can still function even if a translation file is missing.
// This function is essential for applications that require multilingual support
// and provides a flexible way to manage translations dynamically.

export async function loadLocaleMessages(locale) {
  try {
    // console.log("loadLocaleMessages===", locale)
    const [common] = await Promise.all([
      import(`../locales/userRegister.${locale}.json`),
      // import(`../locales/login.${locale}.json`)
    ])
    
    i18n.global.setLocaleMessage(locale, {
        common: common.default,
        // login: login.default
    });

    console.log( "llllllllllllllllllllllllllllllllllllllllllllllll------", i18n.global.getLocaleMessage(locale) )
  } catch (e) {
    console.warn(`Translations for locale "${locale}" not found.`)
  }
}


// export async function loadLocaleMessages(locale) {
//   try {
//     const [common, userRegister] = await Promise.all([
//       import(`../locales/common.${locale}.json`).catch(() => null),
//       import(`../locales/userRegister.${locale}.json`).catch(() => null)
//     ])

//     // Merge existing messages to preserve any already loaded
//     const mergedMessages = {
//       ...(i18n.global.getLocaleMessage(locale) || {}),
//       ...(common ? { common: common.default } : {}),
//       ...(userRegister ? { userRegister: userRegister.default } : {})
//     }

//     i18n.global.setLocaleMessage(locale, mergedMessages)

//   } catch (e) {
//     console.warn(`Failed to load translations for locale "${locale}"`, e)
//   }
// }