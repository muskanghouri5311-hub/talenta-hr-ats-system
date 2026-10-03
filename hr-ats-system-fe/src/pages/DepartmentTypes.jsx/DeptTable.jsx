import { useEffect, useState } from "react";
import Table from "./TypeTable";
import { getEmploymentTypesLookup } from "../../lib/api/authdepApi";

const DeptTable = ({ departments, handleEdit }) => {
  const [employmentTypes, setEmploymentTypes] = useState([]);

  // ================= FETCH EMPLOYMENT TYPES =================
  useEffect(() => {
    const fetchEmploymentTypes = async () => {
      try {
        const response = await getEmploymentTypesLookup();

        const fetchedTypes = response.data?.data;

        setEmploymentTypes(
          Array.isArray(fetchedTypes) ? fetchedTypes : []
        );
      } catch (error) {
        console.error(
          "Error fetching employment types:",
          error
        );

        setEmploymentTypes([]);
      }
    };

    fetchEmploymentTypes();
  }, []);

  return (
    <div className="grid w-full grid-cols-1 gap-3 xl:grid-cols-[1.6fr_1fr] mt-1">
      
      {/* ================= DEPARTMENTS ================= */}
      <Table
        title="Departments"
        tableType="department"
        data={departments}
        handleEdit={handleEdit}
      />

      {/* ================= EMPLOYMENT TYPES ================= */}
      <Table
        title="Employment Types"
        tableType="employment"
        data={employmentTypes}
      />

    </div>
  );
};

export default DeptTable;