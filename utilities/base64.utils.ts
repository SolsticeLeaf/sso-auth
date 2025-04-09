export function decodeBase64(base64: any): string {
    return atob(base64);
}

export function decodeBase64AsJson(base64: any): any {
    try {
        return JSON.parse(atob(base64));
    } catch {
        return {}
    }
}

export function encodeBase64(string: string): string {
    return btoa(string)
}

export default { decodeBase64, decodeBase64AsJson, encodeBase64 }
