(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push(["chunks/[root-of-the-server]__13jvavz1mxlei._.js",
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[externals]/node:buffer [external] (node:buffer, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}),
"[project]/src/middleware.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "config",
    ()=>config,
    "middleware",
    ()=>middleware
]);
(()=>{
    const e = new Error("Cannot find module '@/lib/supabase/middleware'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
;
async function middleware(request) {
    return await updateSession(request);
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

//# sourceMappingURL=%5Broot-of-the-server%5D__13jvavz1mxlei._.js.map