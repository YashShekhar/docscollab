export interface Space {
  id: string;
  title: string;
  content: string;
  plainText?: string;
  createdAt: string;
  updatedAt: string;
  creatorName?: string;
}

export interface SpaceWithStats extends Space {
  activeCollaboratorsCount: number;
}

export interface Collaborator {
  id: string;
  name: string;
  color: string;
  joinedAt: number;
  socketId?: string;
  isTyping?: boolean;
}

export interface LocalUser {
  id: string;
  name: string;
  color: string;
}

export interface CursorPosition {
  from: number;
  to: number;
  coords?: {
    top: number;
    left: number;
  };
}

export interface CollaboratorCursor {
  userId: string;
  cursor: CursorPosition;
  name: string;
  color: string;
}

export interface CreateSpaceDto {
  title?: string;
  creatorName?: string;
  content?: string;
}

export interface UpdateSpaceContentDto {
  content: string;
  plainText?: string;
}

export interface UpdateSpaceTitleDto {
  title: string;
}

export interface SpaceDestroyedPayload {
  spaceId: string;
  destroyedBy: string;
}

export interface ContentUpdatePayload {
  content: string;
  plainText?: string;
  senderId: string;
  version: number;
  updatedAt: string;
}

export interface TitleUpdatePayload {
  title: string;
  senderId: string;
}

export interface TypingUpdatePayload {
  userId: string;
  isTyping: boolean;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  success?: boolean;
}
