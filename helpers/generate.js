const generateRandomstring = (length) => {
    const characters ="abcdefghijklmnopqrstuvwxzyABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = ""
    for(let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return result;
}
const generateRandomNumber = (length) => {
    const characters ="0123456789";
    let result = ""
    for(let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return result;
}
module.exports = {
    generateRandomstring,
    generateRandomNumber,
}