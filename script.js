// ==========================================
// Codeforces Daily Tracker
// ==========================================

// ==========================================
// Get today's date in Cairo timezone
// ==========================================

function getTodayDate() {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Africa/Cairo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(new Date());
}

// ==========================================
// Initialize
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    const dateInput = document.getElementById("dateInput");
    const handleInput = document.getElementById("handleInput");

    // Put today's date
    dateInput.value = getTodayDate();

    // Press Enter to search
    handleInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            searchUser();
        }
    });
});

// ==========================================
// Loading
// ==========================================

function setLoading(isLoading) {
    const btn = document.getElementById("searchBtn");
    const loader = document.getElementById("loader");
    const btnText = btn.querySelector(".btn-text");

    if (isLoading) {
        btn.disabled = true;
        loader.classList.add("active");
        btnText.textContent = "جاري البحث...";
    } else {
        btn.disabled = false;
        loader.classList.remove("active");
        btnText.textContent = "بحث";
    }
}

// ==========================================
// Error
// ==========================================

function showError(message) {
    const errorDiv = document.getElementById("errorMessage");

    errorDiv.textContent = message;
    errorDiv.classList.remove("hidden");
}

function hideError() {
    document
        .getElementById("errorMessage")
        .classList.add("hidden");
}

// ==========================================
// Format Verdict
// ==========================================

function formatVerdict(verdict) {
    const verdicts = {
        OK: "✅ مقبول",
        WRONG_ANSWER: "❌ إجابة خاطئة",
        TIME_LIMIT_EXCEEDED: "⏱️ تجاوز الوقت",
        MEMORY_LIMIT_EXCEEDED: "💾 تجاوز الذاكرة",
        RUNTIME_ERROR: "💥 خطأ في التشغيل",
        COMPILATION_ERROR: "🔧 خطأ في الترجمة",
        PRESENTATION_ERROR: "📝 خطأ في العرض",
        IDLENESS_LIMIT_EXCEEDED: "⏸️ تجاوز حد الخمول",
        SECURITY_VIOLATED: "🔒 انتهاك أمني",
        CRASHED: "💔 انهيار",
        INPUT_PREPARATION_CRASHED: "📥 انهيار تحضير المدخلات",
        CHALLENGED: "⚔️ تم التحدي",
        SKIPPED: "⏭️ تم التخطي",
        TESTING: "🔄 جاري الاختبار",
        REJECTED: "🚫 مرفوض",
        PARTIAL: "🔶 قبول جزئي",
        ACCEPTED: "✅ مقبول",
        UNKNOWN: "❓ غير معروف"
    };

    return verdicts[verdict] || verdict;
}

// ==========================================
// Verdict Class
// ==========================================

function getVerdictClass(verdict) {
    return verdict === "OK" ? "accepted" : "wrong";
}

// ==========================================
// Format Date
// ==========================================

function formatDate(timestamp) {
    const date = new Date(timestamp * 1000);

    return new Intl.DateTimeFormat("ar-EG", {
        timeZone: "Africa/Cairo",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    }).format(date);
}

// ==========================================
// Get Date in Cairo
// ==========================================

function getCairoDate(timestamp) {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Africa/Cairo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(new Date(timestamp * 1000));
}

// ==========================================
// Fetch Codeforces API
// ==========================================

async function fetchCodeforcesAPI(handle) {

    // ======================================
    // Our own Vercel API
    // ======================================

    const apiUrl =
        `/api/codeforces?handle=${encodeURIComponent(handle)}`;

    console.log("Request URL:", apiUrl);

    let response;

    // ======================================
    // Fetch
    // ======================================

    try {

        response = await fetch(apiUrl, {
            method: "GET",
            headers: {
                "Accept": "application/json"
            },
            cache: "no-store"
        });

    } catch (error) {

        console.error("Fetch Error:", error);

        throw new Error(
            "تعذر الاتصال بالسيرفر. تأكد من الإنترنت وحاول مرة أخرى."
        );
    }

    // ======================================
    // HTTP Error
    // ======================================

    if (!response.ok) {

        let errorData = null;

        try {
            errorData = await response.json();
        } catch (error) {
            // Ignore JSON parsing error
        }

        throw new Error(
            errorData?.comment ||
            `الخادم أعاد خطأ HTTP ${response.status}`
        );
    }

    // ======================================
    // JSON
    // ======================================

    let data;

    try {

        data = await response.json();

    } catch (error) {

        console.error("JSON Error:", error);

        throw new Error(
            "الخادم أرسل استجابة غير صالحة."
        );
    }

    console.log("API Response:", data);

    // ======================================
    // API Error
    // ======================================

    if (!data || data.status !== "OK") {

        throw new Error(
            data?.comment ||
            "Codeforces API لم يرجع بيانات صحيحة."
        );
    }

    return data.result;
}

// ==========================================
// Main Search Function
// ==========================================

async function searchUser() {

    const handleInput =
        document.getElementById("handleInput");

    const dateInput =
        document.getElementById("dateInput");

    const handle =
        handleInput.value.trim();

    const selectedDate =
        dateInput.value;

    // ======================================
    // Validation
    // ======================================

    if (!handle) {

        showError(
            "⚠️ الرجاء إدخال اسم الهاندل"
        );

        return;
    }

    if (!selectedDate) {

        showError(
            "⚠️ الرجاء اختيار التاريخ"
        );

        return;
    }

    hideError();

    document
        .getElementById("results")
        .classList.add("hidden");

    setLoading(true);

    try {

        // ==================================
        // Get submissions
        // ==================================

        const submissions =
            await fetchCodeforcesAPI(handle);

        // ==================================
        // Process
        // ==================================

        processSubmissions(
            submissions,
            selectedDate,
            handle
        );

    } catch (error) {

        console.error(
            "Search Error:",
            error
        );

        const message =
            error.message || "";

        // ==================================
        // User not found
        // ==================================

        if (
            message.toLowerCase().includes("not found") ||
            message.toLowerCase().includes("handle")
        ) {

            showError(
                `👤 لم يتم العثور على المستخدم "${handle}". تأكد من كتابة الـ Handle بشكل صحيح.`
            );

        }

        // ==================================
        // Rate limit
        // ==================================

        else if (
            message.toLowerCase().includes("call limit")
        ) {

            showError(
                "⏳ Codeforces رفض الطلب مؤقتًا بسبب كثرة الطلبات. حاول بعد ثوانٍ."
            );

        }

        // ==================================
        // Other errors
        // ==================================

        else {

            showError(
                `❌ ${message}`
            );
        }

    } finally {

        setLoading(false);
    }
}

// ==========================================
// Process Submissions
// ==========================================

function processSubmissions(
    submissions,
    selectedDate,
    handle
) {

    // ======================================
    // Filter by Cairo date
    // ======================================

    const daySubmissions =
        submissions.filter((sub) => {

            return (
                getCairoDate(
                    sub.creationTimeSeconds
                ) === selectedDate
            );

        });

    // ======================================
    // No submissions
    // ======================================

    if (daySubmissions.length === 0) {

        document
            .getElementById("results")
            .classList.remove("hidden");

        document
            .getElementById("solvedCount")
            .textContent = "0";

        document
            .getElementById("wrongCount")
            .textContent = "0";

        document
            .getElementById("totalCount")
            .textContent = "0";

        document
            .getElementById("uniqueCount")
            .textContent = "0";

        renderProblems(
            "solvedProblems",
            [],
            true
        );

        renderProblems(
            "wrongProblems",
            [],
            false
        );

        showError(
            `📭 لا توجد أي محاولات للمستخدم "${handle}" بتاريخ ${selectedDate}`
        );

        return;
    }

    // ======================================
    // Arrays
    // ======================================

    const solvedProblems = [];
    const wrongProblems = [];

    const uniqueSolvedProblems =
        new Set();

    // ======================================
    // Process submissions
    // ======================================

    daySubmissions.forEach((sub) => {

        const problem =
            sub.problem;

        const problemKey =
            `${problem.contestId}-${problem.index}`;

        const problemInfo = {

            name: problem.name,

            index: problem.index,

            contestId: problem.contestId,

            rating:
                problem.rating || "غير محدد",

            tags:
                problem.tags || [],

            verdict:
                sub.verdict,

            language:
                sub.programmingLanguage,

            time:
                sub.creationTimeSeconds,

            problemUrl:
                `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`
        };

        // ==================================
        // Accepted
        // ==================================

        if (sub.verdict === "OK") {

            solvedProblems.push(
                problemInfo
            );

            uniqueSolvedProblems.add(
                problemKey
            );

        }

        // ==================================
        // Wrong
        // ==================================

        else {

            wrongProblems.push(
                problemInfo
            );
        }
    });

    // ======================================
    // Statistics
    // ======================================

    document
        .getElementById("solvedCount")
        .textContent =
        solvedProblems.length;

    document
        .getElementById("wrongCount")
        .textContent =
        wrongProblems.length;

    document
        .getElementById("totalCount")
        .textContent =
        daySubmissions.length;

    document
        .getElementById("uniqueCount")
        .textContent =
        uniqueSolvedProblems.size;

    // ======================================
    // Render
    // ======================================

    renderProblems(
        "solvedProblems",
        solvedProblems,
        true
    );

    renderProblems(
        "wrongProblems",
        wrongProblems,
        false
    );

    // ======================================
    // Show results
    // ======================================

    document
        .getElementById("results")
        .classList.remove("hidden");
}

// ==========================================
// Render Problems
// ==========================================

function renderProblems(
    containerId,
    problems,
    isSolved
) {

    const container =
        document.getElementById(containerId);

    // ======================================
    // Empty
    // ======================================

    if (problems.length === 0) {

        container.innerHTML = `
            <div class="empty-state">

                <span class="icon">
                    ${isSolved ? "📝" : "🎉"}
                </span>

                <p>
                    ${
                        isSolved
                            ? "لا توجد مسائل محلولة في هذا اليوم"
                            : "لا توجد محاولات خاطئة في هذا اليوم"
                    }
                </p>

            </div>
        `;

        return;
    }

    // ======================================
    // Sort by time
    // ======================================

    problems.sort(
        (a, b) => a.time - b.time
    );

    // ======================================
    // Render
    // ======================================

    container.innerHTML =
        problems.map((problem) => {

            const tagsHTML =
                problem.tags.length > 0
                    ? `
                        <div class="problem-tags">

                            ${problem.tags
                                .slice(0, 5)
                                .map(
                                    (tag) =>
                                        `<span class="tag">${escapeHTML(tag)}</span>`
                                )
                                .join("")}

                        </div>
                    `
                    : "";

            const ratingHTML =
                problem.rating !== "غير محدد"
                    ? `
                        <span class="problem-rating">
                            ⭐ ${problem.rating}
                        </span>
                    `
                    : "";

            return `
                <div class="problem-item ${
                    isSolved
                        ? "solved-item"
                        : "wrong-item"
                }">

                    <div class="problem-info">

                        <a
                            href="${problem.problemUrl}"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="problem-name"
                        >
                            ${problem.contestId}${escapeHTML(problem.index)}
                            - ${escapeHTML(problem.name)}
                        </a>

                        <div class="problem-meta">

                            ${ratingHTML}

                            <span>
                                💻 ${escapeHTML(problem.language)}
                            </span>

                            <span>
                                🕐 ${formatDate(problem.time)}
                            </span>

                        </div>

                        ${tagsHTML}

                    </div>

                    <span class="verdict-badge ${
                        getVerdictClass(problem.verdict)
                    }">

                        ${formatVerdict(problem.verdict)}

                    </span>

                </div>
            `;
        }).join("");
}

// ==========================================
// Escape HTML
// ==========================================

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent =
        String(text ?? "");

    return div.innerHTML;
}

// ==========================================
// Global Function
// ==========================================

window.searchUser = searchUser;