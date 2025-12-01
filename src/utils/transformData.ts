import { AggregationMode, ChartPoint, ParsedDataPoint, RawDataPoint, Variation } from '../types';

export const formatDateLabel = (date: Date): string =>
	`${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1)
		.toString()
		.padStart(2, '0')}`;

const getVariationKeys = (variations: Variation[]): string[] =>
	variations.map((v) => v.key);

export const buildVariations = (
	rawVariations: Array<{ id?: number; name: string }>,
): Variation[] => {
	// В данных Original хранится под ключом "0"
	return rawVariations.map((v, index) => ({
		...v,
		key: v.id !== undefined ? String(v.id) : '0',
		// На всякий случай имя для "без id"
		name: v.name || (index === 0 ? 'Original' : `Variation ${index}`),
	}));
};

export const parseRawData = (
	rawData: RawDataPoint[],
	variations: Variation[],
): ParsedDataPoint[] => {
	const keys = getVariationKeys(variations);

	return rawData.map((row) => {
		const dateObj = new Date(row.date);
		const conversionRate: Record<string, number | null> = {};

		keys.forEach((key) => {
			const visits = row.visits[key];
			const conv = row.conversions[key];

			if (!visits || visits === 0 || conv === undefined) {
				conversionRate[key] = null;
			} else {
				conversionRate[key] = (conv / visits) * 100;
			}
		});

		return {
			date: row.date,
			dateObj,
			visits: row.visits,
			conversions: row.conversions,
			conversionRate,
		};
	});
};

type WeeklyBucket = {
	items: ParsedDataPoint[];
};

/**
 * Агрегация по неделям: простые "коробки" по 7 последовательных дней.
 */
export const aggregateWeekly = (
	parsed: ParsedDataPoint[],
	variations: Variation[],
): ParsedDataPoint[] => {
	const keys = getVariationKeys(variations);
	const buckets: WeeklyBucket[] = [];

	parsed.forEach((item, index) => {
		const bucketIndex = Math.floor(index / 7);
		if (!buckets[bucketIndex]) {
			buckets[bucketIndex] = { items: [] };
		}
		buckets[bucketIndex].items.push(item);
	});

	return buckets.map((bucket) => {
		const first = bucket.items[0];
		const last = bucket.items[bucket.items.length - 1];

		const visitsSum: Record<string, number> = {};
		const convSum: Record<string, number> = {};
		const conversionRate: Record<string, number | null> = {};

		keys.forEach((key) => {
			visitsSum[key] = 0;
			convSum[key] = 0;
		});

		bucket.items.forEach((item) => {
			keys.forEach((key) => {
				const v = item.visits[key] ?? 0;
				const c = item.conversions[key] ?? 0;
				visitsSum[key] += v;
				convSum[key] += c;
			});
		});

		keys.forEach((key) => {
			if (!visitsSum[key]) {
				conversionRate[key] = null;
			} else {
				conversionRate[key] = (convSum[key] / visitsSum[key]) * 100;
			}
		});

		return {
			date: `${first.date} – ${last.date}`,
			dateObj: first.dateObj,
			visits: visitsSum,
			conversions: convSum,
			conversionRate,
		};
	});
};

export const buildChartData = (
	source: ParsedDataPoint[],
	variations: Variation[],
	aggregation: AggregationMode,
): ChartPoint[] => {
	const keys = getVariationKeys(variations);

	return source.map((item, index) => {
		const values: Record<string, number | null> = {};

		keys.forEach((key) => {
			values[key] = item.conversionRate[key];
		});

		return {
			date: item.date,
			dateLabel:
				aggregation === 'daily'
					? formatDateLabel(item.dateObj)
					: `${formatDateLabel(item.dateObj)}…`,
			index,
			values,
		};
	});
};
