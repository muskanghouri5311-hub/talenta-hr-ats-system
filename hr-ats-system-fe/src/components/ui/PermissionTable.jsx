function PermissionTable({
  modules,
  register,
  disabled,
  watch,
  setValue,
}) {
  const permissions = watch("permissions") || {};

  // =========================================
  // CHECK IF ONE MODULE IS FULLY SELECTED
  // =========================================

  const isModuleSelected = (moduleKey) => {
    const permission = permissions[moduleKey];

    if (!permission) {
      return false;
    }

    return (
      permission.view === true &&
      permission.create === true &&
      permission.edit === true &&
      permission.delete === true
    );
  };

  // =========================================
  // CHECK IF ALL MODULES ARE SELECTED
  // =========================================

  const isAllSelected = modules.every((module) =>
    isModuleSelected(module.key)
  );

  // =========================================
  // SELECT / UNSELECT ONE MODULE
  // =========================================

  const handleModuleSelect = (moduleKey) => {
    const selected = isModuleSelected(moduleKey);
    const newValue = !selected;

    setValue(
      `permissions.${moduleKey}.view`,
      newValue,
      { shouldDirty: true }
    );

    setValue(
      `permissions.${moduleKey}.create`,
      newValue,
      { shouldDirty: true }
    );

    setValue(
      `permissions.${moduleKey}.edit`,
      newValue,
      { shouldDirty: true }
    );

    setValue(
      `permissions.${moduleKey}.delete`,
      newValue,
      { shouldDirty: true }
    );
  };

  // =========================================
  // SELECT / UNSELECT ALL MODULES
  // =========================================

  const handleSelectAll = () => {
    const newValue = !isAllSelected;

    modules.forEach((module) => {
      setValue(
        `permissions.${module.key}.view`,
        newValue,
        { shouldDirty: true }
      );

      setValue(
        `permissions.${module.key}.create`,
        newValue,
        { shouldDirty: true }
      );

      setValue(
        `permissions.${module.key}.edit`,
        newValue,
        { shouldDirty: true }
      );

      setValue(
        `permissions.${module.key}.delete`,
        newValue,
        { shouldDirty: true }
      );
    });
  };

  return (
    <div>

      {/* =====================================
          PERMISSIONS HEADER
      ===================================== */}

      <div className="mb-2 flex items-center justify-between">
        

        <h3 className="text-[13px] font-semibold text-slate-500">
          PERMISSIONS
        </h3>

        {/* SELECT ALL */}

        <label className="flex cursor-pointer items-center gap-2 text-[11px] text-slate-500">
          <input
            type="checkbox"
            checked={isAllSelected}
            disabled={disabled}
            onChange={handleSelectAll}
            className="h-[16px] w-[16px] cursor-pointer accent-blue-600 disabled:cursor-not-allowed"
          />

          Select all
        </label>

      </div>

      {/* =====================================
          PERMISSION TABLE
      ===================================== */}

      <div className="overflow-x-auto rounded-lg border border-slate-200">

        <table className="w-full min-w-130 border-collapse">

          {/* TABLE HEADER */}

          <thead>
            <tr className="border-b border-slate-200 bg-white">

              {/* MODULE */}

              <th className="px-2 py-2 text-left text-[12px] font-semibold text-slate-500">
                MODULE
              </th>

              {/* ALL */}

              <th className="w-[55px] px-1 py-2 text-center text-[12px] font-semibold text-slate-500">
                ALL
              </th>

              {/* VIEW */}

              <th className="w-[65px] px-1 py-2 text-center text-[12px] font-semibold text-slate-500">
                VIEW
              </th>

              {/* CREATE */}

              <th className="w-[75px] px-1 py-2 text-center text-[12px] font-semibold text-slate-500">
                CREATE
              </th>

              {/* EDIT */}

              <th className="w-[65px] px-1 py-2 text-center text-[12px] font-semibold text-slate-500">
                EDIT
              </th>

              {/* DELETE */}

              <th className="w-[70px] px-1 py-2 text-center text-[12px] font-semibold text-slate-500">
                DELETE
              </th>

            </tr>
          </thead>

          {/* TABLE BODY */}

          <tbody>

            {modules.map((module) => {
              const moduleSelected =
                isModuleSelected(module.key);

              return (
                <tr
                  key={module.key}
                  className="border-b border-slate-200 last:border-b-0"
                >

                  {/* MODULE NAME */}

                  <td className="px-2 py-2.5 text-[12px] font-medium text-slate-700">
                    {module.label}
                  </td>

                  {/* MODULE ALL */}

                  <td className="px-1 py-2.5 text-center">
                    <input
                      type="checkbox"
                      checked={moduleSelected}
                      disabled={disabled}
                      onChange={() =>
                        handleModuleSelect(module.key)
                      }
                      className="h-[18px] w-[18px] cursor-pointer accent-blue-600 disabled:cursor-not-allowed"
                    />
                  </td>

                  {/* VIEW */}

                  <td className="px-1 py-2.5 text-center">
                    <input
                      type="checkbox"
                      {...register(
                        `permissions.${module.key}.view`
                      )}
                      disabled={disabled}
                      className="h-[18px] w-[18px] cursor-pointer accent-blue-600 disabled:cursor-not-allowed"
                    />
                  </td>

                  {/* CREATE */}

                  <td className="px-1 py-2.5 text-center">
                    <input
                      type="checkbox"
                      {...register(
                        `permissions.${module.key}.create`
                      )}
                      disabled={disabled}
                      className="h-[18px] w-[18px] cursor-pointer accent-blue-600 disabled:cursor-not-allowed"
                    />
                  </td>

                  {/* EDIT */}

                  <td className="px-1 py-2.5 text-center">
                    <input
                      type="checkbox"
                      {...register(
                        `permissions.${module.key}.edit`
                      )}
                      disabled={disabled}
                      className="h-[18px] w-[18px] cursor-pointer accent-blue-600 disabled:cursor-not-allowed"
                    />
                  </td>

                  {/* DELETE */}

                  <td className="px-1 py-2.5 text-center">
                    <input
                      type="checkbox"
                      {...register(
                        `permissions.${module.key}.delete`
                      )}
                      disabled={disabled}
                      className="h-[18px] w-[18px] cursor-pointer accent-blue-600 disabled:cursor-not-allowed"
                    />
                  </td>

                </tr>
              );
            })}

          </tbody>

        </table>

      </div>

    </div>
  );
}

export default PermissionTable;