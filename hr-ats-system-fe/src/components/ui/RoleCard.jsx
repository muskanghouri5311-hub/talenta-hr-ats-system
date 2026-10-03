import { Lock, Trash2 } from "lucide-react";

function RoleCard({ role, selectedRole, setSelectedRole, onDelete }) {
  const active = selectedRole?._id === role._id;
  const isLocked = role.isSystemRole === true;

  let badgeClass = "bg-slate-100 text-slate-700";
  let hoverBorder = "hover:border-slate-300";
  let ringColor = "border-blue-500";

  const name = (role.roleName || "").toLowerCase();

  if (name.includes("super") && name.includes("admin")) {
    badgeClass = "bg-violet-100 text-violet-700";
    hoverBorder = "hover:border-violet-300";
    ringColor = "border-violet-500";
  } else if (name.includes("recruiter") || name.includes("hr")) {
    badgeClass = "bg-blue-100 text-blue-700";
    hoverBorder = "hover:border-blue-300";
    ringColor = "border-blue-500";
  } else if (name.includes("interview")) {
    badgeClass = "bg-amber-100 text-amber-700";
    hoverBorder = "hover:border-amber-300";
    ringColor = "border-amber-500";
  } else if (name.includes("admin")) {
    badgeClass = "bg-rose-100 text-rose-700";
    hoverBorder = "hover:border-rose-300";
    ringColor = "border-rose-500";
  } else if (name.includes("manager")) {
    badgeClass = "bg-emerald-100 text-emerald-700";
    hoverBorder = "hover:border-emerald-300";
    ringColor = "border-emerald-500";
  } else if (name.includes("employee")) {
    badgeClass = "bg-cyan-100 text-cyan-700";
    hoverBorder = "hover:border-cyan-300";
    ringColor = "border-cyan-500";
  }

  const handleDeleteClick = (e) => {
  e.stopPropagation();
  onDelete(role);
};

  return (
    <div
      onClick={() => setSelectedRole(role)}
      className={`relative cursor-pointer rounded-2xl border bg-white text-left p-4 shadow-sm transition-all duration-150 hover:shadow-md ${
        active ? `${ringColor} shadow` : `border-slate-200 ${hoverBorder}`
      }`}
    >
      {!isLocked && (
        <button
          type="button"
          onClick={handleDeleteClick}
          title="Delete role"
          className="absolute right-4 top-4 rounded-full p-1 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}

      <div className="flex items-center justify-between pr-3">
        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${badgeClass}`}>
          {role.roleName}
        </span>
        {isLocked && (
          <span className="text-amber-500" title="System role — protected">
            <Lock className="h-3 w-3" />
          </span>
        )}
      </div>

      <p className="mt-1  text-slate-600">
        {role.description || "Custom role"}
        {role.userCount ? ` · ${role.userCount} user${role.userCount > 1 ? "s" : ""}` : ""}
      </p>

      <p className="mt-1 text-xs font-small text-slate-400">
        {(role.permissions?.length || 0)} module{role.permissions?.length === 1 ? "" : "s"} configured
      </p>
    </div>
  );
}

export default RoleCard;