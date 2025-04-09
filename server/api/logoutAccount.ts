export default defineEventHandler(async (event) => {
    setCookie(event, 'sessionToken', '')
});
