import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  GroupCreateRequest,
  GroupListParams,
  GroupMemberAddRequest,
  GroupMembershipResponse,
  GroupResponse,
  GroupUpdateRequest,
} from '@/interfaces/group';
import { SuccessResponse } from '@/interfaces/user';
import {
  acceptGroupMembership,
  addGroupMember,
  createGroup,
  deleteGroup,
  getGroupById,
  getGroupMembers,
  getGroups,
  getUserGroups,
  removeGroupMember,
  updateGroup,
} from '@/services/apiClient';
import { useCurrentUser } from './useUserProfile';

const GROUPS_BASE_KEY = ['groups'] as const;

export const GROUPS_QUERY_KEY = (params?: GroupListParams) =>
  (params ? (['groups', params] as const) : GROUPS_BASE_KEY);
export const GROUP_QUERY_KEY = (groupId: string) => ['groups', groupId] as const;
export const GROUP_MEMBERS_QUERY_KEY = (groupId: string) =>
  ['groups', groupId, 'members'] as const;
export const GROUPS_BY_USER_QUERY_KEY = (userId: string | number) =>
  ['groups', 'users', String(userId)] as const;

const useCanManageGroups = () => {
  const { data: currentUser } = useCurrentUser();
  return currentUser?.accountType === 'instructor';
};

const instructorOnlyError = new Error('Solo instructores pueden administrar grupos.');

interface UpdateGroupVariables {
  groupId: string;
  payload: GroupUpdateRequest;
}

interface DeleteGroupVariables {
  groupId: string;
}

interface AddMemberVariables {
  groupId: string;
  payload: GroupMemberAddRequest;
}

interface AcceptMembershipVariables {
  groupId: string;
  membershipId: string;
}

interface RemoveMemberVariables {
  groupId: string;
  userId: string;
}

interface UseGroupsOptions {
  enabled?: boolean;
}

export const useGroups = (params?: GroupListParams, options?: UseGroupsOptions) =>
  useQuery<GroupResponse[]>({
    queryKey: GROUPS_QUERY_KEY(params),
    queryFn: () => getGroups(params),
    enabled: options?.enabled ?? true,
  });

export const useGroup = (groupId?: string) =>
  useQuery<GroupResponse>({
    queryKey: groupId ? GROUP_QUERY_KEY(groupId) : ['groups', 'detail'],
    queryFn: () => getGroupById(groupId as string),
    enabled: Boolean(groupId),
  });

export const useGroupMembers = (groupId?: string) =>
  useQuery<GroupMembershipResponse[]>({
    queryKey: groupId ? GROUP_MEMBERS_QUERY_KEY(groupId) : ['groups', 'members', 'detail'],
    queryFn: () => getGroupMembers(groupId as string),
    enabled: Boolean(groupId),
  });

export const useGroupsByUser = (userId?: string | number, options?: UseGroupsOptions) =>
  useQuery<GroupResponse[]>({
    queryKey: userId ? GROUPS_BY_USER_QUERY_KEY(userId) : ['groups', 'users', 'detail'],
    queryFn: () => getUserGroups(userId as string | number),
    enabled: Boolean(userId) && (options?.enabled ?? true),
  });

export const useCreateGroup = () => {
  const queryClient = useQueryClient();
  const canManageGroups = useCanManageGroups();

  return useMutation<GroupResponse, unknown, GroupCreateRequest>({
    mutationFn: (payload) => {
      if (!canManageGroups) {
        return Promise.reject(instructorOnlyError);
      }
      return createGroup(payload);
    },
    onSuccess: (group) => {
      queryClient.invalidateQueries({ queryKey: GROUPS_BASE_KEY });
      queryClient.setQueryData(GROUP_QUERY_KEY(group.id), group);
    },
  });
};

export const useUpdateGroup = () => {
  const queryClient = useQueryClient();
  const canManageGroups = useCanManageGroups();

  return useMutation<GroupResponse, unknown, UpdateGroupVariables>({
    mutationFn: ({ groupId, payload }) => {
      if (!canManageGroups) {
        return Promise.reject(instructorOnlyError);
      }
      return updateGroup(groupId, payload);
    },
    onSuccess: (group) => {
      queryClient.invalidateQueries({ queryKey: GROUPS_BASE_KEY });
      queryClient.setQueryData(GROUP_QUERY_KEY(group.id), group);
    },
  });
};

export const useDeleteGroup = () => {
  const queryClient = useQueryClient();
  const canManageGroups = useCanManageGroups();

  return useMutation<SuccessResponse, unknown, DeleteGroupVariables>({
    mutationFn: ({ groupId }) => {
      if (!canManageGroups) {
        return Promise.reject(instructorOnlyError);
      }
      return deleteGroup(groupId);
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: GROUPS_BASE_KEY });
      queryClient.removeQueries({ queryKey: GROUP_QUERY_KEY(groupId) });
      queryClient.removeQueries({ queryKey: GROUP_MEMBERS_QUERY_KEY(groupId) });
    },
  });
};

export const useAddGroupMember = () => {
  const queryClient = useQueryClient();
  const canManageGroups = useCanManageGroups();

  return useMutation<GroupMembershipResponse, unknown, AddMemberVariables>({
    mutationFn: ({ groupId, payload }) => {
      if (!canManageGroups) {
        return Promise.reject(instructorOnlyError);
      }
      return addGroupMember(groupId, payload);
    },
    onSuccess: (membership) => {
      queryClient.invalidateQueries({
        queryKey: GROUP_MEMBERS_QUERY_KEY(membership.groupId),
      });
      queryClient.invalidateQueries({ queryKey: GROUPS_BASE_KEY });
      queryClient.invalidateQueries({ queryKey: GROUP_QUERY_KEY(membership.groupId) });
    },
  });
};

export const useAcceptGroupMembership = () => {
  const queryClient = useQueryClient();

  return useMutation<GroupMembershipResponse, unknown, AcceptMembershipVariables>({
    mutationFn: ({ groupId, membershipId }) => acceptGroupMembership(groupId, membershipId),
    onSuccess: (membership) => {
      queryClient.invalidateQueries({
        queryKey: GROUP_MEMBERS_QUERY_KEY(membership.groupId),
      });
      queryClient.invalidateQueries({ queryKey: GROUPS_BASE_KEY });
      queryClient.invalidateQueries({ queryKey: GROUP_QUERY_KEY(membership.groupId) });
    },
  });
};

export const useRemoveGroupMember = () => {
  const queryClient = useQueryClient();
  const canManageGroups = useCanManageGroups();
  const { data: currentUser } = useCurrentUser();

  return useMutation<SuccessResponse, unknown, RemoveMemberVariables>({
    mutationFn: ({ groupId, userId }) => {
      const normalizedUserId = String(userId);
      const currentUserId = currentUser?.id;
      const isSelfRemoval = currentUserId === normalizedUserId;

      if (!canManageGroups && !isSelfRemoval) {
        return Promise.reject(instructorOnlyError);
      }

      return removeGroupMember(groupId, normalizedUserId);
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: GROUP_MEMBERS_QUERY_KEY(groupId) });
      queryClient.invalidateQueries({ queryKey: GROUPS_BASE_KEY });
      queryClient.invalidateQueries({ queryKey: GROUP_QUERY_KEY(groupId) });
    },
  });
};
