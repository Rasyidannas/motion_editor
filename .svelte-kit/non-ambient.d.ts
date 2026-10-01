
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	type MatcherParam<M> = M extends (param : string) => param is (infer U extends string) ? U : string;

	export interface AppTypes {
		RouteId(): "/" | "/api" | "/api/ai" | "/api/ai/chat" | "/api/animejs" | "/api/elements" | "/api/elements/[id]" | "/canvas" | "/canvas/[frameId]" | "/dashboard";
		RouteParams(): {
			"/api/elements/[id]": { id: string };
			"/canvas/[frameId]": { frameId: string }
		};
		LayoutParams(): {
			"/": { id?: string | undefined; frameId?: string | undefined };
			"/api": { id?: string | undefined };
			"/api/ai": Record<string, never>;
			"/api/ai/chat": Record<string, never>;
			"/api/animejs": Record<string, never>;
			"/api/elements": { id?: string | undefined };
			"/api/elements/[id]": { id: string };
			"/canvas": { frameId?: string | undefined };
			"/canvas/[frameId]": { frameId: string };
			"/dashboard": Record<string, never>
		};
		Pathname(): "/" | "/api/ai/chat" | "/api/animejs" | "/api/elements" | `/api/elements/${string}` & {} | `/canvas/${string}` & {} | "/dashboard";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/animejs.esm.min.js" | "/animejs.umd.min.js" | "/robots.txt" | string & {};
	}
}