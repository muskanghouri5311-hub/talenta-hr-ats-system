const Table = ({
  columns,
  data,
  onEdit,
  canEdit = false,
  canDelete = false,
  onDelete,
}) => {
  const normalizeValue = (value) => {
    if (!value) return "";

    if (typeof value === "string") {
      return value;
    }

    return (
      value.roleName ??
      value.name ??
      value.label ??
      value.title ??
      ""
    );
  };

  const getInitials = (name) => {
    if (!name) return "?";

    const words = name.trim().split(" ");

    if (words.length === 1) {
      return words[0][0].toUpperCase();
    }

    return (
      words[0][0] + words[1][0]
    ).toUpperCase();
  };

  const avatarColors = [
    "bg-blue-100 text-blue-700",
    "bg-pink-100 text-pink-700",
    "bg-purple-100 text-purple-700",
    "bg-green-100 text-green-700",
    "bg-yellow-100 text-yellow-700",
    "bg-orange-100 text-orange-700",
    "bg-cyan-100 text-cyan-700",
    "bg-indigo-100 text-indigo-700",
    "bg-emerald-100 text-emerald-700",
    "bg-rose-100 text-rose-700",
  ];

  const getAvatarColor = (name) => {
    if (!name) return avatarColors[0];

    let total = 0;

    for (let i = 0; i < name.length; i++) {
      total += name.charCodeAt(i);
    }

    return avatarColors[
      total % avatarColors.length
    ];
  };

  return (
    <table className="w-full min-w-180">
      <thead>
        <tr className="border-b border-gray-200">
          {columns.map((column, index) => (
            <th
              key={index}
              className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500"
            >
              {column}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {data.length === 0 && (
          <tr>
            <td
              colSpan={columns.length}
              className="px-4 py-8 text-center text-sm text-gray-500"
            >
              No Record Found
            </td>
          </tr>
        )}

        {data.map((user, index) => {
          const roleLabel = normalizeValue(user.role);
          const departmentLabel = normalizeValue(
            user.department
          );

          const rowKey =
            user._id ?? user.id ?? index;

          return (
            <tr
              key={rowKey}
              className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
            >
              <td className="px-4 py-2 text-left">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-9 w-9 rounded-full font-semibold flex items-center justify-center ${getAvatarColor(
                      user.name
                    )}`}
                  >
                    {getInitials(user.name)}
                  </div>

                  <span className="font-medium text-gray-900">
                    {user.name ??
                      user.email ??
                      "Unknown User"}
                  </span>
                </div>
              </td>

              <td className="px-4 py-2 text-left text-gray-700">
                {user.email}
              </td>

              <td className="px-4 py-2 text-left">
                <div
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    roleLabel === "Super Admin"
                      ? "bg-violet-100 text-violet-600"
                      : roleLabel === "Recruiter"
                      ? "bg-blue-100 text-blue-600"
                      : roleLabel === "Interviewer"
                      ? "bg-amber-100 text-amber-600"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {roleLabel}
                </div>
              </td>

              <td className="px-4 py-2 text-left text-gray-700">
                {departmentLabel}
              </td>

              <td className="px-4 py-4 text-left">
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                  {user.status ?? "Active"}
                </span>
              </td>

              <td className="px-4 py-2 text-left text-gray-700">
                {user.lastLogin
                  ? new Date(
                      user.lastLogin
                    ).toLocaleString()
                  : "-"}
              </td>

              <td className="px-4 py-4 text-left">
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit?.(user)}
                    className="text-blue-600 font-medium hover:underline"
                  >
                    Edit →
                  </button>
                )}

                {canDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete?.(user)}
                    className="ml-4 text-red-600 font-medium hover:underline"
                  >
                    Delete
                  </button>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default Table;