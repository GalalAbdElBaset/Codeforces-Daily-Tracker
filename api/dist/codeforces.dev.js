"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = handler;

function handler(request, response) {
  var handle, apiUrl, cfResponse, data;
  return regeneratorRuntime.async(function handler$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          // ==============================
          // Get handle
          // ==============================
          handle = request.query.handle;

          if (handle) {
            _context.next = 4;
            break;
          }

          return _context.abrupt("return", response.status(400).json({
            status: "FAILED",
            comment: "Handle is required"
          }));

        case 4:
          // ==============================
          // Codeforces API
          // ==============================
          apiUrl = "https://codeforces.com/api/user.status?handle=".concat(encodeURIComponent(handle)); // ==============================
          // Request Codeforces
          // ==============================

          _context.next = 7;
          return regeneratorRuntime.awrap(fetch(apiUrl));

        case 7:
          cfResponse = _context.sent;

          if (cfResponse.ok) {
            _context.next = 10;
            break;
          }

          return _context.abrupt("return", response.status(cfResponse.status).json({
            status: "FAILED",
            comment: "Codeforces returned HTTP ".concat(cfResponse.status)
          }));

        case 10:
          _context.next = 12;
          return regeneratorRuntime.awrap(cfResponse.json());

        case 12:
          data = _context.sent;

          if (!(data.status !== "OK")) {
            _context.next = 15;
            break;
          }

          return _context.abrupt("return", response.status(400).json({
            status: "FAILED",
            comment: data.comment || "Codeforces API error"
          }));

        case 15:
          return _context.abrupt("return", response.status(200).json({
            status: "OK",
            result: data.result
          }));

        case 18:
          _context.prev = 18;
          _context.t0 = _context["catch"](0);
          console.error("Codeforces Proxy Error:", _context.t0);
          return _context.abrupt("return", response.status(500).json({
            status: "FAILED",
            comment: "Failed to connect to Codeforces API"
          }));

        case 22:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 18]]);
}
//# sourceMappingURL=codeforces.dev.js.map
