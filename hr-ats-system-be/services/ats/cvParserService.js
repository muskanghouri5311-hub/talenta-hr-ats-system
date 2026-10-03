const { PDFParse } = require("pdf-parse");

// =====================================
// Normalize text
// =====================================
const normalize = (value) => {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\w\s.+#-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

// =====================================
// Skill aliases
// =====================================
const skillAliases = {
  react: [
    "react",
    "reactjs",
    "react.js",
  ],

  javascript: [
    "javascript",
    "js",
    "ecmascript",
  ],

  typescript: [
    "typescript",
    "ts",
  ],

  node: [
    "node",
    "nodejs",
    "node.js",
  ],

  express: [
    "express",
    "expressjs",
    "express.js",
  ],

  mongodb: [
    "mongodb",
    "mongo",
  ],

  html: [
    "html",
    "html5",
  ],

  css: [
    "css",
    "css3",
  ],

  tailwind: [
    "tailwind",
    "tailwindcss",
    "tailwind css",
  ],

  bootstrap: [
    "bootstrap",
  ],

  python: [
    "python",
  ],

  java: [
    "java",
  ],

  csharp: [
    "c#",
    "csharp",
  ],

  cpp: [
    "c++",
    "cpp",
  ],

  sql: [
    "sql",
  ],

  mysql: [
    "mysql",
  ],

  postgresql: [
    "postgresql",
    "postgres",
  ],

  git: [
    "git",
    "github",
    "gitlab",
  ],
};

// =====================================
// Extract CV text from PDF
// =====================================
const extractCVText = async (buffer) => {
  if (!buffer) {
    throw new Error(
      "PDF file buffer is missing"
    );
  }

  const parser = new PDFParse({
    data: buffer,
  });

  const result = await parser.getText();

  await parser.destroy();

  return String(result.text || "").trim();
};

// =====================================
// Extract skills from CV text
// =====================================
const extractSkillsFromText = (rawText) => {
  const normalizedText =
    normalize(rawText);

  if (!normalizedText) {
    return [];
  }

  const foundSkills = [];

  Object.entries(skillAliases).forEach(
    ([skillKey, aliases]) => {
      const isPresent = aliases.some(
        (alias) => {
          const normalizedAlias =
            normalize(alias);

          return normalizedText.includes(
            normalizedAlias
          );
        }
      );

      if (isPresent) {
        foundSkills.push(skillKey);
      }
    }
  );

  return foundSkills;
};

module.exports = {
  normalize,
  skillAliases,
  extractCVText,
  extractSkillsFromText,
};