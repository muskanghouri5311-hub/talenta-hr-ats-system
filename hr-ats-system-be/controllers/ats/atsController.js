const ATSResult = require("../../models/ATSResult");
const Candidate = require("../../models/Candidate");

const {
  calculateATSScore,
  getAutoStage,
} = require("../../services/ats/atsScoringService");

/* =========================================================
   SAVE ATS RESULT
   ========================================================= */

const saveATSResult = async (result) => {
  const query = {
    candidateId: result.candidateId,
  };

  // requisitionId is metadata/filtering only.
  // It is NOT used for ATS score calculation.
  if (result.requisitionId) {
    query.requisitionId = result.requisitionId;
  }

  const updateData = {
    candidateId: result.candidateId,

    score: result.score,

    scoreInterpretation:
      result.scoreInterpretation || "",

    matchedSkills:
      result.matchedSkills || [],

    missingSkills:
      result.missingSkills || [],

    educationScore:
      result.educationScore || 0,
  };

  if (result.detectedSkills !== undefined) {
    updateData.detectedSkills =
      result.detectedSkills;
  }

  if (result.experienceYears !== undefined) {
    updateData.candidateExperience =
      result.experienceYears;
  }

  if (result.candidateEducation !== undefined) {
    updateData.candidateEducation =
      result.candidateEducation;
  }

  if (result.breakdown !== undefined) {
    updateData.scoring =
      result.breakdown;
  }

  if (result.explanation !== undefined) {
    updateData.explanation =
      result.explanation;
  }

  if (result.requisitionId) {
    updateData.requisitionId =
      result.requisitionId;
  }

  return ATSResult.findOneAndUpdate(
    query,
    updateData,
    {
      upsert: true,
      new: true,
      runValidators: true,
    }
  );
};


/* =========================================================
   CALCULATE ATS SCORE FOR ONE CANDIDATE
   ========================================================= */

const calculateScore = async (req, res) => {
  try {
    const { candidateId } = req.params;

    const candidate =
      await Candidate.findById(candidateId);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    const currentStage =
      candidate.stage || "Applied";

    console.log(
      "========================================"
    );

    console.log("MANUAL ATS RE-SCORE");

    console.log(
      "Candidate:",
      candidate.name
    );

    console.log(
      "Candidate ID:",
      candidate._id
    );

    console.log(
      "Current Stage:",
      currentStage
    );

    console.log(
      "ATS MODE: CV ONLY"
    );

    console.log(
      "========================================"
    );

    /*
      IMPORTANT:

      calculateATSScore() only receives candidateId.

      Therefore ATS score is calculated from
      candidate CV/resume data only.

      Requisition/JD is NOT passed to the
      scoring service.
    */

    const result =
      await calculateATSScore(
        candidateId
      );

    console.log(
      "ATS SCORE:",
      result.score
    );

    /*
      Save ATS result.

      Requisition ID is stored only as metadata.
    */

    const atsResult =
      await saveATSResult({
        ...result,
        candidateId: candidate._id,
        requisitionId:
          candidate.requisitionId || null,
      });

    /*
      Update candidate score.
    */

    candidate.score =
      result.score;

    /*
      Existing automatic stage logic
      remains unchanged.
    */

    const newStage =
      getAutoStage(
        result.score,
        currentStage
      );

    if (
      newStage &&
      newStage !== currentStage
    ) {
      candidate.stage =
        newStage;

      console.log(
        "ATS AUTO STAGE:",
        currentStage,
        "->",
        newStage
      );
    } else {
      console.log(
        "ATS STAGE UNCHANGED:",
        currentStage
      );
    }

    /*
      Update screening score.
    */

    if (!candidate.screening) {
      candidate.screening = {};
    }

    candidate.screening.score =
      result.score;

    await candidate.save();

    return res.status(200).json({
      success: true,

      message:
        "ATS score calculated successfully",

      data: {
        atsResult,

        candidateId:
          candidate._id,

        score:
          result.score,

        previousStage:
          currentStage,

        currentStage:
          candidate.stage,

        stageChanged:
          currentStage !==
          candidate.stage,

        breakdown:
          result.breakdown || {},

        detectedSkills:
          result.detectedSkills || [],

        experienceYears:
          result.experienceYears || 0,

        explanation:
          result.explanation || [],
      },
    });
  } catch (error) {
    console.error(
      "ATS SCORE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* =========================================================
   GET ATS RESULT FOR ONE CANDIDATE
   ========================================================= */

const getCandidateATSResult = async (
  req,
  res
) => {
  try {
    const { candidateId } =
      req.params;

    const result =
      await ATSResult.findOne({
        candidateId,
      }).sort({
        createdAt: -1,
      });

    if (!result) {
      return res.status(404).json({
        success: false,
        message:
          "ATS result not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(
      "GET ATS RESULT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* =========================================================
   GET ATS RANKING
   =========================================================

   Route:

   GET /ats/ranking
        -> all candidates

   GET /ats/ranking/:requisitionId
        -> candidates of selected job only

   IMPORTANT:

   requisitionId is ONLY used to filter candidates.

   It does NOT participate in ATS score calculation.
   ========================================================= */

const getRanking = async (
  req,
  res
) => {
  try {
    const { requisitionId } =
      req.params;

    /*
      -----------------------------------------
      BUILD CANDIDATE FILTER
      -----------------------------------------

      No requisition selected:
      {}
      => all candidates

      Requisition selected:
      { requisitionId }
      => only candidates belonging to
         that requisition
    */

    const candidateFilter =
      requisitionId
        ? {
            requisitionId:
              requisitionId,
          }
        : {};

    console.log(
      "========================================"
    );

    console.log(
      "CV-ONLY ATS RANKING"
    );

    if (requisitionId) {
      console.log(
        "FILTER REQUISITION:",
        requisitionId
      );
    } else {
      console.log(
        "FILTER REQUISITION: ALL"
      );
    }

    console.log(
      "========================================"
    );

    /*
      Fetch candidates.

      IMPORTANT:
      We filter candidates by requisitionId,
      but we do NOT fetch JD data and do NOT
      use JD requirements for scoring.
    */

    const candidates =
      await Candidate.find(
        candidateFilter
      );

    console.log(
      "Total Candidates:",
      candidates.length
    );

    /*
      If a job was selected and no candidates
      belong to that job.
    */

    if (
      requisitionId &&
      candidates.length === 0
    ) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        message:
          "No candidates found for this job.",
      });
    }

    /*
      -----------------------------------------
      CALCULATE ATS SCORE
      -----------------------------------------

      Each candidate is scored independently
      using CV/resume data only.
    */

    const ranking =
      await Promise.all(
        candidates.map(
          async (candidate) => {
            try {
              /*
                CV-ONLY SCORE

                No requisitionId is passed
                to calculateATSScore().
              */

              const result =
                await calculateATSScore(
                  candidate._id
                );

              /*
                Save ATS result.

                requisitionId is stored as
                metadata only.
              */

              await saveATSResult({
                ...result,

                candidateId:
                  candidate._id,

                requisitionId:
                  candidate.requisitionId ||
                  null,
              });

              /*
                Update candidate's latest score.
              */

              await Candidate.findByIdAndUpdate(
                candidate._id,
                {
                  score:
                    result.score,

                  "screening.score":
                    result.score,
                }
              );

              /*
                Return ranking object.
              */

              return {
                candidateId:
                  candidate._id,

                name:
                  candidate.name,

                email:
                  candidate.email,

                phone:
                  candidate.phone || "",

                role:
                  candidate.role || "",

                experience:
                  candidate.experience || "",

                education:
                  candidate.education || "",

                skills:
                  candidate.skills || [],

                tags:
                  candidate.tags || [],

                /*
                  ATS SCORE
                */

                score:
                  result.score,

                /*
                  ATS BREAKDOWN
                */

                breakdown:
                  result.breakdown || {},

                /*
                  DETECTED CV SKILLS
                */

                detectedSkills:
                  result.detectedSkills ||
                  result.matchedSkills ||
                  [],

                /*
                  EXPLANATION
                */

                explanation:
                  result.explanation || [],

                /*
                  EXPERIENCE DETECTED
                  FROM CV
                */

                candidateExperience:
                  result.experienceYears ||
                  0,

                candidateEducation:
                  result.candidateEducation ||
                  "",

                educationScore:
                  result.educationScore ||
                  0,

                /*
                  SKILLS
                */

                matchedSkills:
                  result.matchedSkills ||
                  result.detectedSkills ||
                  [],

                /*
                  Since this is CV-only ATS,
                  there is no JD target list.
                */

                missingSkills:
                  result.missingSkills ||
                  [],

                /*
                  Candidate workflow stage
                */

                stage:
                  candidate.stage ||
                  "Applied",

                status:
                  candidate.status || "",

                notes:
                  candidate.notes || [],

                /*
                  Job/requisition metadata.

                  Used only so frontend can know
                  which job the candidate belongs to.
                */

                requisitionId:
                  candidate.requisitionId ||
                  null,
              };
            } catch (error) {
              console.error(
                `ATS calculation failed for candidate ${candidate._id}:`,
                error.message
              );

              return null;
            }
          }
        )
      );

    /*
      Remove failed candidates.
    */

    const validRanking =
      ranking.filter(Boolean);

    /*
      Sort by ATS score:
      Highest score first.
    */

    validRanking.sort(
      (a, b) =>
        Number(b.score || 0) -
        Number(a.score || 0)
    );

    /*
      Assign rank AFTER filtering and sorting.

      Example:

      Job A has 3 candidates:

      Candidate 1 = 90
      Candidate 2 = 82
      Candidate 3 = 70

      Their ranks become:

      1
      2
      3

      They do NOT retain global ranks.
    */

    const finalRanking =
      validRanking.map(
        (candidate, index) => ({
          rank:
            index + 1,

          ...candidate,
        })
      );

    console.log(
      "Final ATS Ranking Count:",
      finalRanking.length
    );

    return res.status(200).json({
      success: true,

      count:
        finalRanking.length,

      data:
        finalRanking,
    });
  } catch (error) {
    console.error(
      "GET ATS RANKING ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* =========================================================
   EXPORTS
   ========================================================= */

module.exports = {
  calculateScore,
  getCandidateATSResult,
  getRanking,
};