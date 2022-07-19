export const IS_TESTING = (() => {
    try {
        return process.env.PLUGIN_TESTING === 'on'
    } catch (e) {
        return false
    }
})()
