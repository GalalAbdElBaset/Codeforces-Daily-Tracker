// ==========================================
// Codeforces Proxy API - Vercel Serverless
// ==========================================

export default async function handler(request, response) {
    // ═══════════════════════════════════════════
    // ✅ Disable ALL caching layers (Vercel + Browser)
    // ═══════════════════════════════════════════
    response.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0, s-maxage=0');
    response.setHeader('CDN-Cache-Control', 'no-store');
    response.setHeader('Vercel-CDN-Cache-Control', 'no-store');
    response.setHeader('Pragma', 'no-cache');
    response.setHeader('Expires', '0');

    try {
        // ==================================
        // Get Handle
        // ==================================
        const handle = request.query?.handle;
        const count = request.query?.count || 10000;

        if (!handle) {
            return response.status(400).json({
                status: "FAILED",
                comment: "Handle is required"
            });
        }

        // ==================================
        // Codeforces API URL with cache buster
        // ==================================
        const cacheBuster = Date.now();

        const apiUrl =
            `https://codeforces.com/api/user.status?` +
            `handle=${encodeURIComponent(handle)}` +
            `&from=1&count=${count}` +
            `&_t=${cacheBuster}`;

        console.log("Fetching Codeforces:", apiUrl);

        // ==================================
        // Request to Codeforces
        // ==================================
        const cfResponse = await fetch(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; CF-Tracker/2.0)',
                'Accept': 'application/json',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            },
            cache: 'no-store'
        });

        // ==================================
        // HTTP Error
        // ==================================
        if (!cfResponse.ok) {
            return response.status(cfResponse.status).json({
                status: "FAILED",
                comment: `Codeforces returned HTTP ${cfResponse.status}`
            });
        }

        // ==================================
        // Parse JSON
        // ==================================
        const data = await cfResponse.json();

        console.log("Codeforces response status:", data.status);
        console.log("Total submissions:", data.result?.length || 0);

        // ==================================
        // Debug: Log submission range
        // ==================================
        if (data.result && data.result.length > 0) {
            const newest = data.result[0];
            const oldest = data.result[data.result.length - 1];

            console.log("=== SUBMISSION RANGE ===");
            console.log("NEWEST:", {
                id: newest.id,
                time: new Date(newest.creationTimeSeconds * 1000).toISOString(),
                problem: newest.problem?.name
            });
            console.log("OLDEST:", {
                id: oldest.id,
                time: new Date(oldest.creationTimeSeconds * 1000).toISOString(),
                problem: oldest.problem?.name
            });
            console.log("========================");
        }

        // ==================================
        // Codeforces Error
        // ==================================
        if (data.status !== "OK") {
            return response.status(400).json({
                status: "FAILED",
                comment: data.comment || "Codeforces API error"
            });
        }

        // ==================================
        // Sort by newest first (confirm order)
        // ==================================
        const sortedResult = [...data.result].sort(
            (a, b) => b.creationTimeSeconds - a.creationTimeSeconds
        );

        // ==================================
        // Success Response
        // ==================================
        return response.status(200).json({
            status: "OK",
            result: sortedResult,
            _meta: {
                total: sortedResult.length,
                newest: sortedResult[0]?.creationTimeSeconds,
                oldest: sortedResult[sortedResult.length - 1]?.creationTimeSeconds,
                timestamp: Date.now()
            }
        });

    } catch (error) {
        console.error("Codeforces Proxy Error:", error);

        return response.status(500).json({
            status: "FAILED",
            comment: error.message || "Failed to connect to Codeforces API"
        });
    }
}
