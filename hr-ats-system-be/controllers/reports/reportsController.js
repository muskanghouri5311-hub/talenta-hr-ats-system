const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");
const Candidate = require("../../models/Candidate");
const logActivity = require("../../services/audit/auditService");

// =====================================================
// DATE FILTER HELPERS
// =====================================================
const buildDateFilter = (startDate, endDate) => {
  const filter = {};

  if (startDate || endDate) {
    filter.hiredAt = {};
    if (startDate) filter.hiredAt.$gte = new Date(`${startDate}T00:00:00.000Z`);
    if (endDate) filter.hiredAt.$lte = new Date(`${endDate}T23:59:59.999Z`);
  }

  return filter;
};

const validateDates = (startDate, endDate) => {
  if (startDate && Number.isNaN(new Date(startDate).getTime())) return "Invalid startDate";
  if (endDate && Number.isNaN(new Date(endDate).getTime())) return "Invalid endDate";
  if (startDate && endDate && startDate > endDate) return "startDate cannot be after endDate";
  return null;
};

// =====================================================
// SHARED DATA
// =====================================================
const getRecruiterPerformanceData = async (startDate, endDate) => {
  const dateFilter = buildDateFilter(startDate, endDate);

  const candidates = await Candidate.find({
    stage: "Hired",
    recruiterId: { $ne: null },
    hiredAt: { $ne: null },
    ...dateFilter,
  })
    .populate("recruiterId", "name email")
    .select("createdAt hiredAt recruiterId")
    .lean();


    console.log('candidates',candidates);
    console.log("filter used:", { stage: "Hired", recruiterId: { $ne: null }, ...dateFilter });
  const recruiterMap = new Map();

  candidates.forEach((candidate) => {
    if (!candidate.recruiterId || !candidate.createdAt || !candidate.hiredAt) return;

    const appliedDate = new Date(candidate.createdAt);
    const hiredDate = new Date(candidate.hiredAt);
    const difference = hiredDate.getTime() - appliedDate.getTime();
    if (difference < 0) return;

    const tth = difference / (1000 * 60 * 60 * 24);
    const recruiterId = candidate.recruiterId._id.toString();
    const recruiterName =
      candidate.recruiterId.name || candidate.recruiterId.email || "Unknown Recruiter";

    if (!recruiterMap.has(recruiterId)) {
      recruiterMap.set(recruiterId, {
        recruiterId,
        recruiter: recruiterName,
        hires: 0,
        totalTTH: 0,
      });
    }

    const r = recruiterMap.get(recruiterId);
    r.hires += 1;
    r.totalTTH += tth;
  });

  return Array.from(recruiterMap.values())
    .map((item) => ({
      recruiterId: item.recruiterId,
      recruiter: item.recruiter,
      hires: item.hires,
      avgTTH: item.hires > 0 ? Math.round(item.totalTTH / item.hires) : 0,
    }))
    .sort((a, b) => b.hires - a.hires);
};

// =====================================================
// GET RECRUITER PERFORMANCE
// =====================================================
const getRecruiterPerformance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateError = validateDates(startDate, endDate);
    if (dateError) {
      return res.status(400).json({ success: false, message: dateError });
    }

    const data = await getRecruiterPerformanceData(startDate, endDate);

    return res.status(200).json({
      success: true,
      count: data.length,
      filters: { startDate: startDate || null, endDate: endDate || null },
      data,
    });
  } catch (error) {
    console.error("RECRUITER PERFORMANCE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch recruiter performance",
      error: error.message,
    });
  }
};

// =====================================================
// EXPORT HELPERS
// =====================================================
const buildBaseFilename = (startDate, endDate) => {
  if (startDate && endDate) return `recruiter-performance-${startDate}_to_${endDate}`;
  if (startDate) return `recruiter-performance-from_${startDate}`;
  if (endDate) return `recruiter-performance-until_${endDate}`;
  return "recruiter-performance-all_time";
};

const escapeCSVValue = (value) => {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
};

const sendCSV = (res, data, baseFilename) => {
  const header = ["Recruiter", "Hires", "Avg TTH (days)"];
  const rows = data.map((row) => [row.recruiter, row.hires, row.avgTTH]);

  const csvContent = [header, ...rows]
    .map((line) => line.map(escapeCSVValue).join(","))
    .join("\n");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${baseFilename}.csv"`);
  return res.status(200).send(csvContent);
};

const sendExcel = async (res, data, baseFilename) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Recruiter Performance");

  sheet.columns = [
    { header: "Recruiter", key: "recruiter", width: 30 },
    { header: "Hires", key: "hires", width: 12 },
    { header: "Avg TTH (days)", key: "avgTTH", width: 18 },
  ];

  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "E2E8F0" } };

  data.forEach((row) => {
    sheet.addRow({ recruiter: row.recruiter, hires: row.hires, avgTTH: row.avgTTH });
  });

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", `attachment; filename="${baseFilename}.xlsx"`);

  await workbook.xlsx.write(res);
  return res.end();
};

const sendPDF = (res, data, baseFilename, startDate, endDate) => {
  const doc = new PDFDocument({ margin: 40, size: "A4" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${baseFilename}.pdf"`);

  doc.pipe(res);

  doc.fontSize(18).fillColor("#0f172a").text("Recruiter Performance Report");
  doc.moveDown(0.3);

  const rangeText =
    startDate && endDate
      ? `Date range: ${startDate} to ${endDate}`
      : startDate
      ? `From: ${startDate}`
      : endDate
      ? `Until: ${endDate}`
      : "Date range: All time";

  doc.fontSize(10).fillColor("#64748b").text(rangeText);
  doc.moveDown(1);

  const col1X = 40, col2X = 330, col3X = 430;
  const tableTop = doc.y;

  doc.fontSize(11).fillColor("#0f172a");
  doc.text("Recruiter", col1X, tableTop);
  doc.text("Hires", col2X, tableTop);
  doc.text("Avg TTH", col3X, tableTop);

  doc.moveTo(col1X, tableTop + 16).lineTo(555, tableTop + 16).strokeColor("#e2e8f0").stroke();

  let rowY = tableTop + 28;

  if (data.length === 0) {
    doc.fontSize(10).fillColor("#94a3b8").text("No hires in this date range.", col1X, rowY);
  }

  data.forEach((row) => {
    if (rowY > 760) {
      doc.addPage();
      rowY = 50;
    }

    doc.fontSize(10).fillColor("#1e293b");
    doc.text(row.recruiter, col1X, rowY, { width: 250 });
    doc.text(String(row.hires), col2X, rowY);
    doc.text(`${row.avgTTH}d`, col3X, rowY);

    doc.moveTo(col1X, rowY + 16).lineTo(555, rowY + 16).strokeColor("#f1f5f9").stroke();
    rowY += 25;
  });

  doc.end();
};

// =====================================================
// EXPORT REPORT
// =====================================================
const exportReport = async (req, res) => {
  try {
    const { format, startDate, endDate } = req.query;
    const allowedFormats = ["pdf", "excel", "csv"];

    if (!format || !allowedFormats.includes(format)) {
      return res.status(400).json({
        success: false,
        message: "format must be one of: pdf, excel, csv",
      });
    }

    const dateError = validateDates(startDate, endDate);
    if (dateError) {
      return res.status(400).json({ success: false, message: dateError });
    }

        const data = await getRecruiterPerformanceData(startDate, endDate);
    const baseFilename = buildBaseFilename(startDate, endDate);

    await logActivity({
      userId: req.user?.id,
      action: "EXPORT",
      module: "Reports",
      description: `Exported recruiter performance report (${format.toUpperCase()})`,
      method: req.method,
      endpoint: req.originalUrl,
      statusCode: 200,
      ipAddress: req.ip,
    });
    req.auditLogged = true;

    if (format === "csv") return sendCSV(res, data, baseFilename);
    if (format === "excel") return sendExcel(res, data, baseFilename);
    return sendPDF(res, data, baseFilename, startDate, endDate);
  } catch (error) {
    console.error("EXPORT REPORT ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to export report" });
  }
};

module.exports = {
  getRecruiterPerformance,
  exportReport,
};