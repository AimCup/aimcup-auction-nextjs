import { gql } from "@apollo/client";

export const PLAYER_FIELDS = gql`
	fragment PlayerFields on Player {
		id
		osuId
		username
		avatarUrl
		bannerUrl
		countryCode
		globalRank
		countryRank
		description
		captain
		discordId
		status
		soldToCaptainId
		soldPrice
		qualificationRank
		bestMapName
		bestMapImage
		bestMapAccuracy
		worstMapName
		worstMapImage
		worstMapAccuracy
	}
`;

export const CAPTAIN_FIELDS = gql`
	fragment CaptainFields on Captain {
		id
		playerId
		osuId
		username
		avatarUrl
		countryCode
		discordId
		balance
		ready
		teamPlayerIds
	}
`;

export const AUCTION_FIELDS = gql`
	${PLAYER_FIELDS}
	${CAPTAIN_FIELDS}
	fragment AuctionFields on Auction {
		id
		name
		banner
		creatorOsuId
		state
		startAt
		createdAt
		startedAt
		finishedAt
		guildId
		channelId
		currentStageIndex
		settings {
			startingBalance
			maxBid
			minIncrement
			maxBidWindowSeconds
			teamSizeForPercentLimit
			maxBidPercent
			maxDescriptionLength
			maxTeamSize
		}
		stages {
			index
			biddingTimeSeconds
			biddingTimeAfterBidSeconds
			gapTimeSeconds
		}
		managers {
			id
			osuId
			username
			avatarUrl
			countryCode
			discordId
			owner
			addedAt
		}
		players {
			...PlayerFields
		}
		captains {
			...CaptainFields
		}
	}
`;

export const LIVE_FIELDS = gql`
	${PLAYER_FIELDS}
	${CAPTAIN_FIELDS}
	fragment LiveFields on LiveAuctionState {
		auctionId
		state
		phase
		stageIndex
		totalStages
		highestBid
		highestBidderId
		highestBidderUsername
		maxBidderIds
		maxBidWinnerId
		phaseEndsAtEpochMs
		pausedByOrganizer
		message
		onlineOsuIds
		remainingCount
		soldCount
		unsoldCount
		version
		currentPlayer {
			...PlayerFields
		}
		bidHistory {
			captainId
			captainUsername
			captainAvatarUrl
			amount
			at
			maxBid
			source
		}
		captains {
			...CaptainFields
		}
		players {
			...PlayerFields
		}
	}
`;

// ---- Queries -------------------------------------------------------------------------------

export const ME = gql`
	query Me {
		me {
			id
			osuId
			username
			avatarUrl
			countryCode
			globalRank
			countryRank
			admin
		}
	}
`;

export const GET_AUCTION = gql`
	${AUCTION_FIELDS}
	query GetAuction($id: ID!) {
		auction(id: $id) {
			...AuctionFields
		}
	}
`;

export const MY_AUCTIONS = gql`
	query MyAuctions {
		myAuctions {
			id
			name
			state
			startAt
			banner
			players {
				id
			}
			captains {
				id
			}
		}
	}
`;

export const RECENT_AUCTIONS = gql`
	query RecentAuctions($limit: Int) {
		recentAuctions(limit: $limit) {
			id
			name
			state
			startAt
			banner
		}
	}
`;

export const LIVE_STATE = gql`
	${LIVE_FIELDS}
	query LiveState($auctionId: ID!) {
		liveState(auctionId: $auctionId) {
			...LiveFields
		}
	}
`;

export const LIVE_AUCTION_SUB = gql`
	${LIVE_FIELDS}
	subscription LiveAuction($auctionId: ID!) {
		liveAuction(auctionId: $auctionId) {
			...LiveFields
		}
	}
`;

export const AUCTION_CHAT_SUB = gql`
	subscription AuctionChat($auctionId: ID!) {
		auctionChat(auctionId: $auctionId) {
			author
			content
			avatarUrl
			at
			embed {
				color
				authorName
				authorIcon
				title
				description
				fields {
					name
					value
					inline
				}
				thumbnail
				image
				footer
				footerIcon
				timestamp
			}
		}
	}
`;

// ---- Mutations -----------------------------------------------------------------------------

export const CREATE_AUCTION = gql`
	mutation CreateAuction($input: CreateAuctionInput!) {
		createAuction(input: $input) {
			id
			name
		}
	}
`;

export const UPDATE_SETTINGS = gql`
	${AUCTION_FIELDS}
	mutation UpdateSettings($auctionId: ID!, $input: AuctionSettingsInput!) {
		updateAuctionSettings(auctionId: $auctionId, input: $input) {
			...AuctionFields
		}
	}
`;

export const UPDATE_STAGES = gql`
	${AUCTION_FIELDS}
	mutation UpdateStages($auctionId: ID!, $stages: [StageInput!]!) {
		updateAuctionStages(auctionId: $auctionId, stages: $stages) {
			...AuctionFields
		}
	}
`;

export const UPDATE_META = gql`
	${AUCTION_FIELDS}
	mutation UpdateMeta($auctionId: ID!, $input: UpdateMetaInput!) {
		updateAuctionMeta(auctionId: $auctionId, input: $input) {
			...AuctionFields
		}
	}
`;

export const DELETE_AUCTION = gql`
	mutation DeleteAuction($auctionId: ID!) {
		deleteAuction(auctionId: $auctionId)
	}
`;

export const ADD_MANAGER = gql`
	mutation AddManager($auctionId: ID!, $input: AddManagerInput!) {
		addManager(auctionId: $auctionId, input: $input) {
			id
			username
		}
	}
`;

export const REMOVE_MANAGER = gql`
	mutation RemoveManager($auctionId: ID!, $managerId: ID!) {
		removeManager(auctionId: $auctionId, managerId: $managerId)
	}
`;

export const ADD_PLAYER = gql`
	${PLAYER_FIELDS}
	mutation AddPlayer($auctionId: ID!, $input: AddPlayerInput!) {
		addPlayer(auctionId: $auctionId, input: $input) {
			...PlayerFields
		}
	}
`;

export const IMPORT_PLAYERS = gql`
	mutation ImportPlayers($auctionId: ID!, $csv: String!) {
		importPlayers(auctionId: $auctionId, csv: $csv) {
			imported {
				id
				username
			}
			errors {
				line
				osuId
				username
				reason
			}
		}
	}
`;

export const REMOVE_PLAYER = gql`
	mutation RemovePlayer($auctionId: ID!, $playerId: ID!) {
		removePlayer(auctionId: $auctionId, playerId: $playerId)
	}
`;

export const SET_CAPTAIN = gql`
	${PLAYER_FIELDS}
	mutation SetCaptain($auctionId: ID!, $input: FlagCaptainInput!) {
		setCaptain(auctionId: $auctionId, input: $input) {
			...PlayerFields
		}
	}
`;

export const UNSET_CAPTAIN = gql`
	${PLAYER_FIELDS}
	mutation UnsetCaptain($auctionId: ID!, $playerId: ID!) {
		unsetCaptain(auctionId: $auctionId, playerId: $playerId) {
			...PlayerFields
		}
	}
`;

export const START_AUCTION = gql`
	mutation StartAuction($auctionId: ID!) {
		startAuction(auctionId: $auctionId)
	}
`;

export const PAUSE_AUCTION = gql`
	mutation PauseAuction($auctionId: ID!) {
		pauseAuction(auctionId: $auctionId)
	}
`;

export const RESUME_AUCTION = gql`
	mutation ResumeAuction($auctionId: ID!) {
		resumeAuction(auctionId: $auctionId)
	}
`;

export const REMOVE_FROM_TEAM = gql`
	mutation RemoveFromTeam($auctionId: ID!, $playerId: ID!) {
		removePlayerFromTeam(auctionId: $auctionId, playerId: $playerId)
	}
`;

export const CHANGE_BALANCE = gql`
	mutation ChangeBalance($auctionId: ID!, $input: ChangeBalanceInput!) {
		changeCaptainBalance(auctionId: $auctionId, input: $input)
	}
`;

export const PLACE_BID = gql`
	mutation PlaceBid($auctionId: ID!, $amount: Int!) {
		placeBid(auctionId: $auctionId, amount: $amount) {
			accepted
			message
			currentHighest
		}
	}
`;

export const PLACE_MAX_BID = gql`
	mutation PlaceMaxBid($auctionId: ID!) {
		placeMaxBid(auctionId: $auctionId) {
			accepted
			message
			currentHighest
		}
	}
`;

export const SET_CAPTAIN_READY = gql`
	mutation SetCaptainReady($auctionId: ID!, $ready: Boolean!) {
		setCaptainReady(auctionId: $auctionId, ready: $ready) {
			ready
			readyCount
			totalCaptains
		}
	}
`;
