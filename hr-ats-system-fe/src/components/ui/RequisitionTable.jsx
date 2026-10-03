import { Pencil, Eye, Trash2 } from "lucide-react";
const statusStyles = {
  Open: "bg-green-100 text-green-700",
  Draft: "bg-amber-100 text-amber-700",
  Closed: "bg-gray-100 text-gray-600",
  Archived: "bg-slate-200 text-slate-600",
};

const RequisitionTable = ({ columns, data, onEdit, onView, onDelete }) => {
  return (
    <div className="w-full overflow-x-auto rounded-3xl">
      <table className="min-w-[900px] w-full bg-white border border-gray-200">
        <thead>
          <tr className="border-b border-gray-200">
            {columns.map((column, index) => (
              <th
                key={index}
                className="px-4 py-2.5 text-left text-[11.5px] font-semibold uppercase text-gray-500"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {column}
              </th>
            ))}

            <th className="px-4 py-2.5 text-left"></th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + 1}
                className="px-4 py-8 text-center text-sm text-gray-500"
              >
                No Record Found
              </td>
            </tr>
          ) : (
            data.map((req, index) => (
            <tr
              key={req._id || index}
              className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
            >
              {/* Role */}
              <td className="px-4 py-4 text-left text-[#181B25] !text-[13px] font-bold "
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {req.role}
              </td>

              {/* Department */}
              <td className="px-4 py-4 text-left text-gray-700">
                {req.department}
              </td>

              {/* Type */}
              <td className="px-4 py-4 text-left text-gray-700">
                {req.type}
              </td>

              {/* Status */}
              <td className="px-4 py-4 text-left">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${statusStyles[req.status] || "bg-gray-100 text-gray-600"
                    }`}
                >
                  {req.status}
                </span>
              </td>

              {/* Candidates */}
              <td className="px-4 py-4 text-left text-gray-700">
                {req.candidates}
              </td>

              {/* Posted */}
              <td className="px-4 py-4 text-left text-gray-700">
                {req.createdAt
                  ? new Date(req.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "2-digit",
                  })
                  : "-"}
              </td>

              {/* Action */}
              <td className="px-2 py-4 whitespace-nowrap">
                <div className="flex items-center gap-4">

                  {/* Edit */}
                  <button
                    onClick={() => onEdit(req)}
                    className="text-blue-600 font-medium hover:text-blue-800"
                    title="Edit"
                  >
                    <Pencil size={17} />
                  </button>

                  {/* View */}
                  <button
                    onClick={() => onView(req._id)}
                    className="text-gray-600 hover:text-black transition"
                    title="View"
                  >
                    <Eye size={17} />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => onDelete(req._id)}
                    className="text-red-500 hover:text-red-700 transition"
                    title="Delete"
                  >
                    <Trash2 size={17} />
                  </button>

                </div>
              </td>
            </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default RequisitionTable;