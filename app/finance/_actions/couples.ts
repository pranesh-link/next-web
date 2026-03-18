'use server';

import { requireAuthForAction } from '@/_lib/auth-utils';
import { coupleSchema, inviteSchema } from '@/_lib/validations/finance';
import {
  createCouple as createCoupleService,
  getCoupleForUser,
  invitePartner,
  acceptInvite as acceptInviteService,
  leaveCouple as leaveCoupleService,
} from '@/_services/finance/couple-service';

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
    return { success: true as const, data: invite };
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
    return { success: true as const, data: member };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to accept invite';
    return { success: false as const, error: message };
  }
}

export async function leaveExistingCouple() {
  const user = await requireAuthForAction();
  if (!user) return { success: false as const, error: 'Not authenticated' };

  try {
    await leaveCoupleService(user.id);
    return { success: true as const, data: null };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to leave couple';
    return { success: false as const, error: message };
  }
}
