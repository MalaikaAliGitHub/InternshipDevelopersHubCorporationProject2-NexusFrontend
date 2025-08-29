export type UserRole = 'entrepreneur' | 'investor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  bio: string;
  isOnline?: boolean;
  createdAt: string;
}

export interface Entrepreneur extends User {
  role: 'entrepreneur';
  startupName: string;
  pitchSummary: string;
  fundingNeeded: string;
  industry: string;
  location: string;
  foundedYear: number;
  teamSize: number;
}

export interface Investor extends User {
  role: 'investor';
  investmentInterests: string[];
  investmentStage: string[];
  portfolioCompanies: string[];
  totalInvestments: number;
  minimumInvestment: string;
  maximumInvestment: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface ChatConversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  updatedAt: string;
}

export interface CollaborationRequest {
  id: string;
  investorId: string;
  entrepreneurId: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  lastModified: string;
  shared: boolean;
  url: string;
  ownerId: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<any>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<any>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Calendar / Meetings
export interface AvailabilitySlot {
  start: string; // 'HH:mm'
  end: string;   // 'HH:mm'
}

export interface AvailabilityDay {
  date: string; // 'YYYY-MM-DD'
  slots: AvailabilitySlot[];
}

export interface Meeting {
  _id: string;
  title: string;
  start: string; // ISO
  end: string;   // ISO
  participants: Array<{ id?: string; _id?: string; email?: string; role?: UserRole; profile?: { name?: string } }>;
  createdBy: string;
  status: 'scheduled' | 'cancelled' | 'completed';
  videoLink?: string;
}