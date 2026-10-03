const fs = require("fs");
const path = require("path");
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const util = require("util");
const libre = require("libreoffice-convert");

libre.convertAsync = util.promisify(libre.convert);

const TEMPLATE_PATH = path.join(
  __dirname,
  "../../templates/offer_letter_template.docx"
);

// -----------------------------------------
// CAPITALIZE FIRST LETTER OF EACH WORD
// (does NOT lowercase the rest — so acronyms
//  like "IT" or "HR" stay exactly as they are)
// -----------------------------------------

const capitalizeWords = (text) => {
  if (!text) return text;

  return text
    .split(" ")
    .map((word) =>
      word ? word.charAt(0).toUpperCase() + word.slice(1) : word
    )
    .join(" ");
};
// -----------------------------------------
// FORMAT DATE LIKE "7th September, 2026"
// -----------------------------------------

const getOrdinalSuffix = (day) => {
  if (day > 3 && day < 21) return "th";

  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
};

const formatDateWithOrdinal = (date) => {
  const d = new Date(date);

  const day = d.getDate();
  const month = d.toLocaleString("en-US", { month: "long" });
  const year = d.getFullYear();

  return `${day}${getOrdinalSuffix(day)} ${month}, ${year}`;
};

// -----------------------------------------
// GENERATE FILLED OFFER LETTER AS DOCX BUFFER
// -----------------------------------------

const generateOfferLetterDocxBuffer = (data) => {
  const content = fs.readFileSync(TEMPLATE_PATH, "binary");
  const zip = new PizZip(content);

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: "{{", end: "}}" },
  });

  doc.render({
    offerDate: formatDateWithOrdinal(data.offerDate),
    candidateName: capitalizeWords(data.candidateName),
    jobTitle: capitalizeWords(data.jobTitle),
    department: capitalizeWords(data.department),
    employmentType: data.employmentType,
    startDate: formatDateWithOrdinal(data.startDate),
    workingType: data.workingType,
    acknowledgeByDate: formatDateWithOrdinal(data.acknowledgeByDate),
  });

  return doc.getZip().generate({ type: "nodebuffer" });
};

// -----------------------------------------
// GENERATE FILLED OFFER LETTER AS PDF BUFFER
// -----------------------------------------

const generateOfferLetterPdfBuffer = async (data) => {
  const docxBuffer = generateOfferLetterDocxBuffer(data);

  const pdfBuffer = await libre.convertAsync(docxBuffer, ".pdf", undefined);

  return pdfBuffer;
};

module.exports = {
  generateOfferLetterDocxBuffer,
  generateOfferLetterPdfBuffer,
  formatDateWithOrdinal,
  capitalizeWords,
};