"use client";

import {
	ApolloClient,
	HttpLink,
	InMemoryCache,
	split,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { getMainDefinition } from "@apollo/client/utilities";
import { createClient } from "graphql-ws";
import { getToken } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
const HTTP_URL = `${API_URL}/graphql`;
const WS_URL = HTTP_URL.replace(/^http/, "ws");

export function makeApolloClient(): ApolloClient<unknown> {
	const httpLink = new HttpLink({ uri: HTTP_URL });

	const authLink = setContext((_, { headers }) => {
		const token = getToken();
		return {
			headers: {
				...headers,
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
		};
	});

	const httpWithAuth = authLink.concat(httpLink);

	// WebSocket link (browser only) for subscriptions; the JWT travels in connectionParams.
	const wsLink =
		typeof window !== "undefined"
			? new GraphQLWsLink(
					createClient({
						url: WS_URL,
						lazy: true,
						retryAttempts: Infinity,
						connectionParams: () => {
							const token = getToken();
							return token ? { Authorization: `Bearer ${token}` } : {};
						},
					}),
				)
			: null;

	const link = wsLink
		? split(
				({ query }) => {
					const def = getMainDefinition(query);
					return (
						def.kind === "OperationDefinition" &&
						def.operation === "subscription"
					);
				},
				wsLink,
				httpWithAuth,
			)
		: httpWithAuth;

	return new ApolloClient({
		link,
		cache: new InMemoryCache(),
		defaultOptions: {
			watchQuery: { fetchPolicy: "cache-and-network" },
		},
	});
}
