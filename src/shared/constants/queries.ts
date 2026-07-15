/**
 * Shared query constants used across modules.
 *
 * MASTER_LIST_LIMIT is the page size used when loading reference/master data
 * (e.g. parties for a dropdown) in a single shot. It must stay in sync with
 * the backend's max page size cap (MAX_PAGE_SIZE in
 * `saadcargo-back/src/utils/validationPrimitives.js`).
 *
 * This must stay >= the number of active parties: anything past this limit is
 * silently cut from every dropdown that uses it (parties are sorted A→Z, so the
 * tail of the alphabet vanishes first).
 */
export const MASTER_LIST_LIMIT = 1000;
