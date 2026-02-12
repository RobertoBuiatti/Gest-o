import { AsyncLocalStorage } from "async_hooks";

export interface RequestContext {
	system: string;
}

export const contextStorage = new AsyncLocalStorage<RequestContext>();

export function getSystemContext(): string {
	const context = contextStorage.getStore();
	return context?.system || "restaurante";
}
