// ==========================================
// Codeforces Daily Tracker - Fixed Version
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
// Convert timestamp to Cairo date (YYYY-MM-DD)
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
// Format Date for display (Arabic, with Western digits)
// ==========================================

function formatDate(timestamp) {
    const date = new Date(timestamp * 1000);

    // Use en-GB for date part (keeps Western digits) 
    // then convert month name to Arabic manually for consistency
    return new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
        timeZone: "Africa/Cairo",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    }).format(date);
}

// ==========================================
// Initialize
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    const dateInput = document.getElementById("dateInput");
    const handleInput = document.getElementById("handleInput");

    // Today's date (Cairo timezone)
    dateInput.value = getTodayDate();

    // Enter key triggers search
    handleInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            searchUser();
        }
    });
});

// ==========================================
// Loading State
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
// Error Handling
// ==========================================

function showError(message) {
    const errorDiv = document.getElementById("errorMessage");
    errorDiv.textContent = message;
    errorDiv.classList.remove("hidden");
}

function hideError() {
    document.getElementById("errorMessage").classList.add("hidden");
}

// ==========================================
// Verdict Formatting
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

    return verdicts[verdict] || verdict || "❓ غير معروف";
}

function getVerdictClass(verdict) {
    return verdict === "OK" ? "accepted" : "wrong";
}

// ==========================================
// Fetch Codeforces API
// ==========================================

async function fetchCodeforcesAPI(handle) {
    const apiUrl = `/api/codeforces?handle=${encodeURIComponent(handle)}`;

    console.log("Request URL:", apiUrl);

    let response;

    try {
        response = await fetch(apiUrl, {
            method: "GET",
            headers: { Accept: "application/json" },
            cache: "no-store"
        });
    } catch (error) {
        console.error("Fetch Error:", error);
        throw new Error("تعذر الاتصال بالسيرفر.");
    }

    if (!response.ok) {
        let errorData = null;
        try {
            errorData = await response.json();
        } catch (error) {
            // Ignore
        }
        throw new Error(
            errorData?.comment ||
            `الخادم أعاد خطأ HTTP ${response.status}`
        );
    }

    let data;
    try {
        data = await response.json();
    } catch (error) {
        console.error("JSON Error:", error);
        throw new Error("الخادم أرسل استجابة غير صالحة.");
    }

    console.log("API Response:", data);

    if (!data || data.status !== "OK") {
        throw new Error(
            data?.comment ||
            "Codeforces API لم يرجع بيانات صحيحة."
        );
    }

    return data.result;
}

// ==========================================
// Main Search
// ==========================================

async function searchUser() {
    const handleInput = document.getElementById("handleInput");
    const dateInput = document.getElementById("dateInput");

    const handle = handleInput.value.trim();
    const selectedDate = dateInput.value;

    // Validation
    if (!handle) {
        showError("⚠️ الرجاء إدخال اسم الهاندل");
        return;
    }

    if (!selectedDate) {
        showError("⚠️ الرجاء اختيار التاريخ");
        return;
    }

    hideError();
    document.getElementById("results").classList.add("hidden");
    setLoading(true);

    try {
        const submissions = await fetchCodeforcesAPI(handle);

        console.log(`Total submissions received: ${submissions.length}`);

        // Debug: show all submission dates in Cairo timezone
        console.table(
            submissions.slice(0, 20).map((sub) => ({
                id: sub.id,
                date: getCairoDate(sub.creationTimeSeconds),
                time: formatDate(sub.creationTimeSeconds),
                verdict: sub.verdict,
                problem: sub.problem?.name
            }))
        );

        processSubmissions(submissions, selectedDate, handle);

    } catch (error) {
        console.error("Search Error:", error);
        const message = error.message || "";

        if (message.toLowerCase().includes("not found")) {
            showError(`👤 لم يتم العثور على المستخدم "${handle}".`);
        } else {
            showError(`❌ ${message}`);
        }
    } finally {
        setLoading(false);
    }
}

// ==========================================
// Process Submissions
// ==========================================

function processSubmissions(submissions, selectedDate, handle) {
    console.log("Selected date:", selectedDate);

    // Filter by Cairo date
    const daySubmissions = submissions.filter((sub) => {
        const submissionDate = getCairoDate(sub.creationTimeSeconds);
        return submissionDate === selectedDate;
    });

    console.log("Submissions for selected date:", daySubmissions);
    console.log("Number of submissions for selected date:", daySubmissions.length);

    // Reset statistics first
    document.getElementById("solvedCount").textContent = "0";
    document.getElementById("wrongCount").textContent = "0";
    document.getElementById("totalCount").textContent = "0";
    document.getElementById("uniqueCount").textContent = "0";
    renderProblems("solvedProblems", [], true);
    renderProblems("wrongProblems", [], false);

    // No submissions
    if (daySubmissions.length === 0) {
        document.getElementById("results").classList.remove("hidden");

        // Show helpful info: latest submission dates
        const latestDates = [...new Set(
            submissions
                .slice(0, 50)
                .map((sub) => getCairoDate(sub.creationTimeSeconds))
        )].slice(0, 5).join(" / ");

        showError(
            `📭 لا توجد أي محاولات للمستخدم "${handle}" بتاريخ ${formatSelectedDate(selectedDate)}.\n` +
            `💡 آخر تواريخ فيها محاولات: ${latestDates}`
        );

        return;
    }

    // Arrays
    const solvedProblems = [];
    const wrongProblems = [];
    const uniqueSolvedProblems = new Set();

    // Process
    daySubmissions.forEach((sub) => {
        const problem = sub.problem;
        if (!problem) return;

        const problemKey = `${problem.contestId}-${problem.index}`;

        const problemInfo = {
            name: problem.name,
            index: problem.index,
            contestId: problem.contestId,
            rating: problem.rating || "غير محدد",
            tags: problem.tags || [],
            verdict: sub.verdict,
            language: sub.programmingLanguage || "غير محدد",
            time: sub.creationTimeSeconds,
            problemUrl: `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`
        };

        // Accepted
        if (sub.verdict === "OK") {
            solvedProblems.push(problemInfo);
            uniqueSolvedProblems.add(problemKey);
        }
        // Wrong (skip null verdicts - pending submissions)
        else if (sub.verdict && sub.verdict !== "TESTING" && sub.verdict !== "SKIPPED") {
            wrongProblems.push(problemInfo);
        }
    });

    // Update Statistics
    document.getElementById("solvedCount").textContent = solvedProblems.length;
    document.getElementById("wrongCount").textContent = wrongProblems.length;
    document.getElementById("totalCount").textContent = daySubmissions.length;
    document.getElementById("uniqueCount").textContent = uniqueSolvedProblems.size;

    // Render
    renderProblems("solvedProblems", solvedProblems, true);
    renderProblems("wrongProblems", wrongProblems, false);

    // Show results
    document.getElementById("results").classList.remove("hidden");
}

// ==========================================
// Format Selected Date
// ==========================================

function formatSelectedDate(dateString) {
    const [year, month, day] = dateString.split("-");
    return `${day}-${month}-${year}`;
}

// ==========================================
// Render Problems
// ==========================================

function renderProblems(containerId, problems, isSolved) {
    const container = document.getElementById(containerId);

    // Empty state
    if (problems.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="icon">${isSolved ? "📝" : "🎉"}</span>
                <p>${isSolved ? "لا توجد مسائل محلولة في هذا اليوم" : "لا توجد محاولات خاطئة في هذا اليوم"}</p>
            </div>
        `;
        return;
    }

    // Sort by time (earliest first)
    problems.sort((a, b) => a.time - b.time);

    // Render
    container.innerHTML = problems.map((problem) => {
        const tagsHTML = problem.tags.length > 0
            ? `
                <div class="problem-tags">
                    ${problem.tags.slice(0, 5).map((tag) =>
                        `<span class="tag">${escapeHTML(tag)}</span>`
                    ).join("")}
                </div>
            `
            : "";

        const ratingHTML = problem.rating !== "غير محدد"
            ? `<span class="problem-rating">⭐ ${escapeHTML(problem.rating)}</span>`
            : "";

        return `
            <div class="problem-item ${isSolved ? "solved-item" : "wrong-item"}">
                <div class="problem-info">
                    <a href="${problem.problemUrl}" target="_blank" rel="noopener noreferrer" class="problem-name">
                        ${escapeHTML(problem.contestId)}${escapeHTML(problem.index)} - ${escapeHTML(problem.name)}
                    </a>
                    <div class="problem-meta">
                        ${ratingHTML}
                        <span>💻 ${escapeHTML(problem.language)}</span>
                        <span>🕐 ${formatDate(problem.time)}</span>
                    </div>
                    ${tagsHTML}
                </div>
                <span class="verdict-badge ${getVerdictClass(problem.verdict)}">
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
    const div = document.createElement("div");
    div.textContent = String(text ?? "");
    return div.innerHTML;
}

// ==========================================
// Global Function
// ==========================================

window.searchUser = searchUser;
