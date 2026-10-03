import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import RequisitionTable from "../../components/ui/RequisitionTable";
import NewRequisition from "./NewRequisition";

import {
  getRequisitions,
  getRequisitionCounts,
  getRequisition,
  deleteRequisition,
} from "../../lib/api/requisitionApi";

import RequisitionDetailsModal from "../../components/ui/RequisitionDetailsModal";

const tabs = ["All", "Open", "Draft", "Closed", "Archived"];

const JobRequisition = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [requisitions, setRequisitions] = useState([]);
  const [isCreateMode, setIsCreateMode] = useState(false);

  const [tabCounts, setTabCounts] = useState({
    All: 0,
    Open: 0,
    Draft: 0,
    Closed: 0,
    Archived: 0,
  });

  const [loading, setLoading] = useState(true);

  const [selectedRequisition, setSelectedRequisition] = useState(null);

  const [showModal, setShowModal] = useState(false);

  // NEW: controls the View Details card
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const [activeTab, setActiveTab] = useState("All");

  const columns = [
    "ROLE",
    "DEPARTMENT",
    "TYPE",
    "STATUS",
    "CANDIDATES",
    "POSTED",
    "ACTION", // NEW
  ];

  // =========================
  // =========================
// FETCH REQUISITIONS
// =========================

const fetchRequisitions = (status) => {
  setLoading(true);

  getRequisitions(status)
    .then((res) => {
      setRequisitions(res.data.data);
    })
    .catch((error) => {
      console.log("Failed to fetch requisitions:", error);

      toast.error(
        error?.response?.data?.message ||
        "Failed to fetch requisitions"
      );
    })
    .finally(() => {
      setLoading(false);
    });
};


// =========================
// FETCH COUNTS
// =========================

const fetchCounts = () => {
  getRequisitionCounts()
    .then((res) => {
      setTabCounts(res.data.data);
    })
    .catch((error) => {
      console.log("Failed to fetch counts:", error);

      toast.error(
        error?.response?.data?.message ||
        "Failed to fetch requisition counts"
      );
    });
};


// =========================
// VIEW REQUISITION
// =========================

const handleView = async (id) => {
  try {
    const response = await getRequisition(id);

    setSelectedRequisition(
      response.data.data || response.data
    );

    setShowDetailsModal(true);
  } catch (error) {
    console.log("Failed to fetch requisition details:", error);

    toast.error(
      error?.response?.data?.message ||
      "Failed to load requisition details"
    );
  }
};


// =========================
// DELETE REQUISITION
// =========================

const handleDelete = (id) => {
  toast.warning(
    "Are you sure you want to delete this requisition?",
    {
      duration: Infinity,

      action: {
        label: "Delete",
        onClick: async () => {
          try {
            await deleteRequisition(id);

            // Remove deleted requisition from current table
            setRequisitions((prev) =>
              prev.filter((item) => item._id !== id)
            );

            // Update counts
            fetchCounts();

            toast.success(
              "Requisition deleted successfully"
            );
          } catch (error) {
            console.log(
              "Failed to delete requisition:",
              error
            );

            toast.error(
              error?.response?.data?.message ||
              "Failed to delete requisition"
            );
          }
        },
      },

      cancel: {
        label: "Cancel",
      },
    }
  );
};
  // =========================
  // EFFECTS
  // =========================

  useEffect(() => {
  const loadRequisitions = async () => {
    setLoading(true);

    try {
      const res = await getRequisitions(activeTab);

      setRequisitions(res.data.data);
    } catch (error) {
      console.log("Failed to fetch requisitions:", error);

      toast.error(
        error?.response?.data?.message ||
        "Failed to load requisitions"
      );
    } finally {
      setLoading(false);
    }
  };

  loadRequisitions();
}, [activeTab]);
  useEffect(() => {
    fetchCounts();
  }, []);

  // =========================
  // SEARCH DEEP-LINK
  // If the user clicked a job result in the Topbar global
  // search, land here with that requisition's details
  // already open.
  // =========================

  useEffect(() => {
    if (location.state?.requisitionId) {
      handleView(location.state.requisitionId);
      navigate(location.pathname, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  // =========================
  // UI
  // =========================

  return (
    <div className="p-6">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl text-[#181B25] font-semibold font-sans">
            Job Requisitions
          </h1>

          <p className="text-[13px] text-[#666E80] font-sans mt-1">
            {tabCounts.Open} open · {tabCounts.Draft} draft ·{" "}
            {tabCounts.Closed} closed
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedRequisition(null);
            setIsCreateMode(true);
            setShowModal(true);
          }}
          className="bg-blue-700 hover:bg-blue-700 text-white font-semibold px-3 py-1 rounded-xl shadow-sm transition"
        >
          + New Requisition
        </button>
      </div>

      {/* TABS */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
    shrink-0
    px-[14px]
    py-[7px]
    rounded-[20px]
    !text-[12.5px]
    !font-semibold
    border
    cursor-pointer
    font-sans
    ${activeTab === tab
                ? "bg-[#12141C] text-white border-[#12141C]"
                : "bg-white text-[#666E80] border-[#E1E5EC]"
              }
  `}
          >
            {tab} ({tabCounts[tab]})
          </button>
        ))}
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-500">
            Loading requisitions...
          </div>
        ) : (
          <RequisitionTable
            columns={columns}
            data={requisitions}

            // EXISTING EDIT
            onEdit={(req) => {
              setSelectedRequisition(req);
              setIsCreateMode(false);
              setShowModal(true);
            }}

            // NEW VIEW
            onView={handleView}

            // NEW DELETE
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      <NewRequisition
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedRequisition(null);
          setIsCreateMode(false);
        }}
        requisition={selectedRequisition}
        isCreateMode={isCreateMode}
        onSaved={() => {
          fetchRequisitions(activeTab);
          fetchCounts();
        }}
      />

      {/* VIEW DETAILS MODAL */}
      <RequisitionDetailsModal
        isOpen={showDetailsModal}
        requisition={selectedRequisition}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedRequisition(null);
        }}
      />

    </div>
  );
};

export default JobRequisition;