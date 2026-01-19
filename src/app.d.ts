import type { UserSession } from '$lib/types';

declare global {
	namespace App {
		interface Locals {
			user?: UserSession;
		}
	}
}

export {};
