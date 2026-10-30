/**
 * Satya Lens - Core API Data Types & Schema
 *
 * @typedef {'text'|'image'|'video'|'audio'|'url'} ContentType
 * @typedef {'likely_true'|'likely_false'|'uncertain'} VerdictLabel
 * @typedef {'low'|'medium'|'high'} ConfidenceLevel
 * @typedef {'good'|'warn'|'bad'|'info'} ReasonTone
 * @typedef {'checked'|'not_checked'|'no_matches_found'} SourceStatus
 *
 * @typedef {Object} Reference
 * @property {string} id - Unique identifier
 * @property {string} publisher - Organization or registry
 * @property {string} title - Title or headline of the fact-check
 * @property {string} rating - Original rating tag
 * @property {string} ratingMeaning - Plain English explanation of the rating
 * @property {string} claim - The reviewed statement
 * @property {string} url - Official external URL
 * @property {string} date - Publication date (YYYY-MM-DD)
 * @property {string} language - ISO language code ('en', 'hi', etc.)
 * @property {'google_fact_check'|'registry'|'domain_registry'|'metadata_inspection'|'style_pattern'} source
 * @property {string} retrievedAt - ISO timestamp of retrieval
 * @property {string} [verifiedOn] - Date URL was last confirmed active
 * @property {boolean} [isOld] - True if reference is older than 2 years
 *
 * @typedef {Object} Match
 * @property {'live_api'|'registry_semantic'|'registry_phrase'} matchType
 * @property {number} matchStrength - 0 to 100 percentage
 * @property {string[]} matchedPhrases - Exact matching phrases found in input
 * @property {'same_claim'|'similar_claim'} relation - Relationship to user input
 * @property {string} similarityNote - Human readable context note
 * @property {Reference} reference - Full reference object
 *
 * @typedef {Object} ConfidenceAssessment
 * @property {ConfidenceLevel} level
 * @property {number} score - 0 to 100 percentage
 * @property {string} reason - Plain English explanation of why this confidence level was assigned
 *
 * @typedef {Object} ReasonItem
 * @property {ReasonTone} tone
 * @property {string} text
 * @property {string[]} [refIds] - IDs of referenced sources for [1], [2] markers
 *
 * @typedef {Object} SourceItem
 * @property {string} publisher
 * @property {string} rating
 * @property {string} claim
 * @property {string} url
 * @property {string} date
 * @property {string} [verifiedOn]
 * @property {boolean} [isLocalRegistry]
 * @property {string} [similarityNote]
 * @property {string} [referenceId]
 * @property {boolean} [isOld]
 *
 * @typedef {Object} CheckItem
 * @property {string} name
 * @property {boolean} ran
 * @property {string} note
 *
 * @typedef {Object} InputSummary
 * @property {'text'|'file'|'url'} kind
 * @property {string} preview
 * @property {Object} meta
 *
 * @typedef {Object} Verdict
 * @property {VerdictLabel} label
 * @property {string} headline
 * @property {string} meaning
 * @property {number|null} score
 * @property {ConfidenceLevel} confidenceLevel
 *
 * @typedef {Object} Report
 * @property {ContentType} type
 * @property {InputSummary} input
 * @property {Verdict} verdict
 * @property {ConfidenceAssessment} confidence
 * @property {ReasonItem[]} reasons
 * @property {Match[]} matches
 * @property {Reference[]} references
 * @property {{ status: SourceStatus, items: SourceItem[] }} sources
 * @property {string[]} nextSteps
 * @property {CheckItem[]} checks
 * @property {Object} technical
 * @property {string[]} notices
 * @property {string} disclaimer
 *
 * // Deprecated compatibility aliases
 * @property {number|null} [truthScore]
 * @property {VerdictLabel} [label]
 * @property {string} [summary]
 * @property {string[]} [explanations]
 */

module.exports = {};
