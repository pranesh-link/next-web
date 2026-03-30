'use server';

import { requireAuthForAction } from '@/_lib/auth-utils';
import { coupleSchema, inviteSchema } from '@/_lib/validations/finance';
import {
  createCouple as createCoupleService,
  getCoupleForUser,
  invitePartner,
  acceptInvite as acceptInviteService,
  acceptInviteByToken as acceptInviteByTokenService,
  getInviteByToken as getInviteByTokenService,
  cancelInvite as cancelInviteService,
  leaveCouple as leaveCoupleService,
  renameCouple as renameCoupleService,
  disbandCouple as disbandCoupleService,
  getPendingInvitesForUser as getPendingInvitesService,
  declineInvite as declineInviteService,
} from '@/_services/finance/couple-service';
import { invalidateCoupleMembers } from '@/_lib/cache';

export async function getCouple() {
  const user = await requireAuthForAction();
  if (!user) return { success: false as const, error: 'Not authenticated' };

  try {
    const couple = await getCoupleForUser(user.id);
    return { success: true as const, data: couple };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to get couple';
    return { success: false as const, error: message };
  }
}

export async function createNewCouple(raw: unknown) {
  const user = await requireAuthForAction();
  if (!user) return { success: false as const, error: 'Not authenticated' };

  try {
    const validated = coupleSchema.parse(raw);
    const couple = await createCoupleService(user.id, validated.name);
    invalidateCoupleMembers();
    return { success: true as const, data: couple };
  } catch (e: unknown) {
    if (e !== null && typeof e === 'object' && 'issues' in e)
      return { success: false as const, error: JSON.stringify((e as { issues: unknown }).issues) };
    const message = e instanceof Error ? e.message : 'Failed to create couple';
    return { success: false as const, error: message };
  }
}

export async function sendInvite(raw: unknown) {
  const user = await requireAuthForAction();
  if (!user) return { success: false as const, error: 'Not authenticated' };

  try {
    const validated = inviteSchema.parse(raw);
    const couple = await getCoupleForUser(user.id);
    if (!couple) return { success: false as const, error: 'Create a couple first' };

    const invite = await invitePartner(couple.id, validated.email, user.id);
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3737';
    const inviteLink = `${baseUrl}/finance/invite/${invite.token}`;
    return {
      success: true as const,
      data: invite,
      inviteLink,
    };
  } catch (e: unknown) {
    if (e !== null && typeof e === 'object' && 'issues' in e)
      return { success: false as const, error: JSON.stringify((e as { issues: unknown }).issues) };
    const message = e instanceof Error ? e.message : 'Failed to send invite';
    return { success: false as const, error: message };
  }
}

export async function acceptInvite(inviteId: string) {
  const user = await requireAuthForAction();
  if (!user) return { success: false as const, error: 'Not authenticated' };

  try {
    const member = await acceptInviteService(inviteId, user.id);
    invalidateCoupleMembers();
    return { success: true as const, data: member };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to accept invite';
    return { success: false as const, error: message };
  }
}

export async function revokeInvite(inviteId: string) {
  const user = await requireAuthForAction();
  if (!user) return { success: false as const, error: 'Not authenticated' };

  try {
    await cancelInviteService(inviteId, user.id);
    return { success: true as const, data: null };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to cancel invite';
    return { success: false as const, error: message };
  }
}

export async function leaveExistingCouple() {
  const user = await requireAuthForAction();
  if (!user) return { success: false as const, error: 'Not authenticated' };

  try {
    await leaveCoupleService(user.id);
    invalidateCoupleMembers();
    return { success: true as const, data: null };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to leave couple';
    return { success: false as const, error: message };
  }
}

export async function acceptInviteByToken(token: string) {
  const user = await requireAuthForAction();
  if (!user) return { success: false as const, error: 'Not authenticated' };

  try {
    const member = await acceptInviteByTokenService(token, user.id);
    invalidateCoupleMembers();
    return { success: true as const, data: member };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to accept invite';
    return { success: false as const, error: message };
  }
}

export async function getInviteByToken(token: string) {
  try {
    const invite = await getInviteByTokenService(token);
    if (!invite) return { success: false as const, error: 'Invite not found' };
    return { success: true as const, data: invite };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to get invite';
    return { success: false as const, error: message };
  }
}

export async function renameCoupleAction(newName: string) {
  const user = await requireAuthForAction();
  if (!user) return { success: false as const, error: 'Not authenticated' };

  try {
    const validated = coupleSchema.parse({ name: newName });
    await renameCoupleService(user.id, validated.name || '');
    return { success: true as const, data: null };
  } catch (e: unknown) {
    if (e !== null && typeof e === 'object' && 'issues' in e)
      return { success: false as const, error: JSON.stringify((e as { issues: unknown }).issues) };
    const message = e instanceof Error ? e.message : 'Failed to rename couple';
    return { success: false as const, error: message };
  }
}

export async function disbandCoupleAction() {
  const user = await requireAuthForAction();
  if (!user) return { success: false as const, error: 'Not authenticated' };

  try {
    await disbandCoupleService(user.id);
    invalidateCoupleMembers();
    return { success: true as const, data: null };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to disband couple';
    return { success: false as const, error: message };
  }
}

export async function getMyPendingInvites() {
  const user = await requireAuthForAction();
  if (!user) return { success: false as const, error: 'Not authenticated' };

  try {
    const invites = await getPendingInvitesService(user.email!);
    return { success: true as const, data: invites };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to get invites';
    return { success: false as const, error: message };
  }
}

export async function declineInviteAction(inviteId: string) {
  const user = await requireAuthForAction();
  if (!user) return { success: false as const, error: 'Not authenticated' };

  try {
    await declineInviteService(inviteId, user.email!);
    return { success: true as const, data: null };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to decline invite';
    return { success: false as const, error: message };
  }
}
