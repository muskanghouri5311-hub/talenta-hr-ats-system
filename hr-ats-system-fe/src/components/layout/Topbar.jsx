import { useContext, useEffect, useRef, useState } from "react";
import { FaBars, FaMagnifyingGlass } from "react-icons/fa6";
import { Link, useNavigate } from "react-router-dom";

import { AuthContext } from "../../context/AuthContextValue";
import { globalSearch } from "../../lib/api/searchApi";

const SEARCH_DEBOUNCE_MS = 400;
const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS_PER_GROUP = 5;

function Topbar({ toggle }) {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // =====================================================
  // USER INFO
  // =====================================================

  const roleName =
    typeof user?.role === "string"
      ? user.role
      : user?.role?.roleName ||
      user?.role?.name ||
      user?.roleName ||
      "User";

  const userName =
    user?.name ||
    user?.username ||
    "User";

  const initials = userName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // =====================================================
  // GLOBAL SEARCH STATE
  // =====================================================

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const [searching, setSearching] = useState(false);

  const [candidateResults, setCandidateResults] = useState([]);
  const [requisitionResults, setRequisitionResults] = useState([]);
  const [departmentResults, setDepartmentResults] = useState([]);
  const [employmentTypeResults, setEmploymentTypeResults] =
    useState([]);
  const [roleResults, setRoleResults] = useState([]);
  const [userResults, setUserResults] = useState([]);
  const [interviewResults, setInterviewResults] = useState([]);
  const [offerLetterResults, setOfferLetterResults] =
    useState([]);
  const [atsResults, setAtsResults] = useState([]);
  const [reportResults, setReportResults] = useState([]);

  const [showResults, setShowResults] = useState(false);

  const containerRef = useRef(null);

  // =====================================================
  // CLEAR SEARCH RESULTS
  // =====================================================

  const clearResults = () => {
    setCandidateResults([]);
    setRequisitionResults([]);
    setDepartmentResults([]);
    setEmploymentTypeResults([]);
    setRoleResults([]);
    setUserResults([]);
    setInterviewResults([]);
    setOfferLetterResults([]);
    setAtsResults([]);
    setReportResults([]);
  };

  // =====================================================
  // DEBOUNCE SEARCH
  // =====================================================

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(handle);
  }, [searchQuery]);

  // =====================================================
  // RUN GLOBAL SEARCH
  // =====================================================

  useEffect(() => {
    if (debouncedQuery.length < MIN_QUERY_LENGTH) {
      clearResults();
      setSearching(false);
      return;
    }

    let cancelled = false;

    const runSearch = async () => {
      try {
        setSearching(true);

        const response =
          await globalSearch(debouncedQuery);

        if (cancelled) return;

        const searchData =
          response?.data?.data || {};

        const candidates =
          searchData.candidates || [];

        const requisitions =
          searchData.requisitions || [];

        const departments =
          searchData.departments || [];

        const employmentTypes =
          searchData.employmentTypes || [];

        const roles =
          searchData.roles || [];

        const users =
          searchData.users || [];

        const interviews =
          searchData.interviews || [];

        const offerLetters =
          searchData.offerLetters || [];

        const atsRankings =
          searchData.atsRankings || [];

        const reports =
          searchData.reports || [];

        // ---------------------------------------------
        // SET RESULTS
        // ---------------------------------------------

        setCandidateResults(
          Array.isArray(candidates)
            ? candidates.slice(
              0,
              MAX_RESULTS_PER_GROUP
            )
            : []
        );

        setRequisitionResults(
          Array.isArray(requisitions)
            ? requisitions.slice(
              0,
              MAX_RESULTS_PER_GROUP
            )
            : []
        );

        setDepartmentResults(
          Array.isArray(departments)
            ? departments.slice(
              0,
              MAX_RESULTS_PER_GROUP
            )
            : []
        );

        setEmploymentTypeResults(
          Array.isArray(employmentTypes)
            ? employmentTypes.slice(
              0,
              MAX_RESULTS_PER_GROUP
            )
            : []
        );

        setRoleResults(
          Array.isArray(roles)
            ? roles.slice(
              0,
              MAX_RESULTS_PER_GROUP
            )
            : []
        );

        setUserResults(
          Array.isArray(users)
            ? users.slice(
              0,
              MAX_RESULTS_PER_GROUP
            )
            : []
        );

        setInterviewResults(
          Array.isArray(interviews)
            ? interviews.slice(
              0,
              MAX_RESULTS_PER_GROUP
            )
            : []
        );

        setOfferLetterResults(
          Array.isArray(offerLetters)
            ? offerLetters.slice(
              0,
              MAX_RESULTS_PER_GROUP
            )
            : []
        );

        setAtsResults(
          Array.isArray(atsRankings)
            ? atsRankings.slice(
              0,
              MAX_RESULTS_PER_GROUP
            )
            : []
        );

        setReportResults(
          Array.isArray(reports)
            ? reports.slice(
              0,
              MAX_RESULTS_PER_GROUP
            )
            : []
        );
      } catch (error) {
        console.error(
          "GLOBAL SEARCH ERROR:",
          error
        );

        if (!cancelled) {
          clearResults();
        }
      } finally {
        if (!cancelled) {
          setSearching(false);
        }
      }
    };

    runSearch();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  // =====================================================
  // CLOSE DROPDOWN ON OUTSIDE CLICK
  // =====================================================

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target
        )
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  // =====================================================
  // SEARCH STATUS
  // =====================================================

  const hasQuery =
    debouncedQuery.length >= MIN_QUERY_LENGTH;

  const hasResults =
    candidateResults.length > 0 ||
    requisitionResults.length > 0 ||
    departmentResults.length > 0 ||
    employmentTypeResults.length > 0 ||
    roleResults.length > 0 ||
    userResults.length > 0 ||
    interviewResults.length > 0 ||
    offerLetterResults.length > 0 ||
    atsResults.length > 0 ||
    reportResults.length > 0;

  // =====================================================
  // CLOSE SEARCH
  // =====================================================

  const closeSearch = () => {
    setShowResults(false);
    setSearchQuery("");
    setDebouncedQuery("");
    clearResults();
  };

  // =====================================================
  // CANDIDATE CLICK
  // =====================================================

  const handleCandidateClick = (candidate) => {
    closeSearch();

    navigate("/candidate-pipeline", {
      state: {
        candidateId: candidate?._id,
        requisitionId:
          candidate?.requisitionId?._id ||
          candidate?.requisitionId,
      },
    });
  };

  // =====================================================
  // REQUISITION CLICK
  // =====================================================

  const handleRequisitionClick = (
    requisition
  ) => {
    closeSearch();

    navigate("/job-requisitions", {
      state: {
        requisitionId: requisition?._id,
      },
    });
  };

  // =====================================================
  // DEPARTMENT CLICK
  // =====================================================

  const handleDepartmentClick = (
    department
  ) => {
    closeSearch();

    navigate("/departments", {
      state: {
        departmentId: department?._id,
      },
    });
  };

  // =====================================================
  // EMPLOYMENT TYPE CLICK
  // =====================================================

  const handleEmploymentTypeClick = (
    employmentType
  ) => {
    closeSearch();

    navigate("/employment-types", {
      state: {
        employmentTypeId:
          employmentType?._id,
      },
    });
  };

  // =====================================================
  // ROLE CLICK
  // =====================================================

  const handleRoleClick = (role) => {
    closeSearch();

    navigate("/roles-permissions", {
      state: {
        roleId: role?._id,
      },
    });
  };

  // =====================================================
  // USER CLICK
  // =====================================================

  const handleUserClick = (selectedUser) => {
    closeSearch();

    navigate("/user-management", {
      state: {
        userId: selectedUser?._id,
      },
    });
  };

  // =====================================================
  // INTERVIEW CLICK
  // =====================================================

  const handleInterviewClick = (
    interview
  ) => {
    closeSearch();

    navigate("/interviews", {
      state: {
        interviewId: interview?._id,
        candidateId:
          interview?.candidateId?._id ||
          interview?.candidateId,
      },
    });
  };

  // =====================================================
  // OFFER LETTER CLICK
  // =====================================================

  const handleOfferLetterClick = (
    offer
  ) => {
    closeSearch();

    navigate("/offer-letters", {
      state: {
        offerId: offer?._id,
        candidateId:
          offer?.candidateId?._id ||
          offer?.candidateId,
      },
    });
  };

  // =====================================================
  // ATS CLICK
  // =====================================================

  const handleATSClick = (ats) => {
    closeSearch();

    navigate("/ats-ranking", {
      state: {
        candidateId:
          ats?.candidateId?._id ||
          ats?.candidateId,

        requisitionId:
          ats?.requisitionId?._id ||
          ats?.requisitionId,
      },
    });
  };

  // =====================================================
  // REPORT CLICK
  // =====================================================

  const handleReportClick = (report) => {
    closeSearch();

    navigate("/reports", {
      state: {
        reportName: report?.name,
      },
    });
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <header className="w-full border-b border-slate-200 bg-white">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">

        {/* =================================================
            LEFT SIDE
        ================================================== */}

        <div className="flex min-w-0 flex-1 items-center gap-4">

          {/* MOBILE / SIDEBAR TOGGLE */}

          <button
            type="button"
            onClick={toggle}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
          >
            <FaBars />
          </button>

          {/* =================================================
              GLOBAL SEARCH
          ================================================== */}

          <div
            ref={containerRef}
            className="relative hidden w-full max-w-90 sm:block"
          >
            {/* SEARCH INPUT */}

            <div className="flex h-9 w-full items-center rounded-xl border border-slate-200 bg-slate-100 px-4 text-xs">

              <FaMagnifyingGlass className="text-xs text-slate-400" />

              <input
                type="text"
                autoComplete="off"
                name="global-search-query"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(
                    e.target.value
                  );

                  setShowResults(true);
                }}
                onFocus={() =>
                  setShowResults(true)
                }
                placeholder="Search anything..."
                className="ml-4 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>

            {/* =================================================
                SEARCH DROPDOWN
            ================================================== */}

            {showResults &&
              hasQuery && (
                <div className="absolute left-0 right-0 top-11 z-50 max-h-105 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">

                  {/* SEARCHING */}

                  {searching && (
                    <div className="px-4 py-3 text-xs text-slate-500">
                      Searching...
                    </div>
                  )}

                  {/* NO RESULTS */}

                  {!searching &&
                    !hasResults && (
                      <div className="px-4 py-3 text-xs text-slate-500">
                        No matches for "
                        {debouncedQuery}".
                      </div>
                    )}

                  {/* =================================================
                      CANDIDATES
                  ================================================== */}

                  {!searching &&
                    candidateResults.length >
                    0 && (
                      <div className="border-b border-slate-100 py-1">
                        <p className="px-4 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Candidates
                        </p>

                        {candidateResults.map(
                          (candidate) => (
                            <button
                              key={
                                candidate._id
                              }
                              type="button"
                              onClick={() =>
                                handleCandidateClick(
                                  candidate
                                )
                              }
                              className="flex w-full flex-col items-start px-4 py-2 text-left hover:bg-slate-50"
                            >
                              <span className="text-sm font-semibold text-slate-800">
                                {candidate.name}
                              </span>

                              <span className="text-xs text-slate-500">
                                {candidate.email}

                                {candidate.role &&
                                  ` · ${candidate.role}`}

                                {candidate.stage &&
                                  ` · ${candidate.stage}`}
                              </span>
                            </button>
                          )
                        )}
                      </div>
                    )}

                  {/* =================================================
                      JOB REQUISITIONS
                  ================================================== */}

                  {!searching &&
                    requisitionResults.length >
                    0 && (
                      <div className="border-b border-slate-100 py-1">
                        <p className="px-4 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Jobs
                        </p>

                        {requisitionResults.map(
                          (requisition) => (
                            <button
                              key={
                                requisition._id
                              }
                              type="button"
                              onClick={() =>
                                handleRequisitionClick(
                                  requisition
                                )
                              }
                              className="flex w-full flex-col items-start px-4 py-2 text-left hover:bg-slate-50"
                            >
                              <span className="text-sm font-semibold text-slate-800">
                                {
                                  requisition.role
                                }
                              </span>

                              <span className="text-xs text-slate-500">
                                {
                                  requisition.department
                                }

                                {requisition.status &&
                                  ` · ${requisition.status}`}
                              </span>
                            </button>
                          )
                        )}
                      </div>
                    )}

                  {/* =================================================
                      DEPARTMENTS
                  ================================================== */}

                  {!searching &&
                    departmentResults.length >
                    0 && (
                      <div className="border-b border-slate-100 py-1">
                        <p className="px-4 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Departments
                        </p>

                        {departmentResults.map(
                          (department) => (
                            <button
                              key={
                                department._id
                              }
                              type="button"
                              onClick={() =>
                                handleDepartmentClick(
                                  department
                                )
                              }
                              className="flex w-full flex-col items-start px-4 py-2 text-left hover:bg-slate-50"
                            >
                              <span className="text-sm font-semibold text-slate-800">
                                {
                                  department.name
                                }
                              </span>

                              <span className="text-xs text-slate-500">
                                Department

                                {department.headName &&
                                  ` · Head: ${department.headName}`}
                              </span>
                            </button>
                          )
                        )}
                      </div>
                    )}

                  {/* =================================================
                      EMPLOYMENT TYPES
                  ================================================== */}

                  {!searching &&
                    employmentTypeResults.length >
                    0 && (
                      <div className="border-b border-slate-100 py-1">
                        <p className="px-4 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Employment Types
                        </p>

                        {employmentTypeResults.map(
                          (type) => (
                            <button
                              key={type._id}
                              type="button"
                              onClick={() =>
                                handleEmploymentTypeClick(
                                  type
                                )
                              }
                              className="flex w-full flex-col items-start px-4 py-2 text-left hover:bg-slate-50"
                            >
                              <span className="text-sm font-semibold text-slate-800">
                                {type.name}
                              </span>

                              <span className="text-xs text-slate-500">
                                Employment Type
                              </span>
                            </button>
                          )
                        )}
                      </div>
                    )}

                  {/* =================================================
                      ROLES
                  ================================================== */}

                  {!searching &&
                    roleResults.length > 0 && (
                      <div className="border-b border-slate-100 py-1">
                        <p className="px-4 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Roles
                        </p>

                        {roleResults.map(
                          (role) => (
                            <button
                              key={role._id}
                              type="button"
                              onClick={() =>
                                handleRoleClick(
                                  role
                                )
                              }
                              className="flex w-full flex-col items-start px-4 py-2 text-left hover:bg-slate-50"
                            >
                              <span className="text-sm font-semibold text-slate-800">
                                {
                                  role.roleName
                                }
                              </span>

                              <span className="text-xs text-slate-500">
                                {
                                  role.description
                                }
                              </span>
                            </button>
                          )
                        )}
                      </div>
                    )}

                  {/* =================================================
                      USERS
                  ================================================== */}

                  {!searching &&
                    userResults.length > 0 && (
                      <div className="border-b border-slate-100 py-1">
                        <p className="px-4 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Users
                        </p>

                        {userResults.map(
                          (selectedUser) => (
                            <button
                              key={
                                selectedUser._id
                              }
                              type="button"
                              onClick={() =>
                                handleUserClick(
                                  selectedUser
                                )
                              }
                              className="flex w-full flex-col items-start px-4 py-2 text-left hover:bg-slate-50"
                            >
                              <span className="text-sm font-semibold text-slate-800">
                                {
                                  selectedUser.name
                                }
                              </span>

                              <span className="text-xs text-slate-500">
                                {
                                  selectedUser.email
                                }

                                {selectedUser.role
                                  ?.roleName &&
                                  ` · ${selectedUser.role.roleName}`}
                              </span>
                            </button>
                          )
                        )}
                      </div>
                    )}

                  {/* =================================================
                      INTERVIEWS
                  ================================================== */}

                  {!searching &&
                    interviewResults.length >
                    0 && (
                      <div className="border-b border-slate-100 py-1">
                        <p className="px-4 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Interviews
                        </p>

                        {interviewResults.map(
                          (interview) => (
                            <button
                              key={
                                interview._id
                              }
                              type="button"
                              onClick={() =>
                                handleInterviewClick(
                                  interview
                                )
                              }
                              className="flex w-full flex-col items-start px-4 py-2 text-left hover:bg-slate-50"
                            >
                              <span className="text-sm font-semibold text-slate-800">
                                {interview
                                  .candidateId
                                  ?.name ||
                                  "Interview"}
                              </span>

                              <span className="text-xs text-slate-500">
                                {
                                  interview.round
                                }

                                {interview.mode &&
                                  ` · ${interview.mode}`}

                                {interview.status &&
                                  ` · ${interview.status}`}
                              </span>
                            </button>
                          )
                        )}
                      </div>
                    )}

                  {/* =================================================
                      OFFER LETTERS
                  ================================================== */}

                  {!searching &&
                    offerLetterResults.length >
                    0 && (
                      <div className="border-b border-slate-100 py-1">
                        <p className="px-4 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Offer Letters
                        </p>

                        {offerLetterResults.map(
                          (offer) => (
                            <button
                              key={offer._id}
                              type="button"
                              onClick={() =>
                                handleOfferLetterClick(
                                  offer
                                )
                              }
                              className="flex w-full flex-col items-start px-4 py-2 text-left hover:bg-slate-50"
                            >
                              <span className="text-sm font-semibold text-slate-800">
                                {offer
                                  .candidateId
                                  ?.name ||
                                  "Offer Letter"}
                              </span>

                              <span className="text-xs text-slate-500">
                                {
                                  offer.template
                                }

                                {offer.status &&
                                  ` · ${offer.status}`}
                              </span>
                            </button>
                          )
                        )}
                      </div>
                    )}

                  {/* =================================================
                      ATS RANKINGS
                  ================================================== */}

                  {!searching &&
                    atsResults.length > 0 && (
                      <div className="border-b border-slate-100 py-1">
                        <p className="px-4 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          ATS Rankings
                        </p>

                        {atsResults.map(
                          (ats) => (
                            <button
                              key={ats._id}
                              type="button"
                              onClick={() =>
                                handleATSClick(
                                  ats
                                )
                              }
                              className="flex w-full flex-col items-start px-4 py-2 text-left hover:bg-slate-50"
                            >
                              <span className="text-sm font-semibold text-slate-800">
                                {ats
                                  .candidateId
                                  ?.name ||
                                  "ATS Result"}
                              </span>

                              <span className="text-xs text-slate-500">
                                Score:{" "}
                                {ats.score}

                                {ats
                                  .requisitionId
                                  ?.role &&
                                  ` · ${ats.requisitionId.role}`}
                              </span>
                            </button>
                          )
                        )}
                      </div>
                    )}

                  {/* =================================================
                      REPORTS
                  ================================================== */}

                  {!searching &&
                    reportResults.length >
                    0 && (
                      <div className="py-1">
                        <p className="px-4 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Reports
                        </p>

                        {reportResults.map(
                          (report) => (
                            <button
                              key={
                                report.name
                              }
                              type="button"
                              onClick={() =>
                                handleReportClick(
                                  report
                                )
                              }
                              className="flex w-full flex-col items-start px-4 py-2 text-left hover:bg-slate-50"
                            >
                              <span className="text-sm font-semibold text-slate-800">
                                {
                                  report.name
                                }
                              </span>

                              <span className="text-xs text-slate-500">
                                Report
                              </span>
                            </button>
                          )
                        )}
                      </div>
                    )}
                </div>
              )}
          </div>
        </div>

        {/* =================================================
            RIGHT SIDE
        ================================================== */}

        <div className="flex items-center gap-4">

          {/* CAREER PORTAL */}

          <Link
            to="/career-portal"
            className="
              hidden
              rounded-xl
              border
              border-slate-200
              bg-white
              px-2
              py-2
              text-xs
              font-semibold
              text-[#111827]
              transition
              hover:bg-slate-50
              sm:block
            "
          >
            Career Portal (public)
          </Link>

          {/* ROLE */}

          <div className="hidden rounded-xl bg-violet-100 px-2 py-2 sm:block">
            <p className="text-xs font-semibold text-violet-700">
              {roleName}
            </p>
          </div>

          {/* USER INITIALS */}

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-600 font-semibold text-white">
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;