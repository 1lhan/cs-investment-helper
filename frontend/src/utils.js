export const usePostRequest = async (url, requestBody) => {
    let request = await fetch(import.meta.env.VITE_REACT_APP_BACKEND_URL + url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    }).then(res => res.json())

    return request
}

export const dynamicTitle = (title) => {
    document.title = title
}