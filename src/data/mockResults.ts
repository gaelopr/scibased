import type { MockKey, VerdictResult } from "../types";

/**
 * Three fully interactive sample verdicts — one for each status.
 * Every citation below is real and links directly to PubMed.
 */
export const MOCK_RESULTS: Record<MockKey, VerdictResult> = {
  iceWater: {
    id: "iceWater",
    verdict: "debunked",
    label: "Debunked",
    score: 14,
    evidenceQuality: "Moderate",
    category: "Hydration",
    platform: "TikTok",
    claim: "Drinking ice water causes gut issues and stops digestion.",
    conclusion:
      "Cold water can briefly slow stomach emptying, but there is no evidence it damages your gut or causes lasting digestive problems.",
    contextLine:
      "A small, temporary change in stomach emptying has been turned into a blanket health warning.",
    breakdown: [
      {
        title: "The famous studies tested cold stress, not your drink",
        body:
          "Several experiments placed a participant's hand in ice water to trigger cold-pain stress. That is a different physiological pathway from swallowing a cold beverage — and the measured effect lasted minutes, not days.",
      },
      {
        title: "A slower stomach is not a damaged stomach",
        body:
          "Small studies do show that cold liquids can empty from the stomach a little more slowly. But your body warms what you drink quickly, and researchers estimate any temperature effect on absorption lasts five minutes or less.",
      },
      {
        title: "“Gut issues” were never the outcome being measured",
        body:
          "The research looked at gastric emptying and motility, not bloating, inflammation, or chronic digestive disease. You cannot infer a health problem from a short delay in a lab measurement.",
      },
      {
        title: "Hydration still wins",
        body:
          "If cold water helps you drink more, that is a net positive. People with a diagnosed motility disorder or reflux should follow their clinician's individual advice — personal discomfort is not evidence of a universal effect.",
      },
    ],
    remember:
      "The temperature of your water is not a meaningful gut-health lever. How much you drink, and what else is on your plate, matters far more.",
    papers: [
      {
        id: "p-brearley-2017",
        title:
          "Should Workers Avoid Consumption of Chilled Fluids in a Hot and Humid Climate?",
        authors: "Brearley MB",
        journal: "Safety and Health at Work",
        year: 2017,
        studyType: "Review",
        finding:
          "Hydration research does not support avoiding chilled fluids. Any temperature-related effect on gastric emptying is modest and lasts about five minutes or less; cold fluids may even improve intake.",
        pmid: "29276629",
        url: "https://pubmed.ncbi.nlm.nih.gov/29276629/",
        source: "PubMed",
        openAccess: true,
      },
      {
        id: "p-fone-1990",
        title:
          "Gastroduodenal motility during the delayed gastric emptying induced by cold stress",
        authors:
          "Fone DR, Horowitz M, Maddox A, Akkermans LM, Read NW, Dent J",
        journal: "Gastroenterology",
        year: 1990,
        studyType: "Clinical physiology study",
        finding:
          "Cold-pain stress delayed gastric emptying in seven healthy volunteers. The stimulus was cold stress, not drinking cold water, and the study did not assess gut damage.",
        pmid: "2323509",
        url: "https://pubmed.ncbi.nlm.nih.gov/2323509/",
        source: "PubMed",
      },
      {
        id: "p-nakae-2000",
        title:
          "Cold pain prolongs gastric emptying of liquid but not solid meal: an electrical impedance tomography (EIT) study",
        authors:
          "Nakae Y, Kagaya M, Takagi R, Matsutani Y, Horibe H, Kondo T",
        journal: "Journal of Gastroenterology",
        year: 2000,
        studyType: "Small crossover trial",
        finding:
          "Hand immersion in 4°C water delayed emptying of a liquid meal in six healthy women; emptying of a solid meal was unaffected. Gut damage or chronic symptoms were not measured.",
        pmid: "10955597",
        url: "https://pubmed.ncbi.nlm.nih.gov/10955597/",
        source: "PubMed",
      },
    ],
  },

  magnesium: {
    id: "magnesium",
    verdict: "context",
    label: "Needs context",
    score: 47,
    evidenceQuality: "Low to moderate",
    category: "Sleep",
    platform: "Instagram",
    claim: "Magnesium supplements improve deep sleep cycles and cure insomnia.",
    conclusion:
      "Magnesium may help some older adults fall asleep a little faster, but the evidence for “deep sleep” is thin and mixed.",
    contextLine:
      "There is a real signal here — just not the sweeping one the post promises.",
    breakdown: [
      {
        title: "The best evidence is small and specific",
        body:
          "A 2021 meta-analysis pooled three randomized trials in 151 older adults with insomnia. Magnesium reduced sleep-onset latency by about 17 minutes, but the improvement in total sleep time was not statistically significant.",
      },
      {
        title: "The certainty is low",
        body:
          "Those trials had moderate-to-high risk of bias, and the meta-analysis rated the evidence low to very low quality. A 2023 systematic review found observational links but contradictory results across randomized trials.",
      },
      {
        title: "Nobody measured “deep sleep cycles”",
        body:
          "Most trials used subjective insomnia scores or sleep diaries, not EEG-verified slow-wave sleep. The claim describes a specific brain-state change that the evidence does not reliably demonstrate.",
      },
      {
        title: "Deficiency is the exception",
        body:
          "If your magnesium intake is genuinely low, correcting it can support normal sleep. For people who are already sufficient, supplements are not a proven insomnia cure — and they can interact with some medications.",
      },
    ],
    remember:
      "Food sources and consistent sleep habits come first. If you are considering magnesium for insomnia, discuss dose and interactions with a clinician — especially if you have kidney disease.",
    papers: [
      {
        id: "p-mah-2021",
        title:
          "Oral magnesium supplementation for insomnia in older adults: a Systematic Review & Meta-Analysis",
        authors: "Mah J, Pitre T",
        journal: "BMC Complementary Medicine and Therapies",
        year: 2021,
        studyType: "Systematic review & meta-analysis",
        finding:
          "Across three RCTs (151 older adults), magnesium cut sleep-onset latency by 17.4 minutes. Total sleep time improved by 16 minutes but was not statistically significant; certainty was low to very low.",
        pmid: "33865376",
        url: "https://pubmed.ncbi.nlm.nih.gov/33865376/",
        source: "PubMed",
        openAccess: true,
      },
      {
        id: "p-abbasi-2012",
        title:
          "The effect of magnesium supplementation on primary insomnia in elderly: A double-blind placebo-controlled clinical trial",
        authors:
          "Abbasi B, Kimiagar M, Sadeghniiat K, Shirazi MM, Hedayati M, Rashidkhani B",
        journal: "Journal of Research in Medical Sciences",
        year: 2012,
        studyType: "Randomized controlled trial",
        finding:
          "In 46 older adults, 500 mg of magnesium daily for eight weeks improved subjective insomnia scores, sleep efficiency, and sleep latency. Total sleep time did not differ significantly between groups.",
        pmid: "23853635",
        url: "https://pubmed.ncbi.nlm.nih.gov/23853635/",
        source: "PubMed",
        openAccess: true,
      },
      {
        id: "p-arab-2023",
        title:
          "The Role of Magnesium in Sleep Health: a Systematic Review of Available Literature",
        authors: "Arab A, Rafie N, Amani R, Shirani F",
        journal: "Biological Trace Element Research",
        year: 2023,
        studyType: "Systematic review",
        finding:
          "Observational studies linked magnesium status with sleep quality, but randomized trials showed an uncertain association. The review called for larger, longer, better-designed trials.",
        pmid: "35184264",
        url: "https://pubmed.ncbi.nlm.nih.gov/35184264/",
        source: "PubMed",
      },
    ],
  },

  creatine: {
    id: "creatine",
    verdict: "verified",
    label: "Verified",
    score: 93,
    evidenceQuality: "High",
    category: "Supplements",
    platform: "X",
    claim: "Creatine supplementation is safe for healthy kidneys.",
    conclusion:
      "In healthy adults, controlled studies find no evidence that recommended creatine doses harm kidney function.",
    contextLine:
      "The concern comes from a lab marker that can rise without any change in how well the kidneys filter.",
    breakdown: [
      {
        title: "“High creatinine” is not automatically kidney damage",
        body:
          "Creatine breaks down into creatinine, the waste product kidney tests measure. Supplementing can raise blood creatinine simply because there is more creatine to break down — even when filtration is completely normal.",
      },
      {
        title: "Direct filtration tests are reassuring",
        body:
          "A 12-week randomized trial in resistance-trained adults on high-protein diets measured glomerular filtration rate directly with 51Cr-EDTA. Kidney function stayed normal in the creatine group.",
      },
      {
        title: "Long-term use has been monitored",
        body:
          "Reviews covering controlled use for up to five years found no adverse kidney effects in healthy people. Occasional case reports are not supported by the better-controlled trial evidence.",
      },
      {
        title: "The real caveat is existing kidney disease",
        body:
          "Safety is established for healthy kidneys, not for every medical situation. If you have kidney disease, take nephrotoxic medication, or are unsure, talk to a clinician before starting.",
      },
    ],
    remember:
      "Creatine monohydrate is one of the most studied sports supplements, but “safe for healthy kidneys” is not the same as “safe for everyone.” Dose, hydration, and medical history still matter.",
    papers: [
      {
        id: "p-poortmans-2000",
        title:
          "Adverse effects of creatine supplementation: fact or fiction?",
        authors: "Poortmans JR, Francaux M",
        journal: "Sports Medicine",
        year: 2000,
        studyType: "Review",
        finding:
          "Short-, medium-, and long-term studies (up to five years) that monitored kidney function with clearance methods and urine protein excretion found no adverse renal effects in healthy individuals.",
        pmid: "10999421",
        url: "https://pubmed.ncbi.nlm.nih.gov/10999421/",
        source: "PubMed",
      },
      {
        id: "p-lugaresi-2013",
        title:
          "Does long-term creatine supplementation impair kidney function in resistance-trained individuals consuming a high-protein diet?",
        authors:
          "Lugaresi R, Leme M, de Salles Painelli V, Murai IH, Roschel H, Sapienza MT, Lancha Junior AH, Gualano B",
        journal: "Journal of the International Society of Sports Nutrition",
        year: 2013,
        studyType: "Randomized controlled trial",
        finding:
          "A 12-week double-blind RCT measured glomerular filtration rate directly. Creatine did not affect kidney function in healthy, resistance-trained adults eating a high-protein diet.",
        pmid: "23680457",
        url: "https://pubmed.ncbi.nlm.nih.gov/23680457/",
        source: "PubMed",
        openAccess: true,
      },
      {
        id: "p-longobardi-2023",
        title:
          "Is It Time for a Requiem for Creatine Supplementation-Induced Kidney Failure? A Narrative Review",
        authors: "Longobardi I, Gualano B, Seguro AC, Roschel H",
        journal: "Nutrients",
        year: 2023,
        studyType: "Narrative review",
        finding:
          "Controlled clinical trials do not support creatine-induced kidney damage. Serum creatinine may rise without kidney dysfunction; more research is still needed in people with pre-existing kidney disease.",
        pmid: "36986197",
        url: "https://pubmed.ncbi.nlm.nih.gov/36986197/",
        source: "PubMed",
        openAccess: true,
      },
    ],
  },
};

export const MOCK_RESULT_ORDER: MockKey[] = ["iceWater", "magnesium", "creatine"];

export const DEMO_VERDICT_ORDER: MockKey[] = ["creatine", "magnesium", "iceWater"];

/** A plausible stand-in for OCR output when someone uploads an image only. */
export const MOCK_SCREENSHOT_CLAIM = MOCK_RESULTS.iceWater.claim;
