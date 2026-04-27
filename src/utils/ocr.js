/**
 * Converts an image File object to a base64-encoded string.
 */
export const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            // Strip the data URL prefix (e.g. "data:image/png;base64,") 
            // to get the raw base64 string, which is what Ollama expects.
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};
