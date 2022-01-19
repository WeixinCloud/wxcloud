export const logger = {
    debug(...args) {
        if (process.env.NODE_ENV === "DEBUG") {
            console.log(...args)
        }
    }
}
