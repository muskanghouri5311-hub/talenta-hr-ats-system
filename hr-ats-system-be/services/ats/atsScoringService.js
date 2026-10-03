const Candidate = require("../../models/Candidate");

const SCORE_WEIGHTS = {
  parsing: 25,
  structure: 20,
  formatting: 15,
  skills: 15,
  experience: 15,
  education: 5,
  contact: 5,
};

const SHORTLIST_THRESHOLD = 75;

const normalize = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}+#./-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeSkill = (value) =>
  normalize(value)
    .replace(/\.js\b/g, " js")
    .replace(/\.css\b/g, " css")
    .replace(/\.html\b/g, " html")
    .trim();

const escapeRegex = (value) =>
  String(value || "").replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

const containsPhrase = (text, phrase) => {
  const source = normalize(text);
  const target = normalizeSkill(phrase);

  if (!source || !target) {
    return false;
  }

  const escaped = escapeRegex(target);

  const regex = new RegExp(
    `(^|[^a-z0-9+#.-])${escaped}(?=$|[^a-z0-9+#.-])`,
    "i"
  );

  return regex.test(source);
};

const skillAliases = {
  javascript: ["javascript", "java script", "js"],
  typescript: ["typescript", "type script", "ts"],
  react: ["react", "reactjs", "react.js"],
  nextjs: ["nextjs", "next.js", "next js"],
  nodejs: ["nodejs", "node.js", "node js"],
  express: ["express", "expressjs", "express.js"],
  mongodb: ["mongodb", "mongo db", "mongo"],
  mysql: ["mysql"],
  postgresql: ["postgresql", "postgres"],
  sql: ["sql"],
  html: ["html", "html5"],
  css: ["css", "css3"],
  tailwind: ["tailwind", "tailwindcss", "tailwind css"],
  bootstrap: ["bootstrap"],
  redux: ["redux", "redux toolkit"],
  git: ["git"],
  github: ["github"],
  gitlab: ["gitlab"],
  docker: ["docker"],
  kubernetes: ["kubernetes", "k8s"],
  aws: ["aws", "amazon web services"],
  azure: ["azure", "microsoft azure"],
  gcp: ["gcp", "google cloud", "google cloud platform"],
  firebase: ["firebase"],
  python: ["python"],
  java: ["java"],
  csharp: ["c#", "c sharp", "csharp"],
  cpp: ["c++", "cpp"],
  php: ["php"],
  laravel: ["laravel"],
  django: ["django"],
  flask: ["flask"],
  spring: ["spring", "spring boot"],
  dotnet: [".net", "dotnet", "asp.net", "asp net"],
  angular: ["angular", "angularjs"],
  vue: ["vue", "vuejs", "vue.js"],
  figma: ["figma"],
  jira: ["jira"],
  postman: ["postman"],
  graphql: ["graphql"],
  restapi: [
    "rest api",
    "restful api",
    "restful",
    "rest apis",
  ],
  api: ["api", "apis"],
  json: ["json"],
  npm: ["npm"],
  yarn: ["yarn"],
  linux: ["linux"],
  windows: ["windows"],
  excel: ["excel", "microsoft excel"],
  word: ["word", "microsoft word"],
  powerpoint: ["powerpoint", "microsoft powerpoint"],
  tableau: ["tableau"],
  powerbi: ["power bi", "powerbi"],
  machinelearning: ["machine learning", "ml"],
  deeplearning: ["deep learning"],
  tensorflow: ["tensorflow"],
  pytorch: ["pytorch"],
  pandas: ["pandas"],
  numpy: ["numpy"],
  scikitlearn: [
    "scikit learn",
    "scikit-learn",
    "sklearn",
  ],
};

const standardSections = [
  "summary",
  "professional summary",
  "profile",
  "objective",
  "experience",
  "work experience",
  "professional experience",
  "employment",
  "education",
  "skills",
  "technical skills",
  "projects",
  "certifications",
  "certificates",
  "achievements",
  "awards",
  "languages",
  "contact",
  "contact information",
];

const experienceSections = [
  "experience",
  "work experience",
  "professional experience",
  "employment",
];

const skillSections = [
  "skills",
  "technical skills",
];

const getLines = (resumeText) =>
  String(resumeText || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

const getBulletLines = (resumeText) =>
  getLines(resumeText).filter((line) =>
    /^[•●▪■◆►▸*+-]\s+/.test(line)
  );

const getDetectedSkills = (resumeText) => {
  const detected = [];

  Object.entries(skillAliases).forEach(
    ([canonical, aliases]) => {
      const found = aliases.some((alias) =>
        containsPhrase(resumeText, alias)
      );

      if (found) {
        detected.push(canonical);
      }
    }
  );

  return [...new Set(detected)];
};

const getSectionHeadings = (resumeText) => {
  const lines = getLines(resumeText);
  const headings = [];

  lines.forEach((line) => {
    const cleaned = line
      .replace(/^[•●▪■◆►▸*_-]\s*/, "")
      .replace(/[:|_-]+$/, "")
      .trim();

    const normalizedLine = normalize(cleaned);

    const matched = standardSections.find(
      (section) =>
        normalizedLine === normalize(section)
    );

    if (matched) {
      headings.push(normalize(matched));
    }
  });

  return [...new Set(headings)];
};

const hasEmail = (text) =>
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(
    text
  );

const hasPhone = (text) =>
  /(?:\+?\d[\d\s().-]{7,}\d)/.test(text);

const hasLinkedIn = (text) =>
  /linkedin(?:\.com\/in\/|[\s:])/i.test(text);

const hasLocation = (text) =>
  /\b(lahore|karachi|islamabad|rawalpindi|peshawar|quetta|multan|faisalabad|gujranwala|new york|california|texas|london|dubai|canada|usa|united states|pakistan|india|uk)\b/i.test(
    text
  );

const getMonthPattern = () =>
  "(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";

const extractEmploymentRanges = (resumeText) => {
  const text = String(resumeText || "");
  const month = getMonthPattern();

  const pattern = new RegExp(
    `\\b(?:${month}\\s+)?((?:19|20)\\d{2})\\s*(?:-|–|—|to)\\s*(?:${month}\\s+)?((?:19|20)\\d{2}|present|current)\\b`,
    "gi"
  );

  return [...text.matchAll(pattern)].map(
    (match) => ({
      startYear: Number(match[1]),
      endYear: [
        "present",
        "current",
      ].includes(
        String(match[2]).toLowerCase()
      )
        ? new Date().getFullYear()
        : Number(match[2]),
    })
  );
};

const extractExperienceYears = (resumeText) => {
  const text = String(resumeText || "");

  const explicitPatterns = [
    /(\d+(?:\.\d+)?)\s*\+?\s*years?\s+of\s+(?:professional\s+|relevant\s+)?experience/i,
    /experience\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*\+?\s*years?/i,
    /(\d+(?:\.\d+)?)\s*\+?\s*years?\s+(?:professional|relevant)\s+experience/i,
  ];

  for (const pattern of explicitPatterns) {
    const match = text.match(pattern);

    if (match) {
      return Number(match[1]);
    }
  }

  const ranges = extractEmploymentRanges(text);

  if (!ranges.length) {
    return 0;
  }

  let totalMonths = 0;

  ranges.forEach(
    ({ startYear, endYear }) => {
      if (
        Number.isFinite(startYear) &&
        Number.isFinite(endYear) &&
        endYear >= startYear
      ) {
        totalMonths +=
          (endYear - startYear) * 12;
      }
    }
  );

  return Math.round(
    (totalMonths / 12) * 10
  ) / 10;
};

const clamp = (value, min, max) =>
  Math.max(min, Math.min(max, value));

const calculateParsingScore = (resumeText) => {
  const text = String(resumeText || "").trim();

  if (!text) {
    return {
      score: 0,
      details: [
        "Resume text could not be parsed",
      ],
    };
  }

  const lines = getLines(text);
  const sections = getSectionHeadings(text);

  const replacementCharacters =
    (text.match(/�/g) || []).length;

  const brokenCharacters =
    (text.match(/[█▓▒░]{3,}/g) || []).length;

  const repeatedSymbols =
    (
      text.match(
        /[|]{4,}|[-]{8,}|[_]{8,}/g
      ) || []
    ).length;

  const veryLongLines =
    lines.filter(
      (line) => line.length > 220
    ).length;

  const extremelyLongLines =
    lines.filter(
      (line) => line.length > 350
    ).length;

  const shortMeaninglessLines =
    lines.filter(
      (line) =>
        line.length <= 2 &&
        !/^\d$/.test(line)
    ).length;

  const details = [];

  let score = 0;

  const extractionQuality =
    replacementCharacters === 0 &&
    brokenCharacters === 0;

  if (extractionQuality) {
    score += 7;
    details.push(
      "Resume text is readable and extractable"
    );
  } else {
    score += 1;
    details.push(
      "Broken extraction characters detected"
    );
  }

  if (sections.length >= 5) {
    score += 5;
  } else if (sections.length >= 3) {
    score += 4;
  } else if (sections.length >= 1) {
    score += 2;
  } else {
    details.push(
      "Standard resume sections are difficult to identify"
    );
  }

  if (lines.length >= 20) {
    score += 4;
  } else if (lines.length >= 10) {
    score += 3;
  } else if (lines.length >= 5) {
    score += 2;
  } else {
    score += 1;
  }

  if (
    veryLongLines === 0 &&
    extremelyLongLines === 0
  ) {
    score += 3;
  } else if (
    veryLongLines <= 2 &&
    extremelyLongLines === 0
  ) {
    score += 2;
    details.push(
      "A small number of long lines were detected"
    );
  } else {
    score += 1;
    details.push(
      "Several unusually long lines may affect parsing"
    );
  }

  if (shortMeaninglessLines <= 2) {
    score += 2;
  } else if (shortMeaninglessLines <= 5) {
    score += 1;
    details.push(
      "Several very short extracted lines were detected"
    );
  } else {
    details.push(
      "Many very short extracted lines may indicate fragmented text"
    );
  }

  if (repeatedSymbols === 0) {
    score += 2;
  } else {
    details.push(
      "Repeated separator symbols may interfere with parsing"
    );
  }

  if (
    replacementCharacters > 0 ||
    brokenCharacters > 0
  ) {
    score -= 4;
  }

  if (repeatedSymbols >= 2) {
    score -= 3;
  }

  if (extremelyLongLines >= 2) {
    score -= 2;
  }

  return {
    score: clamp(
      Math.round(score),
      0,
      SCORE_WEIGHTS.parsing
    ),
    details,
  };
};

const calculateStructureScore = (resumeText) => {
  const text = String(resumeText || "");
  const sections = getSectionHeadings(text);
  const bullets = getBulletLines(text);

  const hasExperience =
    experienceSections.some(
      (section) =>
        sections.includes(section)
    );

  const hasSkills =
    skillSections.some(
      (section) =>
        sections.includes(section)
    );

  const hasEducation =
    sections.includes("education");

  const hasProjects =
    sections.includes("projects");

  const hasSummary =
    sections.includes("summary") ||
    sections.includes("professional summary") ||
    sections.includes("profile") ||
    sections.includes("objective");

  const coreSections = [
    hasExperience,
    hasSkills,
    hasEducation,
  ].filter(Boolean).length;

  const details = [];

  let score = 0;

  if (coreSections === 3) {
    score += 8;
    details.push(
      "Core resume sections are clearly organized"
    );
  } else if (coreSections === 2) {
    score += 6;
    details.push(
      "Most core resume sections are identifiable"
    );
  } else if (coreSections === 1) {
    score += 3;
    details.push(
      "Only one core resume section is clearly identifiable"
    );
  } else {
    details.push(
      "Core resume sections are not clearly identifiable"
    );
  }

  if (hasExperience) {
    score += 4;
  }

  if (
    bullets.length >= 3 &&
    hasExperience
  ) {
    score += 3;
    details.push(
      "Experience content has a structured bullet format"
    );
  } else if (
    bullets.length >= 1 &&
    hasExperience
  ) {
    score += 2;
    details.push(
      "Some structured experience bullets are detected"
    );
  } else if (hasExperience) {
    score += 1;
    details.push(
      "Experience section has limited bullet structure"
    );
  }

  if (hasEducation) {
    score += 2;
  }

  if (hasSummary || hasProjects) {
    score += 1;
  }

  if (!hasExperience) {
    score -= 3;
    details.push(
      "Experience section is missing or unclear"
    );
  }

  if (!hasSkills) {
    score -= 2;
    details.push(
      "Skills section is missing or unclear"
    );
  }

  if (!hasEducation) {
    score -= 1;
  }

  return {
    score: clamp(
      Math.round(score),
      0,
      SCORE_WEIGHTS.structure
    ),
    details,
  };
};

const calculateFormattingScore = (resumeText) => {
  const text = String(resumeText || "");
  const lines = getLines(text);

  const tableLike =
    /\|.+\|/.test(text) ||
    /\t.+\t/.test(text) ||
    /\s{8,}\S+\s{8,}\S+/.test(text);

  const brokenFormatting =
    /�+/.test(text) ||
    /#{5,}/.test(text) ||
    /\*{8,}/.test(text) ||
    /_{8,}/.test(text) ||
    /={8,}/.test(text);

  const skillBars =
    /(?:skill|skills|proficiency|expertise).{0,100}(?:█{2,}|▓{2,}|▒{2,}|░{2,}|●{2,}|○{2,}|⭐{2,})/i.test(
      text
    );

  const uppercaseLines = lines.filter(
    (line) => {
      const letters = line.replace(
        /[^A-Za-z]/g,
        ""
      );

      if (letters.length < 15) {
        return false;
      }

      return (
        letters ===
        letters.toUpperCase()
      );
    }
  ).length;

  const dateFormats = new Set();

  if (
    /\b(?:19|20)\d{2}\s*-\s*(?:19|20)\d{2}\b/.test(
      text
    )
  ) {
    dateFormats.add("hyphen");
  }

  if (
    /\b(?:19|20)\d{2}\s*–\s*(?:19|20)\d{2}\b/.test(
      text
    )
  ) {
    dateFormats.add("en-dash");
  }

  if (
    /\b(?:19|20)\d{2}\s*—\s*(?:19|20)\d{2}\b/.test(
      text
    )
  ) {
    dateFormats.add("em-dash");
  }

  if (
    /\b(?:19|20)\d{2}\s+to\s+(?:19|20)\d{2}\b/i.test(
      text
    )
  ) {
    dateFormats.add("to");
  }

  const details = [];

  let score = 10;

  if (tableLike) {
    score -= 4;
    details.push(
      "Table-like text structure detected"
    );
  }

  if (brokenFormatting) {
    score -= 4;
    details.push(
      "Unusual formatting characters detected"
    );
  }

  if (skillBars) {
    score -= 4;
    details.push(
      "Visual skill bars detected"
    );
  }

  if (uppercaseLines >= 5) {
    score -= 2;
    details.push(
      "Excessive uppercase formatting detected"
    );
  } else if (uppercaseLines >= 3) {
    score -= 1;
    details.push(
      "Several uppercase lines detected"
    );
  }

  if (dateFormats.size > 1) {
    score -= 1;
    details.push(
      "Multiple employment date separator styles detected"
    );
  } else if (dateFormats.size === 1) {
    details.push(
      "Employment date formatting appears consistent"
    );
  }

  if (getBulletLines(text).length === 0) {
    score -= 2;
    details.push(
      "No standard bullet formatting detected"
    );
  }

  if (getSectionHeadings(text).length < 3) {
    score -= 2;
  }

  if (
    !tableLike &&
    !brokenFormatting &&
    !skillBars &&
    uppercaseLines < 3 &&
    dateFormats.size <= 1 &&
    getBulletLines(text).length > 0
  ) {
    score += 2;
  }

  return {
    score: clamp(
      Math.round(score),
      0,
      SCORE_WEIGHTS.formatting
    ),
    details,
  };
};

const calculateSkillsScore = (resumeText) => {
  const text = String(resumeText || "");
  const sections = getSectionHeadings(text);

  const detectedSkills =
    getDetectedSkills(text);

  const hasSkillsSection =
    sections.includes("skills") ||
    sections.includes("technical skills");

  const hasSkillBars =
    /(?:skill|skills|proficiency|expertise).{0,100}(?:█{2,}|▓{2,}|▒{2,}|░{2,}|●{2,}|○{2,}|⭐{2,})/i.test(
      text
    );

  const details = [];

  let score = 0;

  if (hasSkillsSection) {
    score += 7;
    details.push(
      "Dedicated skills section detected"
    );
  } else if (detectedSkills.length > 0) {
    score += 2;
    details.push(
      "Recognizable skills are present in searchable text"
    );
  } else {
    details.push(
      "No recognizable skills section detected"
    );
  }

  if (detectedSkills.length >= 8) {
    score += 3;
  } else if (detectedSkills.length >= 4) {
    score += 2;
  } else if (detectedSkills.length >= 1) {
    score += 1;
  }

  if (
    hasSkillsSection &&
    detectedSkills.length >= 3
  ) {
    score += 2;
    details.push(
      "Multiple recognizable skills are available as searchable text"
    );
  }

  if (hasSkillBars) {
    score -= 5;
    details.push(
      "Visual skill bars may reduce text extraction reliability"
    );
  }

  if (
    hasSkillsSection &&
    detectedSkills.length === 0
  ) {
    score -= 3;
    details.push(
      "Skills heading detected but recognizable skill text is limited"
    );
  }

  if (
    !hasSkillsSection &&
    detectedSkills.length < 2
  ) {
    score -= 1;
  }

  return {
    score: clamp(
      Math.round(score),
      0,
      SCORE_WEIGHTS.skills
    ),
    detectedSkills,
    details,
  };
};

const calculateExperienceScore = (resumeText) => {
  const text = String(resumeText || "");
  const sections = getSectionHeadings(text);
  const bullets = getBulletLines(text);
  const dateRanges =
    extractEmploymentRanges(text);

  const hasExperienceHeading =
    experienceSections.some(
      (section) =>
        sections.includes(section)
    );

  const jobTitlePattern =
    /\b(developer|engineer|designer|manager|analyst|consultant|administrator|specialist|coordinator|executive|intern|associate|lead|architect|director|officer|assistant|recruiter|accountant|tester|qa)\b/i;

  const hasJobTitle =
    jobTitlePattern.test(text);

  const details = [];

  let score = 0;

  if (hasExperienceHeading) {
    score += 4;
    details.push(
      "Experience section is clearly identified"
    );
  } else {
    details.push(
      "Experience heading is not clearly identified"
    );
  }

  if (dateRanges.length >= 3) {
    score += 3;
    details.push(
      "Multiple employment date ranges are detectable"
    );
  } else if (dateRanges.length >= 2) {
    score += 3;
    details.push(
      "Employment date ranges are detectable"
    );
  } else if (dateRanges.length === 1) {
    score += 2;
    details.push(
      "Employment date range is detectable"
    );
  } else {
    details.push(
      "Employment date ranges are not clearly detectable"
    );
  }

  if (hasJobTitle) {
    score += 2;
    details.push(
      "Job-title information is detectable"
    );
  }

  if (bullets.length >= 6) {
    score += 3;
    details.push(
      "Experience content uses structured bullets"
    );
  } else if (bullets.length >= 3) {
    score += 2;
    details.push(
      "Experience content contains structured bullets"
    );
  } else if (bullets.length >= 1) {
    score += 1;
  } else if (hasExperienceHeading) {
    score -= 2;
    details.push(
      "Experience section has no structured bullet content"
    );
  }

  if (
    hasExperienceHeading &&
    dateRanges.length === 0
  ) {
    score -= 2;
  }

  if (
    hasExperienceHeading &&
    !hasJobTitle
  ) {
    score -= 1;
  }

  if (!hasExperienceHeading) {
    score -= 3;
  }

  return {
    score: clamp(
      Math.round(score),
      0,
      SCORE_WEIGHTS.experience
    ),
    years:
      extractExperienceYears(
        resumeText
      ),
    details,
  };
};

const calculateEducationScore = (resumeText) => {
  const text = String(resumeText || "");
  const sections = getSectionHeadings(text);

  const hasEducation =
    sections.includes("education");

  const degreePattern =
    /\b(bachelor|bachelors|master|masters|mba|phd|doctorate|associate|b\.?s\.?|b\.?a\.?|m\.?s\.?|m\.?a\.?|b\.?e\.?|b\.?tech|m\.?e\.?|m\.?tech)\b/i;

  const institutionPattern =
    /\b(university|college|institute|school|academy)\b/i;

  const certificationPattern =
    /\b(certified|certification|certificate|certifications|license|licensed)\b/i;

  const details = [];

  let score = 0;

  if (hasEducation) {
    score += 2;
    details.push(
      "Education section detected"
    );
  } else {
    details.push(
      "Education section is not clearly identified"
    );
  }

  if (
    hasEducation &&
    degreePattern.test(text)
  ) {
    score += 1;
    details.push(
      "Degree information detected"
    );
  }

  if (
    hasEducation &&
    institutionPattern.test(text)
  ) {
    score += 1;
    details.push(
      "Educational institution information detected"
    );
  }

  if (
    hasEducation &&
    certificationPattern.test(text)
  ) {
    score += 1;
    details.push(
      "Certification information detected"
    );
  }

  return {
    score: clamp(
      score,
      0,
      SCORE_WEIGHTS.education
    ),
    details,
  };
};

const calculateContactScore = (resumeText) => {
  const text = String(resumeText || "");

  const email = hasEmail(text);
  const phone = hasPhone(text);
  const linkedin = hasLinkedIn(text);
  const location = hasLocation(text);

  const details = [];

  let score = 0;

  if (email) {
    score += 2;
    details.push("Email detected");
  } else {
    details.push(
      "Email address not detected"
    );
  }

  if (phone) {
    score += 2;
    details.push(
      "Phone number detected"
    );
  } else {
    details.push(
      "Phone number not detected"
    );
  }

  if (linkedin) {
    score += 1;
    details.push(
      "LinkedIn information detected"
    );
  } else if (location) {
    score += 1;
    details.push(
      "Location information detected"
    );
  } else {
    details.push(
      "LinkedIn or location information not detected"
    );
  }

  return {
    score: clamp(
      score,
      0,
      SCORE_WEIGHTS.contact
    ),
    details,
  };
};

const getAutoStage = (
  score,
  currentStage
) => {
  const normalizedStage =
    String(
      currentStage || "Applied"
    ).trim();

  const numericScore = Number(score);

  if (!Number.isFinite(numericScore)) {
    return normalizedStage;
  }

  const protectedStages = [
    "Shortlisted",
    "Interview",
    "Offer Sent",
    "Hired",
    "Rejected",
  ];

  if (
    protectedStages.includes(
      normalizedStage
    )
  ) {
    return normalizedStage;
  }

  if (
    normalizedStage === "Applied" ||
    normalizedStage === "Screening"
  ) {
    return numericScore >=
      SHORTLIST_THRESHOLD
      ? "Shortlisted"
      : "Screening";
  }

  return normalizedStage;
};

const getScoreExplanation = ({
  score,
  parsing,
  structure,
  formatting,
  skills,
  experience,
  education,
  contact,
}) => {
  return [
    `Final ATS score: ${score}/100.`,
    `ATS Parsing & Readability: ${parsing.score}/${SCORE_WEIGHTS.parsing}.`,
    `CV Structure: ${structure.score}/${SCORE_WEIGHTS.structure}.`,
    `Formatting: ${formatting.score}/${SCORE_WEIGHTS.formatting}.`,
    `Skills & Keywords: ${skills.score}/${SCORE_WEIGHTS.skills}.`,
    `Experience Quality: ${experience.score}/${SCORE_WEIGHTS.experience}.`,
    `Education & Certifications: ${education.score}/${SCORE_WEIGHTS.education}.`,
    `Contact Information: ${contact.score}/${SCORE_WEIGHTS.contact}.`,
  ];
};

const createEmptyATSResult = () => ({
  score: 0,

  detectedSkills: [],

  matchedSkills: [],

  missingSkills: [],

  experienceYears: 0,

  candidateEducation: "",

  educationScore: 0,

  breakdown: {
    parsing: {
      score: 0,
      max: SCORE_WEIGHTS.parsing,
      details: [
        "Resume text is not available",
      ],
    },

    structure: {
      score: 0,
      max: SCORE_WEIGHTS.structure,
      details: [],
    },

    formatting: {
      score: 0,
      max: SCORE_WEIGHTS.formatting,
      details: [],
    },

    skills: {
      score: 0,
      max: SCORE_WEIGHTS.skills,
      details: [],
    },

    experience: {
      score: 0,
      max: SCORE_WEIGHTS.experience,
      details: [],
    },

    education: {
      score: 0,
      max: SCORE_WEIGHTS.education,
      details: [],
    },

    contact: {
      score: 0,
      max: SCORE_WEIGHTS.contact,
      details: [],
    },
  },

  explanation: [
    "Resume text is not available for ATS analysis.",
  ],
});

const calculateATSScore = async (
  candidateId
) => {
  const candidate =
    await Candidate.findById(
      candidateId
    );

  if (!candidate) {
    throw new Error(
      "Candidate not found"
    );
  }

  const resumeText =
    candidate.resumeText ||
    candidate.cvText ||
    candidate.resume?.text ||
    "";

  if (
    !resumeText ||
    !String(resumeText).trim()
  ) {
    return createEmptyATSResult();
  }

  const parsing =
    calculateParsingScore(
      resumeText
    );

  const structure =
    calculateStructureScore(
      resumeText
    );

  const formatting =
    calculateFormattingScore(
      resumeText
    );

  const skills =
    calculateSkillsScore(
      resumeText
    );

  const experience =
    calculateExperienceScore(
      resumeText
    );

  const education =
    calculateEducationScore(
      resumeText
    );

  const contact =
    calculateContactScore(
      resumeText
    );

  const rawScore =
    parsing.score +
    structure.score +
    formatting.score +
    skills.score +
    experience.score +
    education.score +
    contact.score;

  const score = clamp(
    Math.round(rawScore),
    0,
    100
  );

  const candidateEducation =
    typeof candidate.education ===
    "string"
      ? candidate.education
      : "";

  const explanation =
    getScoreExplanation({
      score,
      parsing,
      structure,
      formatting,
      skills,
      experience,
      education,
      contact,
    });

  return {
    score,

    detectedSkills:
      skills.detectedSkills,

    matchedSkills:
      skills.detectedSkills,

    missingSkills: [],

    experienceYears:
      experience.years,

    candidateEducation,

    educationScore:
      education.score,

    breakdown: {
      parsing: {
        score: parsing.score,
        max: SCORE_WEIGHTS.parsing,
        details: parsing.details,
      },

      structure: {
        score: structure.score,
        max: SCORE_WEIGHTS.structure,
        details: structure.details,
      },

      formatting: {
        score: formatting.score,
        max: SCORE_WEIGHTS.formatting,
        details: formatting.details,
      },

      skills: {
        score: skills.score,
        max: SCORE_WEIGHTS.skills,
        details: skills.details,
      },

      experience: {
        score: experience.score,
        max: SCORE_WEIGHTS.experience,
        details: experience.details,
      },

      education: {
        score: education.score,
        max: SCORE_WEIGHTS.education,
        details: education.details,
      },

      contact: {
        score: contact.score,
        max: SCORE_WEIGHTS.contact,
        details: contact.details,
      },
    },

    explanation,
  };
};

const calculateATSRanking = async (
  requisitionId = null
) => {
  const filter = requisitionId
    ? { requisitionId }
    : {};

  const candidates =
    await Candidate.find(filter);

  const rankings = [];

  for (const candidate of candidates) {
    try {
      const result =
        await calculateATSScore(
          candidate._id
        );

      const currentStage =
        candidate.stage || "Applied";

      const newStage =
        getAutoStage(
          result.score,
          currentStage
        );

      rankings.push({
        candidateId:
          candidate._id,

        candidate,

        score:
          result.score,

        detectedSkills:
          result.detectedSkills,

        matchedSkills:
          result.matchedSkills,

        missingSkills:
          result.missingSkills,

        experienceYears:
          result.experienceYears,

        candidateEducation:
          result.candidateEducation,

        educationScore:
          result.educationScore,

        breakdown:
          result.breakdown,

        explanation:
          result.explanation,

        stage:
          newStage,

        requisitionId:
          candidate.requisitionId ||
          null,
      });
    } catch (error) {
      rankings.push({
        candidateId:
          candidate._id,

        candidate,

        score: 0,

        detectedSkills: [],

        matchedSkills: [],

        missingSkills: [],

        experienceYears: 0,

        candidateEducation: "",

        educationScore: 0,

        breakdown: {},

        explanation: [
          error.message,
        ],

        stage:
          candidate.stage ||
          "Applied",

        requisitionId:
          candidate.requisitionId ||
          null,
      });
    }
  }

  rankings.sort(
    (a, b) =>
      b.score - a.score
  );

  return rankings.map(
    (item, index) => ({
      ...item,
      rank: index + 1,
    })
  );
};

module.exports = {
  SCORE_WEIGHTS,
  SHORTLIST_THRESHOLD,
  calculateATSScore,
  calculateATSRanking,
  getAutoStage,
  getDetectedSkills,
  extractExperienceYears,
};