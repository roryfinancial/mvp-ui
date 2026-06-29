export type Place = { x: number; y: number; w: number; h: number };
export type Cell = { sx: number; sy: number; sw: number; sh: number };
export type Frame = { name: string; cell: Cell; place: Place; ms: number };
export type Channel = { name: string; sheet: string; frames: Frame[]; transitions: unknown[] };
export type Manifest = { version: number; canvas: number; tier: number; hero: Frame; channels: Channel[] };
