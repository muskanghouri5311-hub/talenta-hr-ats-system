const normalizeModule = (module) =>
  String(module || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");

const moduleAliases = {
  roles: ["roles", "role", "rolesandpermissions"],
};

export const isSuperAdmin = (user) => {
  const role = user?.role;
  const roleName =
    typeof role === "string"
      ? role
      : role?.roleName || role?.name || user?.roleName || user?.role;

  return normalizeModule(roleName) === "superadmin";
};

export const hasPermission = (user, module, action) => {
  if (isSuperAdmin(user)) {
    return true;
  }

  const permissions = user?.role?.permissions || user?.permissions || [];
  const requestedModules = moduleAliases[module]
    ? moduleAliases[module].map(normalizeModule)
    : [normalizeModule(module)];

  const permission = permissions.find((item) =>
    requestedModules.includes(normalizeModule(item?.module))
  );

  return (
    permission?.[action] === true ||
    permission?.[action] === "true"
  );
};