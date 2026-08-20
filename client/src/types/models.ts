export enum RoundingMode {
  NEAREST_INTEGER = 'NEAREST_INTEGER',
  ROUND_UP = 'ROUND_UP',
  ROUND_DOWN = 'ROUND_DOWN',
  DECIMAL_2 = 'DECIMAL_2',
}

export enum SplitType {
  EQUAL = 'EQUAL',
  WEIGHTED = 'WEIGHTED',
  EXACT_AMOUNT = 'EXACT_AMOUNT',
}

export enum FeeType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
}

export enum FeeAllocationMethod {
  PROPORTIONAL_SUBTOTAL = 'PROPORTIONAL_SUBTOTAL',
  EQUAL_MEMBERS = 'EQUAL_MEMBERS',
  SELECTED_MEMBERS = 'SELECTED_MEMBERS',
}

export interface Member {
  id: string;
  name: string;
  avatarColor: string;
  isHost?: boolean;
}

export interface SplitShare {
  memberId: string;
  splitType?: SplitType;
  value?: number;
}

export interface Item {
  id: string;
  name: string;
  price: number;
  paidByMemberId: string;
  splits?: SplitShare[];
}

export interface ExtraFee {
  id: string;
  name: string;
  feeType: FeeType;
  rate?: number;
  amount?: number;
  allocationMethod?: FeeAllocationMethod;
  targetMemberIds?: string[];
}

export interface PaymentInfo {
  bankCode?: string;
  bankAccount?: string;
  linePayUrl?: string;
  jkoPayUrl?: string;
  customQrUrl?: string;
  note?: string;
}

export interface Room {
  id: string;
  title: string;
  code: string;
  isLocked?: boolean;
  currency?: string;
  roundingMode?: RoundingMode;
  members: Member[];
  items: Item[];
  extraFees?: ExtraFee[];
  paymentInfo?: PaymentInfo;
  createdAt?: number;
  updatedAt?: number;
}

export interface TransferRoute {
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  adjustmentNote?: string;
}

export interface ItemShareDetail {
  itemId: string;
  itemName: string;
  itemPrice: number;
  shareAmount: number;
}

export interface FeeShareDetail {
  feeId: string;
  feeName: string;
  shareAmount: number;
}

export interface MemberFinancialSummary {
  memberId: string;
  subtotal: number;
  feesAndDiscounts: number;
  totalToPay: number;
  totalPaid: number;
  netBalance: number;
  itemBreakdown?: ItemShareDetail[];
  feeBreakdown?: FeeShareDetail[];
  roundingDifference?: number;
  adjustmentNote?: string;
}

export interface SettlementResult {
  roomId: string;
  totalItemAmount: number;
  totalFeeAmount: number;
  grandTotal: number;
  memberSummaries: Record<string, MemberFinancialSummary>;
  transfers: TransferRoute[];
  isBalanced: boolean;
  roundingRemainder?: number;
}

export interface CreateRoomRequest {
  title?: string;
  hostName?: string;
  currency?: string;
  roundingMode?: RoundingMode;
  members?: Member[];
  items?: Item[];
  extraFees?: ExtraFee[];
  paymentInfo?: PaymentInfo;
}

export interface LockRoomRequest {
  isLocked?: boolean;
}

export interface ErrorResponse {
  error: string;
  code?: string;
}

export type WsClientMessage =
  | { type: 'JOIN_ROOM'; memberId: string; memberName?: string }
  | { type: 'TOGGLE_ITEM_CHECK'; itemId: string; memberId: string; isChecked: boolean }
  | { type: 'UPDATE_ROOM'; room: Room }
  | { type: 'LOCK_SETTLEMENT'; isLocked?: boolean }
  | { type: 'REQUEST_SYNC'; dummy?: string };

export type WsServerMessage =
  | { type: 'SYNC_STATE'; room: Room; activeMemberIds: string[] }
  | { type: 'MEMBER_JOINED'; memberId: string; memberName?: string; activeMemberIds: string[] }
  | { type: 'ITEM_CHECK_TOGGLED'; itemId: string; memberId: string; isChecked: boolean; room: Room }
  | { type: 'SETTLEMENT_LOCKED'; isLocked: boolean; room: Room }
  | { type: 'ERROR'; message: string; code?: string };

export type WsMessage = WsClientMessage | WsServerMessage;

