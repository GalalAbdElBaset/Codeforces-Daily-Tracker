export default async function handler(request, response) {
    try {
        // ==============================
        // Get handle
        // ==============================

        const { handle } = request.query;

        if (!handle) {
            return response.status(400).json({
                status: "FAILED",
                comment: "Handle is required"
            });
        }

        // ==============================
        // Codeforces API
        // ==============================

        const apiUrl =
            `https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}`;

        // ==============================
        // Request Codeforces
        // ==============================

        const cfResponse = await fetch(apiUrl);

        // ==============================
        // HTTP Error
        // ==============================

        if (!cfResponse.ok) {
            return response.status(cfResponse.status).json({
                status: "FAILED",
                comment: `Codeforces returned HTTP ${cfResponse.status}`
            });
        }

        // ==============================
        // Get JSON
        // ==============================

        const data = await cfResponse.json();

        // ==============================
        // Codeforces API Error
        // ==============================

        if (data.status !== "OK") {
            return response.status(400).json({
                status: "FAILED",
                comment: data.comment || "Codeforces API error"
            });
        }

        // ==============================
        // Return result
        // ==============================

        return response.status(200).json({
            status: "OK",
            result: data.result
        });

    } catch (error) {

        console.error("Codeforces Proxy Error:", error);

        return response.status(500).json({
            status: "FAILED",
            comment: "Failed to connect to Codeforces API"
        });
    }
}