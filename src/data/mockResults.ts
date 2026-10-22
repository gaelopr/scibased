import type { MockKey, VerdictResult } from "../types";

/**
 * Three fully interactive sample verdicts — one for each status.
 * Every citation below is real and links directly to PubMed.
 */
export const MOCK_RESULTS: Record<MockKey, VerdictResult> = {
  creatine: {
    id: "creatine",
    verdict: "verified",
    label: "Verified",
    score: 86,
    evidenceQuality: "High",
    category: "Muscle & strength",
    platform: "TikTok",
    claim:
      "Creatine supplementation, combined with resistance training, increases muscle mass and strength.",
    conclusion:
      "The effect is real, but modest: creatine adds a small amount of muscle and strength on top of a solid resistance-training program. It is not a shortcut that replaces training, protein, or calories.",
    contextLine:
      "A legitimate supplement with a small, consistent edge — not the transformation the before-and-after photos imply.",
    breakdown: [
      {
        title: "The direct-imaging trials found a small effect",
        body:
          "A 2023 meta-analysis pooled 10 randomized trials and 44 direct-imaging outcomes (MRI, CT, or ultrasound). Creatine plus resistance training produced a very small increase in regional muscle hypertrophy compared with resistance training alone: a pooled standardized estimate of 0.11, with upper- and lower-body muscle thickness about 0.10–0.16 cm greater.",
      },
      {
        title: "Body composition moves in the right direction",
        body:
          "A 2024 meta-analysis of 12 randomized trials found that creatine plus resistance training increased lean body mass by 1.14 kg and reduced fat mass by 0.73 kg versus resistance training alone. Roughly 7 g/day, or 0.3 g/kg/day, was enough to produce about 1 kg more lean mass; adding a carbohydrate drink did not enhance the effect.",
      },
      {
        title: "Training is doing most of the work",
        body:
          "Every included trial combined creatine with resistance training. Creatine raises intramuscular phosphocreatine and can improve high-intensity performance, which may let you complete more productive training. The evidence does not show that creatine builds meaningful muscle on its own.",
      },
      {
        title: "Safety and dose",
        body:
          "The International Society of Sports Nutrition position stand supports 3–5 g/day and reports that short- and long-term use up to 30 g/day for five years is safe and well tolerated in healthy people. People with pre-existing kidney disease should discuss creatine with a clinician. Expect about 1 kg of scale weight from water retention, not new muscle.",
      },
    ],
    remember:
      "Creatine is a small, reliable edge on top of training and protein — not a replacement for either.",
    papers: [
      {
        id: "p-burke-2023",
        title:
          "The Effects of Creatine Supplementation Combined with Resistance Training on Regional Measures of Muscle Hypertrophy: A Systematic Review with Meta-Analysis",
        authors: "Burke R, Piñero A, Coleman M, et al.",
        journal: "Nutrients",
        year: 2023,
        studyType: "Systematic review & meta-analysis",
        finding:
          "Across 10 randomized trials and 44 direct-imaging outcomes, creatine plus resistance training produced a very small increase in regional muscle hypertrophy versus resistance training alone (pooled estimate 0.11; 95% CrI −0.02 to 0.25).",
        pmid: "37432300",
        url: "https://pubmed.ncbi.nlm.nih.gov/37432300/",
        source: "PubMed",
        openAccess: true,
      },
      {
        id: "p-desai-2024",
        title:
          "The Effect of Creatine Supplementation on Resistance Training-Based Changes to Body Composition: A Systematic Review and Meta-analysis",
        authors: "Desai I, Wewege MA, Jones MD, et al.",
        journal: "Journal of Strength and Conditioning Research",
        year: 2024,
        studyType: "Systematic review & meta-analysis",
        finding:
          "In 12 randomized trials, creatine plus resistance training increased lean body mass by 1.14 kg and reduced fat mass by 0.73 kg versus resistance training alone; 7 g/day or 0.3 g/kg/day was likely enough.",
        pmid: "39074168",
        url: "https://pubmed.ncbi.nlm.nih.gov/39074168/",
        source: "PubMed",
      },
      {
        id: "p-kreider-2017",
        title:
          "International Society of Sports Nutrition position stand: safety and efficacy of creatine supplementation in exercise, sport, and medicine",
        authors: "Kreider RB, Kalman DS, Antonio J, et al.",
        journal: "Journal of the International Society of Sports Nutrition",
        year: 2017,
        studyType: "Position stand / review",
        finding:
          "Creatine increases intramuscular creatine and high-intensity performance, and short- and long-term use up to 30 g/day for five years is safe and well tolerated in healthy people.",
        pmid: "28615996",
        url: "https://pubmed.ncbi.nlm.nih.gov/28615996/",
        source: "PubMed",
        openAccess: true,
      },
    ],
  },

  protein: {
    id: "protein",
    verdict: "context",
    label: "Needs context",
    score: 56,
    evidenceQuality: "High",
    category: "Protein",
    platform: "Instagram",
    claim:
      "You need at least 2 g of protein per kg of body weight to build muscle.",
    conclusion:
      "Most people max out resistance-training gains at roughly 1.6 g/kg/day. Two grams is not a requirement, though higher intakes can help preserve muscle during a calorie deficit.",
    contextLine:
      "The advice is half right: protein matters, but the 2 g threshold is a ceiling most lifters do not need to chase.",
    breakdown: [
      {
        title: "The meta-analysis found a breakpoint, not a magic number",
        body:
          "A 2018 meta-analysis of 49 randomized trials with 1,863 participants found that protein supplementation increased fat-free mass by 0.30 kg, one-repetition-maximum strength by 2.49 kg, and muscle fibre cross-sectional area by 310 µm². Beyond a total intake of about 1.62 g/kg/day, there were no further gains in fat-free mass.",
      },
      {
        title: "The practical range is about 1.6–2.2 g/kg",
        body:
          "A 2018 review recommends 0.4 g/kg of protein per meal across at least four meals to reach a minimum of 1.6 g/kg/day. An upper daily intake of 2.2 g/kg/day can be spread across the same meals. That is a range, not a minimum of 2 g/kg.",
      },
      {
        title: "Some people do need more",
        body:
          "The International Society of Sports Nutrition position stand says 1.4–2.0 g/kg/day is sufficient for most exercising people. Higher intakes of 2.3–3.1 g/kg/day may be needed to preserve lean mass during hypocaloric periods. Protein quality, leucine content, and even distribution across the day also matter.",
      },
      {
        title: "The claim confuses a ceiling with a floor",
        body:
          "Two grams per kilogram is not a harmful target for healthy kidneys, but it is not the minimum required for hypertrophy. Total calories, resistance-training stimulus, sleep, and adherence do more to determine muscle gain than pushing protein past the point where the benefit plateaus.",
      },
    ],
    remember:
      "Aim for 1.6–2.0 g/kg/day, spread across 3–5 protein-containing meals. More is not automatically better.",
    papers: [
      {
        id: "p-morton-2018",
        title:
          "A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength in healthy adults",
        authors: "Morton RW, Murphy KT, McKellar SR, et al.",
        journal: "British Journal of Sports Medicine",
        year: 2018,
        studyType: "Systematic review & meta-analysis",
        finding:
          "In 49 randomized trials with 1,863 participants, protein supplementation increased fat-free mass by 0.30 kg and strength by 2.49 kg; intakes above 1.62 g/kg/day produced no further gains in fat-free mass.",
        pmid: "28698222",
        url: "https://pubmed.ncbi.nlm.nih.gov/28698222/",
        source: "PubMed",
        openAccess: true,
      },
      {
        id: "p-schoenfeld-aragon-2018",
        title:
          "How much protein can the body use in a single meal for muscle-building? Implications for daily protein distribution",
        authors: "Schoenfeld BJ, Aragon AA",
        journal: "Journal of the International Society of Sports Nutrition",
        year: 2018,
        studyType: "Narrative review",
        finding:
          "To maximize anabolism, target 0.4 g/kg/meal across at least four meals, reaching at least 1.6 g/kg/day; an upper intake of 2.2 g/kg/day can be spread across the same meals.",
        pmid: "29497353",
        url: "https://pubmed.ncbi.nlm.nih.gov/29497353/",
        source: "PubMed",
        openAccess: true,
      },
      {
        id: "p-jager-2017",
        title:
          "International Society of Sports Nutrition Position Stand: protein and exercise",
        authors: "Jäger R, Kerksick CM, Campbell BI, et al.",
        journal: "Journal of the International Society of Sports Nutrition",
        year: 2017,
        studyType: "Position stand / review",
        finding:
          "1.4–2.0 g/kg/day is sufficient for most exercising people; 2.3–3.1 g/kg/day may be needed to preserve lean mass during hypocaloric periods.",
        pmid: "28642676",
        url: "https://pubmed.ncbi.nlm.nih.gov/28642676/",
        source: "PubMed",
        openAccess: true,
      },
    ],
  },

  coldPlunge: {
    id: "coldPlunge",
    verdict: "debunked",
    label: "Debunked",
    score: 18,
    evidenceQuality: "Moderate",
    category: "Recovery",
    platform: "TikTok",
    claim: "Cold plunges after lifting boost muscle growth.",
    conclusion:
      "Cold-water immersion may help you feel recovered, but controlled trials show it can blunt the muscle-building signal after resistance training. It is not an anabolic tool.",
    contextLine:
      "A recovery ritual got rebranded as a growth hack. The adaptation data point the other way.",
    breakdown: [
      {
        title: "The 12-week trial found less growth, not more",
        body:
          "Twenty-one physically active men strength trained for 12 weeks, two days per week, followed by 10 minutes of cold-water immersion or active recovery. Strength and muscle mass increased more with active recovery. Type II fibre cross-sectional area rose 17%, myonuclei per fibre rose 26%, and isokinetic work rose 19% in the active-recovery group — not in the cold-water group.",
      },
      {
        title: "A second trial separated hypertrophy from strength",
        body:
          "Sixteen men trained for seven weeks, three days per week, with 15 minutes at 10°C after each session or passive recovery. One-repetition-maximum leg press improved similarly in both groups, but type II fibre hypertrophy was attenuated with cold-water immersion and anabolic signalling was blunted. The authors concluded that post-exercise cold-water immersion should be avoided if muscle hypertrophy is desired.",
      },
      {
        title: "Recovery and adaptation are different outcomes",
        body:
          "A 2021 review found that post-exercise cold-water immersion generally diminishes resistance-training adaptations, while aerobic performance may be unaffected or even enhanced. The authors propose using it around competition or intensified training, while strategically avoiding it after sessions focused on strength or hypertrophy.",
      },
      {
        title: "What it can legitimately do",
        body:
          "Cold-water immersion can reduce soreness and perceived fatigue, and some athletes find it useful during dense competition schedules. That is a recovery effect, not a muscle-building effect. If you enjoy it, keep it away from key hypertrophy sessions or use it sparingly rather than after every lift.",
      },
    ],
    remember:
      "Cold plunge is a recovery tool, not a growth tool. If hypertrophy is the goal, keep it away from your lifting sessions.",
    papers: [
      {
        id: "p-roberts-2015",
        title:
          "Post-exercise cold water immersion attenuates acute anabolic signalling and long-term adaptations in muscle to strength training",
        authors: "Roberts LA, Raastad T, Markworth JF, et al.",
        journal: "The Journal of Physiology",
        year: 2015,
        studyType: "Randomized controlled trial",
        finding:
          "In 21 men training for 12 weeks, strength and muscle mass increased more with active recovery than with 10 minutes of cold-water immersion; type II fibre cross-sectional area rose 17% and myonuclei 26% only in the active-recovery group.",
        pmid: "26174323",
        url: "https://pubmed.ncbi.nlm.nih.gov/26174323/",
        source: "PubMed",
        openAccess: true,
      },
      {
        id: "p-fyfe-2019",
        title:
          "Cold water immersion attenuates anabolic signaling and skeletal muscle fiber hypertrophy, but not strength gain, following whole-body resistance training",
        authors: "Fyfe JJ, Broatch JR, Trewin AJ, et al.",
        journal: "Journal of Applied Physiology",
        year: 2019,
        studyType: "Randomized controlled trial",
        finding:
          "In 16 men training for seven weeks, cold-water immersion attenuated type II muscle fibre hypertrophy and blunted anabolic signalling, although 1RM leg press strength improved similarly; the authors recommend avoiding post-exercise cold-water immersion when hypertrophy is desired.",
        pmid: "31513450",
        url: "https://pubmed.ncbi.nlm.nih.gov/31513450/",
        source: "PubMed",
      },
      {
        id: "p-ihsan-2021",
        title: "Adaptations to Post-exercise Cold Water Immersion: Friend, Foe, or Futile?",
        authors: "Ihsan M, Abbiss CR, Allan R",
        journal: "Frontiers in Sports and Active Living",
        year: 2021,
        studyType: "Review",
        finding:
          "Post-exercise cold-water immersion generally diminishes resistance-training adaptations while aerobic performance may be unaffected or enhanced; the authors propose avoiding it after strength or hypertrophy sessions.",
        pmid: "34337408",
        url: "https://pubmed.ncbi.nlm.nih.gov/34337408/",
        source: "PubMed",
        openAccess: true,
      },
    ],
  },
};

export const MOCK_RESULT_ORDER: MockKey[] = ["creatine", "protein", "coldPlunge"];

export const DEMO_VERDICT_ORDER: MockKey[] = ["creatine", "protein", "coldPlunge"];

/** A plausible stand-in for OCR output when someone uploads an image only. */
export const MOCK_SCREENSHOT_CLAIM = MOCK_RESULTS.protein.claim;
