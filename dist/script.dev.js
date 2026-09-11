"use strict";

// Codeforces Daily Tracker - JavaScript
// CORS Proxy - Codeforces API لا يدعم CORS مباشرة
var CORS_PROXY = 'https://corsproxy.io/?';
var CF_API_BASE = 'https://codeforces.com/api'; // Get today's date in YYYY-MM-DD format

function getTodayDate() {
  var today = new Date();
  return today.toISOString().split('T')[0];
} // Initialize date input with today's date


document.addEventListener('DOMContentLoaded', function () {
  var dateInput = document.getElementById('dateInput');
  dateInput.value = getTodayDate(); // Allow Enter key to trigger search

  document.getElementById('handleInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') searchUser();
  });
}); // Show loading state

function setLoading(isLoading) {
  var btn = document.getElementById('searchBtn');
  var loader = document.getElementById('loader');
  var btnText = btn.querySelector('.btn-text');

  if (isLoading) {
    btn.disabled = true;
    loader.classList.add('active');
    btnText.textContent = 'جاري البحث...';
  } else {
    btn.disabled = false;
    loader.classList.remove('active');
    btnText.textContent = 'بحث';
  }
} // Show error message


function showError(message) {
  var errorDiv = document.getElementById('errorMessage');
  errorDiv.textContent = message;
  errorDiv.classList.remove('hidden');
  document.getElementById('results').classList.add('hidden');
} // Hide error message


function hideError() {
  document.getElementById('errorMessage').classList.add('hidden');
} // Format verdict in Arabic


function formatVerdict(verdict) {
  var verdicts = {
    'OK': '✅ مقبول',
    'WRONG_ANSWER': '❌ إجابة خاطئة',
    'TIME_LIMIT_EXCEEDED': '⏱️ تجاوز الوقت',
    'MEMORY_LIMIT_EXCEEDED': '💾 تجاوز الذاكرة',
    'RUNTIME_ERROR': '💥 خطأ في التشغيل',
    'COMPILATION_ERROR': '🔧 خطأ في الترجمة',
    'PRESENTATION_ERROR': '📝 خطأ في العرض',
    'IDLENESS_LIMIT_EXCEEDED': '⏸️ تجاوز حد الخمول',
    'SECURITY_VIOLATED': '🔒 انتهاك أمني',
    'CRASHED': '💔 انهيار',
    'INPUT_PREPARATION_CRASHED': '📥 انهيار تحضير المدخلات',
    'CHALLENGED': '⚔️ تم التحدي',
    'SKIPPED': '⏭️ تم التخطي',
    'TESTING': '🔄 جاري الاختبار',
    'REJECTED': '🚫 مرفوض',
    'PARTIAL': '🔶 قبول جزئي',
    'ACCEPTED': '✅ مقبول',
    'UNKNOWN': '❓ غير معروف'
  };
  return verdicts[verdict] || verdict;
} // Get verdict class


function getVerdictClass(verdict) {
  return verdict === 'OK' ? 'accepted' : 'wrong';
} // Format date


function formatDate(timestamp) {
  var date = new Date(timestamp * 1000);
  return date.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
} // Main search function


function searchUser() {
  var handle, selectedDate, apiUrl, response, data;
  return regeneratorRuntime.async(function searchUser$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          handle = document.getElementById('handleInput').value.trim();
          selectedDate = document.getElementById('dateInput').value; // Validation

          if (handle) {
            _context.next = 5;
            break;
          }

          showError('⚠️ الرجاء إدخال اسم الهاندل');
          return _context.abrupt("return");

        case 5:
          if (selectedDate) {
            _context.next = 8;
            break;
          }

          showError('⚠️ الرجاء اختيار التاريخ');
          return _context.abrupt("return");

        case 8:
          hideError();
          setLoading(true);
          _context.prev = 10;
          // Fetch user submissions from Codeforces API
          // user.status returns all submissions for a user [citation:7][citation:12]
          apiUrl = "".concat(CF_API_BASE, "/user.status?handle=").concat(encodeURIComponent(handle));
          _context.next = 14;
          return regeneratorRuntime.awrap(fetch(CORS_PROXY + encodeURIComponent(apiUrl)));

        case 14:
          response = _context.sent;

          if (response.ok) {
            _context.next = 17;
            break;
          }

          throw new Error('فشل الاتصال بالخادم');

        case 17:
          _context.next = 19;
          return regeneratorRuntime.awrap(response.json());

        case 19:
          data = _context.sent;

          if (!(data.status === 'FAILED')) {
            _context.next = 22;
            break;
          }

          throw new Error(data.comment || 'فشل في جلب البيانات. تأكد من صحة اسم الهاندل.');

        case 22:
          // Process submissions
          processSubmissions(data.result, selectedDate, handle);
          _context.next = 29;
          break;

        case 25:
          _context.prev = 25;
          _context.t0 = _context["catch"](10);
          console.error('Error:', _context.t0);

          if (_context.t0.message.includes('Failed to fetch')) {
            showError('🔌 فشل الاتصال بالخادم. قد يكون هناك مشكلة في الشبكة أو وكيل CORS. حاول مرة أخرى.');
          } else if (_context.t0.message.includes('not found') || _context.t0.message.includes('handle')) {
            showError('👤 لم يتم العثور على المستخدم. تأكد من صحة اسم الهاندل.');
          } else {
            showError('❌ ' + _context.t0.message);
          }

        case 29:
          _context.prev = 29;
          setLoading(false);
          return _context.finish(29);

        case 32:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[10, 25, 29, 32]]);
} // Process submissions and filter by date


function processSubmissions(submissions, selectedDate, handle) {
  // Filter submissions for the selected date
  var targetDate = new Date(selectedDate);
  targetDate.setHours(0, 0, 0, 0);
  var nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);
  var targetTimestamp = Math.floor(targetDate.getTime() / 1000);
  var nextDayTimestamp = Math.floor(nextDay.getTime() / 1000); // Filter submissions for the selected day

  var daySubmissions = submissions.filter(function (sub) {
    var subTime = sub.creationTimeSeconds;
    return subTime >= targetTimestamp && subTime < nextDayTimestamp;
  });

  if (daySubmissions.length === 0) {
    showError("\uD83D\uDCED \u0644\u0627 \u062A\u0648\u062C\u062F \u0645\u062D\u0627\u0648\u0644\u0627\u062A \u0644\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \"".concat(handle, "\" \u0628\u062A\u0627\u0631\u064A\u062E ").concat(selectedDate));
    return;
  } // Separate solved and wrong submissions


  var solvedProblems = [];
  var wrongProblems = [];
  var uniqueSolvedProblems = new Set();
  var uniqueWrongProblems = new Set();
  daySubmissions.forEach(function (sub) {
    var problemInfo = {
      name: sub.problem.name,
      index: sub.problem.index,
      contestId: sub.problem.contestId,
      rating: sub.problem.rating || 'غير محدد',
      tags: sub.problem.tags || [],
      verdict: sub.verdict,
      language: sub.programmingLanguage,
      time: sub.creationTimeSeconds,
      problemUrl: "https://codeforces.com/problemset/problem/".concat(sub.problem.contestId, "/").concat(sub.problem.index)
    };

    if (sub.verdict === 'OK') {
      solvedProblems.push(problemInfo);
      uniqueSolvedProblems.add("".concat(sub.problem.contestId, "-").concat(sub.problem.index));
    } else {
      wrongProblems.push(problemInfo);
      uniqueWrongProblems.add("".concat(sub.problem.contestId, "-").concat(sub.problem.index));
    }
  }); // Update statistics

  document.getElementById('solvedCount').textContent = solvedProblems.length;
  document.getElementById('wrongCount').textContent = wrongProblems.length;
  document.getElementById('totalCount').textContent = daySubmissions.length;
  document.getElementById('uniqueCount').textContent = uniqueSolvedProblems.size; // Render solved problems

  renderProblems('solvedProblems', solvedProblems, true); // Render wrong problems

  renderProblems('wrongProblems', wrongProblems, false); // Show results

  document.getElementById('results').classList.remove('hidden');
} // Render problems list


function renderProblems(containerId, problems, isSolved) {
  var container = document.getElementById(containerId);

  if (problems.length === 0) {
    container.innerHTML = "\n            <div class=\"empty-state\">\n                <span class=\"icon\">".concat(isSolved ? '📝' : '🎉', "</span>\n                <p>").concat(isSolved ? 'لا توجد مسائل محلولة في هذا اليوم' : 'لا توجد محاولات خاطئة في هذا اليوم', "</p>\n            </div>\n        ");
    return;
  } // Sort by time


  problems.sort(function (a, b) {
    return a.time - b.time;
  });
  container.innerHTML = problems.map(function (problem) {
    return "\n        <div class=\"problem-item ".concat(isSolved ? 'solved-item' : 'wrong-item', "\">\n            <div class=\"problem-info\">\n                <a href=\"").concat(problem.problemUrl, "\" target=\"_blank\" class=\"problem-name\">\n                    ").concat(problem.contestId).concat(problem.index, " - ").concat(problem.name, "\n                </a>\n                <div class=\"problem-meta\">\n                    ").concat(problem.rating !== 'غير محدد' ? "<span class=\"problem-rating\">\u2B50 ".concat(problem.rating, "</span>") : '', "\n                    <span>\uD83D\uDCBB ").concat(problem.language, "</span>\n                    <span>\uD83D\uDD50 ").concat(formatDate(problem.time), "</span>\n                </div>\n                ").concat(problem.tags.length > 0 ? "\n                    <div class=\"problem-tags\">\n                        ".concat(problem.tags.slice(0, 5).map(function (tag) {
      return "<span class=\"tag\">".concat(tag, "</span>");
    }).join(''), "\n                    </div>\n                ") : '', "\n            </div>\n            <span class=\"verdict-badge ").concat(getVerdictClass(problem.verdict), "\">\n                ").concat(formatVerdict(problem.verdict), "\n            </span>\n        </div>\n    ");
  }).join('');
} // Export functions for global access


window.searchUser = searchUser;
//# sourceMappingURL=script.dev.js.map
