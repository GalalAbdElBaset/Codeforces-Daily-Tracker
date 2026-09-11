// ==========================================
// Codeforces Daily Tracker - Simple Version
// يعرض كل الأيام اللي فيها submissions
// ==========================================

// ==========================================
// Cairo Date Helper
// ==========================================

function getCairoDate(timestamp) {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Africa/Cairo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(new Date(timestamp * 1000));
}

function formatCairoDate(dateString) {
    const [year, month, day] = dateString.split("-");
    const months = [
        "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
        "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
    ];
    return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;
}

function formatTime(timestamp) {
    return new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
        timeZone: "Africa/Cairo",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    }).format(new Date(timestamp * 1000));
}

// ==========================================
// Initialize
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    const handleInput = document.getElementById("handleInput");
    handleInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") searchUser();
    });
    
    // Auto search if handle in URL
    const urlParams = new URLSearchParams(window.location.search);
    const handle = urlParams.get("handle");
    if (handle) {
        handleInput.value = handle;
        searchUser();
    }
});

// ==========================================
// Loading & Error
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

function showError(message) {
    const errorDiv = document.getElementById("errorMessage");
    errorDiv.textContent = message;
    errorDiv.classList.remove("hidden");
    document.getElementById("results").classList.add("hidden");
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
        CHALLENGED: "⚔️ تم التحدي",
        SKIPPED: "⏭️ تم التخطي",
        TESTING: "🔄 جاري الاختبار",
        REJECTED: "🚫 مرفوض",
        PARTIAL: "🔶 قبول جزئي",
        UNKNOWN: "❓ غير معروف"
    };
    return verdicts[verdict] || verdict || "❓ غير معروف";
}

// ==========================================
// Fetch API
// ==========================================

async function fetchCodeforcesAPI(handle) {
    const apiUrl = `/api/codeforces?handle=${encodeURIComponent(handle)}`;

    const response = await fetch(apiUrl, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store"
    });

    if (!response.ok) {
        let errorData = null;
        try { errorData = await response.json(); } catch (e) {}
        throw new Error(errorData?.comment || `HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data || data.status !== "OK") {
        throw new Error(data?.comment || "فشل في جلب البيانات");
    }

    return data.result;
}

// ==========================================
// Main Search
// ==========================================

async function searchUser() {
    const handle = document.getElementById("handleInput").value.trim();

    if (!handle) {
        showError("⚠️ الرجاء إدخال اسم الهاندل");
        return;
    }

    hideError();
    document.getElementById("results").classList.add("hidden");
    setLoading(true);

    try {
        const submissions = await fetchCodeforcesAPI(handle);
        
        console.log(`Total submissions: ${submissions.length}`);
        
        if (!submissions || submissions.length === 0) {
            showError(`📭 لا توجد أي محاولات للمستخدم "${handle}"`);
            return;
        }

        displayAllDays(submissions, handle);

    } catch (error) {
        console.error("Error:", error);
        showError(`❌ ${error.message}`);
    } finally {
        setLoading(false);
    }
}

// ==========================================
// Display All Days (الوظيفة الرئيسية)
// ==========================================

function displayAllDays(submissions, handle) {
    // Group submissions by Cairo date
    const daysMap = new Map();

    submissions.forEach((sub) => {
        if (!sub.problem) return;
        
        const date = getCairoDate(sub.creationTimeSeconds);
        
        if (!daysMap.has(date)) {
            daysMap.set(date, []);
        }
        daysMap.get(date).push(sub);
    });

    // Sort days descending (newest first)
    const sortedDays = [...daysMap.entries()].sort((a, b) => 
        b[0].localeCompare(a[0])
    );

    // Update summary
    document.getElementById("userHandle").textContent = `👤 ${handle}`;
    document.getElementById("totalSubmissions").textContent = submissions.length;
    document.getElementById("totalDays").textContent = sortedDays.length;

    // Render days
    const daysList = document.getElementById("daysList");
    daysList.innerHTML = sortedDays.map(([date, daySubmissions]) => 
        renderDay(date, daySubmissions)
    ).join("");

    // Show results
    document.getElementById("results").classList.remove("hidden");
}

// ==========================================
// Render a Single Day
// ==========================================

function renderDay(date, submissions) {
    // Split solved and wrong
    const solved = [];
    const wrong = [];
    const uniqueSolved = new Set();

    submissions.forEach((sub) => {
        const problem = sub.problem;
        if (!problem) return;

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

        if (sub.verdict === "OK") {
            solved.push(problemInfo);
            uniqueSolved.add(`${problem.contestId}-${problem.index}`);
        } else if (sub.verdict && sub.verdict !== "TESTING" && sub.verdict !== "SKIPPED") {
            wrong.push(problemInfo);
        }
    });

    // Sort by time
    solved.sort((a, b) => a.time - b.time);
    wrong.sort((a, b) => a.time - b.time);

    const solvedHTML = solved.length > 0
        ? solved.map((p) => renderProblem(p, true)).join("")
        : '<div class="empty-mini">لا توجد مسائل محلولة</div>';

    const wrongHTML = wrong.length > 0
        ? wrong.map((p) => renderProblem(p, false)).join("")
        : '<div class="empty-mini">لا توجد محاولات خاطئة</div>';

    return `
        <div class="day-card">
            <div class="day-header">
                <div class="day-date">
                    <span class="day-icon">📅</span>
                    <span class="day-text">${formatCairoDate(date)}</span>
                </div>
                <div class="day-stats">
                    <span class="stat-pill solved-pill">✅ ${solved.length} محلولة</span>
                    <span class="stat-pill wrong-pill">❌ ${wrong.length} خاطئة</span>
                    <span class="stat-pill unique-pill">🎯 ${uniqueSolved.size} فريدة</span>
                </div>
            </div>
            
            ${solved.length > 0 ? `
                <div class="day-section">
                    <h4 class="day-section-title">✅ مسائل محلولة (${solved.length})</h4>
                    <div class="problems-list">${solvedHTML}</div>
                </div>
            ` : ""}
            
            ${wrong.length > 0 ? `
                <div class="day-section">
                    <h4 class="day-section-title">❌ محاولات خاطئة (${wrong.length})</h4>
                    <div class="problems-list">${wrongHTML}</div>
                </div>
            ` : ""}
        </div>
    `;
}

// ==========================================
// Render Problem Item
// ==========================================

function renderProblem(problem, isSolved) {
    const tagsHTML = problem.tags.length > 0
        ? `<div class="problem-tags">${problem.tags.slice(0, 4).map(tag =>
            `<span class="tag">${escapeHTML(tag)}</span>`
        ).join("")}</div>`
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
                    <span>🕐 ${formatTime(problem.time)}</span>
                </div>
                ${tagsHTML}
            </div>
            <span class="verdict-badge ${isSolved ? "accepted" : "wrong"}">
                ${formatVerdict(problem.verdict)}
            </span>
        </div>
    `;
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
// Global
// ==========================================

window.searchUser = searchUser;
