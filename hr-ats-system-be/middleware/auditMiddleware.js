const logActivity = require("../services/audit/auditService");

const auditMiddleware = (req, res, next) => {
    const methodsToTrack = ["POST", "PUT", "PATCH", "DELETE"];

    if (!methodsToTrack.includes(req.method)) {
        return next();
    }

    res.on("finish", async () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            if (req.auditLogged) {
                return;
            }

            const endpoint = req.originalUrl;

            const moduleMap = {
                auth: "Authentication",

                user: "User Management",
                users: "User Management",
                "user-management": "User Management",

                role: "Roles & Permissions",
                roles: "Roles & Permissions",
                "roles-permissions": "Roles & Permissions",

                department: "Departments & Types",
                departments: "Departments & Types",
                "employment-types": "Departments & Types",

                requisition: "Job Requisitions",
                requisitions: "Job Requisitions",
                "job-requisitions": "Job Requisitions",

                candidate: "Candidate Pipeline",
                candidates: "Candidate Pipeline",

                interview: "Interviews",
                interviews: "Interviews",

                ats: "ATS Ranking",

                offer: "Offer Letters",
                offers: "Offer Letters",

                dashboard: "Dashboard",
            };

            const cleanPath = req.originalUrl.split("?")[0];

            const pathParts = cleanPath.split("/").filter(Boolean);

            // /api/requisitions/123
            // pathParts = ["api", "requisitions", "123"]

            const moduleKey = pathParts[1];

            const moduleName =
                moduleMap[moduleKey] || "Unknown Module";

            const actionMap = {
                POST: "CREATE",
                PUT: "UPDATE",
                PATCH: "UPDATE",
                DELETE: "DELETE",
            };

            await logActivity({
                userId: req.user?._id || req.user?.id || null,
                action: actionMap[req.method],
                module: moduleName,
                description: `${actionMap[req.method]} request on ${endpoint}`,
                method: req.method,
                endpoint,
                statusCode: res.statusCode,
                ipAddress:
                    req.ip ||
                    req.headers["x-forwarded-for"] ||
                    req.socket.remoteAddress ||
                    "",
            });
        }
    });

    next();
};

module.exports = auditMiddleware;