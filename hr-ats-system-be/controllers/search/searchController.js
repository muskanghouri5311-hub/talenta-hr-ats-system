const Candidate = require("../../models/Candidate");
const Requisition = require("../../models/Requisition");
const User = require("../../models/User");
const Department = require("../../models/Department");
const EmploymentType = require("../../models/EmploymentType");
const Interview = require("../../models/Interview");
const Offer = require("../../models/Offer");
const Role = require("../../models/Role");
const ATSResult = require("../../models/ATSResult");

// =====================================
// NORMALIZE ROLE NAME
// =====================================
const normalizeRoleName = (roleName) => {
    return String(roleName || "")
        .toLowerCase()
        .replace(/\s+/g, "")
        .trim();
};

// =====================================
// CHECK MODULE VIEW PERMISSION
// =====================================
const hasViewPermission = (role, moduleName) => {
    const normalizedModule = String(moduleName || "")
        .toLowerCase()
        .replace(/\s+/g, "")
        .trim();

    const permission = (role.permissions || []).find((item) => {
        const permissionModule = String(item.module || "")
            .toLowerCase()
            .replace(/\s+/g, "")
            .trim();

        return permissionModule === normalizedModule;
    });

    return permission?.view === true;
};

// =====================================
// GLOBAL SEARCH
// =====================================
const globalSearch = async (req, res) => {
    try {
        const query = String(req.query.q || "").trim();

        // =====================================
        // EMPTY SEARCH
        // =====================================
        if (!query) {
            return res.status(200).json({
                success: true,
                data: {
                    candidates: [],
                    requisitions: [],
                    departments: [],
                    employmentTypes: [],
                    roles: [],
                    users: [],
                    interviews: [],
                    offerLetters: [],
                    atsRankings: [],
                    reports: [],
                },
            });
        }

        // =====================================
        // GET LOGGED-IN USER + ROLE
        // =====================================
        const user = await User.findById(
            req.user?._id || req.user?.id
        )
            .populate({
                path: "role",
                select: "roleName permissions",
            })
            .lean();

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found",
            });
        }

        const role = user.role;

        if (!role) {
            return res.status(403).json({
                success: false,
                message: "User role not found",
            });
        }

        // =====================================
        // SUPER ADMIN
        // =====================================
        const normalizedRole = normalizeRoleName(role.roleName);

        const isSuperAdmin =
            normalizedRole === "superadmin";

        // =====================================
        // PERMISSIONS
        // =====================================
        const canViewCandidates =
            isSuperAdmin ||
            hasViewPermission(role, "candidates");

        const canViewRequisitions =
            isSuperAdmin ||
            hasViewPermission(role, "jobRequisitions");

        const canViewDepartments =
            isSuperAdmin ||
            hasViewPermission(role, "departments");

        const canViewRoles =
            isSuperAdmin ||
            hasViewPermission(role, "roles");

        const canViewUsers =
            isSuperAdmin ||
            hasViewPermission(role, "users");

        const canViewInterviews =
            isSuperAdmin ||
            hasViewPermission(role, "interviews");

        const canViewOfferLetters =
            isSuperAdmin ||
            hasViewPermission(role, "offerLetters");

        const canViewATS =
            isSuperAdmin ||
            hasViewPermission(role, "atsRanking");

        // Employment Type currently doesn't have a
        // separate permission module, so it follows
        // Job Requisitions permission.
        const canViewEmploymentTypes =
            isSuperAdmin ||
            hasViewPermission(role, "jobRequisitions");

        const canViewReports =
            isSuperAdmin ||
            hasViewPermission(role, "reports");

        // =====================================
        // SAFE SEARCH REGEX
        // =====================================
        const escapedQuery = query.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
        );

        const searchRegex = new RegExp(
            escapedQuery,
            "i"
        );

        // =====================================
        // RESULT VARIABLES
        // =====================================
        let candidates = [];
        let requisitions = [];
        let departments = [];
        let employmentTypes = [];
        let roles = [];
        let users = [];
        let interviews = [];
        let offerLetters = [];
        let atsRankings = [];
        let reports = [];

        // =====================================
        // CANDIDATES
        // =====================================
        if (canViewCandidates) {
            candidates = await Candidate.find({
                $or: [
                    { name: searchRegex },
                    { email: searchRegex },
                    { phone: searchRegex },
                    { role: searchRegex },
                    { education: searchRegex },
                    { skills: searchRegex },
                    { tags: searchRegex },
                    { stage: searchRegex },
                ],
            })
                .select(
                    "name email phone role experience skills tags score stage requisitionId"
                )
                .limit(5)
                .lean();

            // Numeric score search
            if (/^\d+$/.test(query)) {
                const scoreResults = await Candidate.find({
                    $expr: {
                        $regexMatch: {
                            input: {
                                $toString: "$score",
                            },
                            regex: escapedQuery,
                            options: "i",
                        },
                    },
                })
                    .select(
                        "name email phone role experience skills tags score stage requisitionId"
                    )
                    .limit(5)
                    .lean();

                const combined = [
                    ...candidates,
                    ...scoreResults,
                ];

                candidates = Array.from(
                    new Map(
                        combined.map((item) => [
                            String(item._id),
                            item,
                        ])
                    ).values()
                ).slice(0, 5);
            }
        }

        // =====================================
        // JOB REQUISITIONS
        // =====================================
        if (canViewRequisitions) {
            requisitions = await Requisition.find({
                $or: [
                    { role: searchRegex },
                    { department: searchRegex },
                    { type: searchRegex },
                    { location: searchRegex },
                    { experienceLevel: searchRegex },
                    { education: searchRegex },
                    { description: searchRegex },
                    { requirements: searchRegex },
                    { status: searchRegex },
                ],
            })
                .select(
  "role department location type experienceLevel minExperienceYears education status openings candidates"
)
                .limit(5)
                .lean();
        }

        // =====================================
        // DEPARTMENTS
        // =====================================
        if (canViewDepartments) {
            departments = await Department.find({
                $or: [
                    { name: searchRegex },
                    { headName: searchRegex },
                ],
            })
                .select("name headName employees")
                .limit(5)
                .lean();
        }

        // =====================================
        // EMPLOYMENT TYPES
        // =====================================
        if (canViewEmploymentTypes) {
            employmentTypes = await EmploymentType.find({
                name: searchRegex,
            })
                .select("name")
                .limit(5)
                .lean();
        }

        // =====================================
        // ROLES
        // =====================================
        if (canViewRoles) {
            roles = await Role.find({
                $or: [
                    { roleName: searchRegex },
                    { description: searchRegex },
                ],
            })
                .select(
                    "roleName description isSystemRole"
                )
                .limit(5)
                .lean();
        }

        // =====================================
        // USERS
        // =====================================
        if (canViewUsers) {
            users = await User.find({
                $or: [
                    { name: searchRegex },
                    { email: searchRegex },
                    { phoneNumber: searchRegex },
                ],
            })
                .select(
                    "name email phoneNumber role department"
                )
                .populate("role", "roleName")
                .populate("department", "name")
                .limit(5)
                .lean();
        }

        // =====================================
        // FIND RELATED CANDIDATES
        // Used by Interview / Offer / ATS searches
        // =====================================
        let relatedCandidateIds = [];

        if (
            canViewCandidates ||
            canViewInterviews ||
            canViewOfferLetters ||
            canViewATS
        ) {
            const relatedCandidates = await Candidate.find({
                $or: [
                    { name: searchRegex },
                    { email: searchRegex },
                    { role: searchRegex },
                ],
            })
                .select("_id")
                .limit(20)
                .lean();

            relatedCandidateIds =
                relatedCandidates.map(
                    (candidate) => candidate._id
                );
        }

        // =====================================
        // FIND RELATED REQUISITIONS
        // Used by ATS search
        // =====================================
        let relatedRequisitionIds = [];

        if (canViewATS) {
            const relatedRequisitions =
                await Requisition.find({
                    $or: [
                        { role: searchRegex },
                        { department: searchRegex },
                        { location: searchRegex },
                    ],
                })
                    .select("_id")
                    .limit(20)
                    .lean();

            relatedRequisitionIds =
                relatedRequisitions.map(
                    (requisition) => requisition._id
                );
        }

        // =====================================
        // INTERVIEWS
        // =====================================
        if (canViewInterviews) {
            const interviewConditions = [
                { round: searchRegex },
                { mode: searchRegex },
                { date: searchRegex },
                { time: searchRegex },
                { location: searchRegex },
                { notes: searchRegex },
                { status: searchRegex },
                {
                    "feedback.recommendation": searchRegex,
                },
                {
                    "feedback.technicalStrengths":
                        searchRegex,
                },
                {
                    "feedback.concerns": searchRegex,
                },
            ];

            if (relatedCandidateIds.length > 0) {
                interviewConditions.push({
                    candidateId: {
                        $in: relatedCandidateIds,
                    },
                });
            }

            interviews = await Interview.find({
                $or: interviewConditions,
            })
                .select(
                    "candidateId round mode date time duration interviewerId location notes status"
                )
                .populate(
                    "candidateId",
                    "name email role"
                )
                .populate(
                    "interviewerId",
                    "name email"
                )
                .limit(5)
                .lean();
        }

        // =====================================
        // OFFER LETTERS
        // =====================================
        if (canViewOfferLetters) {
            const offerConditions = [
                { template: searchRegex },
                { probation: searchRegex },
                { note: searchRegex },
                { status: searchRegex },
            ];

            if (relatedCandidateIds.length > 0) {
                offerConditions.push({
                    candidateId: {
                        $in: relatedCandidateIds,
                    },
                });
            }

            offerLetters = await Offer.find({
                $or: offerConditions,
            })
                .select(
                    "candidateId template joiningDate salary probation note status sentAt"
                )
                .populate(
                    "candidateId",
                    "name email role"
                )
                .limit(5)
                .lean();
        }

        // =====================================
        // ATS / RANKINGS
        // =====================================
        if (canViewATS) {
            const atsConditions = [
                { matchedSkills: searchRegex },
                { missingSkills: searchRegex },
            ];

            if (relatedCandidateIds.length > 0) {
                atsConditions.push({
                    candidateId: {
                        $in: relatedCandidateIds,
                    },
                });
            }

            if (relatedRequisitionIds.length > 0) {
                atsConditions.push({
                    requisitionId: {
                        $in: relatedRequisitionIds,
                    },
                });
            }

            // Numeric score search
            if (/^\d+$/.test(query)) {
                atsConditions.push({
                    $expr: {
                        $regexMatch: {
                            input: {
                                $toString: "$score",
                            },
                            regex: escapedQuery,
                            options: "i",
                        },
                    },
                });
            }

            atsRankings = await ATSResult.find({
                $or: atsConditions,
            })
                .select(
                    "candidateId requisitionId score matchedSkills missingSkills experienceMatch roleMatch educationMatch educationScore"
                )
                .populate(
                    "candidateId",
                    "name email role"
                )
                .populate(
                    "requisitionId",
                    "role department"
                )
                .sort({
                    score: -1,
                })
                .limit(5)
                .lean();
        }

        // =====================================
        // REPORTS
        // =====================================
        //
        // Reports don't have a Report model in the
        // models you provided. Therefore we search
        // the available report/page names.
        //
        if (canViewReports) {
            const reportOptions = [
                {
                    name: "Candidate Reports",
                    keywords: [
                        "candidate",
                        "candidates",
                        "candidate report",
                    ],
                },
                {
                    name: "Recruitment Reports",
                    keywords: [
                        "recruitment",
                        "recruit",
                        "hiring",
                        "recruitment report",
                    ],
                },
                {
                    name: "Interview Reports",
                    keywords: [
                        "interview",
                        "interviews",
                        "interview report",
                    ],
                },
                {
                    name: "ATS Ranking Reports",
                    keywords: [
                        "ats",
                        "ranking",
                        "rankings",
                        "ats ranking report",
                    ],
                },
            ];

            reports = reportOptions
                .filter((report) =>
                    report.keywords.some((keyword) =>
                        keyword
                            .toLowerCase()
                            .includes(query.toLowerCase()) ||
                        query
                            .toLowerCase()
                            .includes(keyword.toLowerCase())
                    )
                )
                .slice(0, 5);
        }

        // =====================================
        // RESPONSE
        // =====================================
        return res.status(200).json({
            success: true,

            data: {
                candidates,
                requisitions,
                departments,
                employmentTypes,
                roles,
                users,
                interviews,
                offerLetters,
                atsRankings,
                reports,
            },
        });
    } catch (error) {
        console.error(
            "GLOBAL SEARCH ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Search failed",
            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined,
        });
    }
};

module.exports = {
    globalSearch,
};