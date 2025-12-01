export type Variation = {
	id?: number;
	key: string; // "0", "10001"...
	name: string;
};

export type RawDataPoint = {
	date: string; // "2025-01-01"
	visits: Record<string, number>;
	conversions: Record<string, number>;
};

export type RawPayload = {
	variations: Array<{ id?: number; name: string }>;
	data: RawDataPoint[];
};

export type AggregationMode = 'daily' | 'weekly';
export type LineStyle = 'line' | 'smooth' | 'area';

export type ParsedDataPoint = {
	date: string;
	dateObj: Date;
	visits: Record<string, number>;
	conversions: Record<string, number>;
	conversionRate: Record<string, number | null>;
};

export type ChartPoint = {
	date: string;
	dateLabel: string;
	index: number; // для Brush
	values: Record<string, number | null>; // key = variationKey
};
