const API_BASE_URL = "http://localhost:5001";

export async function saveAction(data) {
    try {
        const response = await fetch(`${API_BASE_URL}/action`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to save action:", error);
        return null;
    }
}

export async function getHistory(spotifyId) {
    try {
        const response = await fetch(`${API_BASE_URL}/history/${spotifyId}`);
        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch history:", error);
        return [];
    }
}
