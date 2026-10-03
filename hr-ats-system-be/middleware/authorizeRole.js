const authorizeRole = (...allowedRoles) => {
    return (req, res, next) => {

        // User must already be authenticated
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized.",
            });
        }

        // Check whether the user's role is allowed
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to perform this action.",
            });
        }

        next();
    };
};

module.exports = authorizeRole;