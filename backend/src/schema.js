/**
 * @typedef {'text'|'image'|'video'|'audio'|'url'} ContentType
 * @typedef {'likely_true'|'likely_false'|'uncertain'} VerdictLabel
 * @typedef {'low'|'medium'|'high'} ConfidenceLevel
 * @typedef {'good'|'warn'|'bad'|'info'} ReasonTone
 * @typedef {'checked'|'not_checked'|'no_matches_found'} SourceStatus
 *
 * @typedef {Object} ReasonItem
 * @property {ReasonTone} tone
 * @property {string} text
 *
 * @typedef {Object} SourceItem
 * @property {string} publisher
 * @property {string} rating
 * @property {string} claim
 * @property {string} url
 * @property {string} date
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
 * @property {ReasonItem[]} reasons
 * @property {{ status: SourceStatus, items: SourceItem[] }} sources
 * @property {string[]} nextSteps
 * @property {CheckItem[]} checks
 * @property {Object} technical
 * @property {string[]} notices
 * @property {string} disclaimer
 *
 * // Deprecated compatibility aliases
 * @property {number|null} [truthScore]
 * @property {number} [confidence]
 * @property {VerdictLabel} [label]
 * @property {string} [summary]
 * @property {string[]} [explanations]
 */

module.exports = {};

