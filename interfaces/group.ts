import type { School, User } from './user';

export type GroupMembershipStatus = 'INVITED' | 'PENDING' | 'ACTIVE' | 'REJECTED' | 'REMOVED';
export type GroupMemberRole = 'INSTRUCTOR' | 'ASSISTANT' | 'STUDENT';

export interface GroupResponse {
  id: string;
  name: string;
  description?: string;
  inviteOnly: boolean;
  schoolId?: string | null;
  instructorId: string;
  memberCount?: number;
  createdAt: string;
  updatedAt?: string;
  school?: School | null;
}

export interface GroupCreateRequest {
  name: string;
  description?: string;
  schoolId?: string;
  inviteOnly?: boolean;
}

export interface GroupUpdateRequest {
  name?: string;
  description?: string;
  schoolId?: string | null;
  inviteOnly?: boolean;
}

export interface GroupMemberAddRequest {
  userId: string;
  inviteOnly?: boolean;
  role?: GroupMemberRole;
}

export interface GroupMembershipResponse {
  id: string;
  groupId: string;
  userId: string;
  invitedById?: string | number;
  role: GroupMemberRole;
  status: GroupMembershipStatus;
  inviteOnly: boolean;
  createdAt: string;
  updatedAt?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  user?: User;
  group?: GroupResponse;
}

export type GroupsResponse = GroupResponse[];
export type GroupMembersResponse = GroupMembershipResponse[];

export interface GroupListParams {
  schoolId?: string;
  instructorId?: string;
  search?: string;
  inviteOnly?: boolean;
  includeMembers?: boolean;
}
