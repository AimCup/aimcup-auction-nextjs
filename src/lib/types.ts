// GraphQL model types — mirror the API schema.

export type AuctionState = "SCHEDULED" | "RUNNING" | "PAUSED" | "FINISHED";
export type PlayerStatus = "AVAILABLE" | "SOLD" | "UNSOLD";
export type AuctionPhase =
	| "WAITING_TO_START"
	| "BIDDING"
	| "MAX_BID_WINDOW"
	| "MAX_BID_DRAW"
	| "GAP"
	| "PAUSED"
	| "FINISHED";

export interface AuctionSettings {
	startingBalance: number;
	maxBid: number;
	minIncrement: number;
	maxBidWindowSeconds: number;
	teamSizeForPercentLimit: number;
	maxBidPercent: number;
	maxDescriptionLength: number;
	maxTeamSize: number;
}

export interface AuctionStage {
	index: number;
	biddingTimeSeconds: number;
	biddingTimeAfterBidSeconds: number;
	gapTimeSeconds: number;
}

export interface Manager {
	id: string;
	osuId: number;
	username: string;
	avatarUrl: string;
	countryCode: string | null;
	discordId: string | null;
	owner: boolean;
	addedAt: string | null;
}

export interface Player {
	id: string;
	osuId: number;
	username: string;
	avatarUrl: string | null;
	bannerUrl: string | null;
	countryCode: string | null;
	globalRank: number | null;
	countryRank: number | null;
	description: string | null;
	captain: boolean;
	discordId: string | null;
	status: PlayerStatus;
	soldToCaptainId: string | null;
	soldPrice: number | null;
	qualificationRank: number | null;
	bestMapName: string | null;
	bestMapImage: string | null;
	bestMapAccuracy: number | null;
	worstMapName: string | null;
	worstMapImage: string | null;
	worstMapAccuracy: number | null;
}

export interface Captain {
	id: string;
	playerId: string;
	osuId: number;
	username: string;
	avatarUrl: string | null;
	countryCode: string | null;
	discordId: string | null;
	balance: number;
	ready: boolean;
	teamPlayerIds: string[];
}

export interface BidEvent {
	captainId: string | null;
	captainUsername: string | null;
	captainAvatarUrl: string | null;
	amount: number;
	at: string | null;
	maxBid: boolean;
	source: string | null;
}

export interface Auction {
	id: string;
	name: string;
	banner: string | null;
	creatorOsuId: number;
	state: AuctionState;
	startAt: string | null;
	createdAt: string | null;
	startedAt: string | null;
	finishedAt: string | null;
	guildId: string | null;
	channelId: string | null;
	settings: AuctionSettings;
	stages: AuctionStage[];
	managers: Manager[];
	players: Player[];
	captains: Captain[];
	currentStageIndex: number;
}

export interface LiveAuctionState {
	auctionId: string;
	state: AuctionState;
	phase: AuctionPhase;
	stageIndex: number;
	totalStages: number;
	currentPlayer: Player | null;
	highestBid: number;
	highestBidderId: string | null;
	highestBidderUsername: string | null;
	maxBidderIds: string[];
	maxBidWinnerId: string | null;
	bidHistory: BidEvent[];
	phaseEndsAtEpochMs: number;
	pausedByOrganizer: boolean;
	message: string | null;
	captains: Captain[];
	players: Player[];
	onlineOsuIds: number[];
	remainingCount: number;
	soldCount: number;
	unsoldCount: number;
	version: number;
}

export interface User {
	id: string | null;
	osuId: number;
	username: string;
	avatarUrl: string | null;
	countryCode: string | null;
	globalRank: number | null;
	countryRank: number | null;
	admin: boolean;
}

export interface ImportError {
	line: number;
	osuId: string | null;
	username: string | null;
	reason: string;
}

export interface ImportResult {
	imported: Player[];
	errors: ImportError[];
}

export interface BidResult {
	accepted: boolean;
	message: string;
	currentHighest: number;
}

export interface ReadyResult {
	ready: boolean;
	readyCount: number;
	totalCaptains: number;
}

export interface ChatEmbedField {
	name: string;
	value: string;
	inline: boolean;
}

export interface ChatEmbed {
	color: string | null;
	authorName: string | null;
	authorIcon: string | null;
	title: string | null;
	description: string | null;
	fields: ChatEmbedField[];
	thumbnail: string | null;
	image: string | null;
	footer: string | null;
	footerIcon: string | null;
	timestamp: string | null;
}

export interface ChatMessage {
	author: string;
	content: string;
	avatarUrl: string | null;
	at: string | null;
	embed: ChatEmbed | null;
}
