(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push(["chunks/[root-of-the-server]__01hc-tz9zek3x._.js",
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[externals]/node:buffer [external] (node:buffer, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}),
"[project]/src/lib/supabase/middleware.ts [middleware-edge] (ecmascript)", ((__turbopack_context__, module, exports) => {

var e = new Error("Could not parse module '[project]/src/lib/supabase/middleware.ts'\n\nUnexpected token `,`. Expected identifier");
e.code = 'MODULE_UNPARSABLE';
throw e;
}),
"[project]/src/middleware.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "config",
    ()=>config,
    "middleware",
    ()=>middleware
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$middleware$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase/middleware.ts [middleware-edge] (ecmascript)");
;
async function middleware(request) {
    return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$middleware$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["updateSession"])(request);
}
const config = {
    matcher: [
        /*
     * નીચેના રૂટ્સ સિવાયના તમામ પાથ પર મિડલવેર ચાલશે:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/webhooks (Telegram & Email Inbound APIs જેને પબ્લિક રાખવાના છે)
     */ '/((?!_next/static|_next/image|favicon.ico|api/webhooks).*)'
    ]
};
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__01hc-tz9zek3x._.js.map