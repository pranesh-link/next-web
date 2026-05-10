/**
 * Public barrel for the couple-service. Re-exports the stable surface
 * of the {@link ./couple} sub-modules so existing imports of
 * `@/_services/finance/couple-service` keep working.
 */
export {
  createCouple,
  disbandCouple,
  getCoupleForUser,
  getCoupleMembers,
  leaveCouple,
  renameCouple,
} from './couple/core';
export {
  acceptInvite,
  acceptInviteByToken,
  cancelInvite,
  declineInvite,
  getInviteByToken,
  getPendingInvitesForUser,
  invitePartner,
} from './couple/invites';
export {
  getCoupleIdForUser,
  getUserIdsForCouple,
} from './couple/membership';
