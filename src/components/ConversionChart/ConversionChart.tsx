import React, { useMemo } from 'react';
import {
	Area,
	AreaChart,
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
	Brush,
	Legend,
} from 'recharts';
import { AggregationMode, ChartPoint, LineStyle, ParsedDataPoint, Variation } from '../../types';
import styles from './ConversionChart.module.css';

type Props = {
	data: ChartPoint[];
	rawParsed: ParsedDataPoint[];
	variations: Variation[];
	selectedKeys: string[];
	lineStyle: LineStyle;
	aggregation: AggregationMode;
	brushRange: { startIndex: number; endIndex: number };
	onBrushChange: (range: { startIndex: number; endIndex: number }) => void;
};

const colors = ['#3772ff', '#f97316', '#10b981', '#ec4899', '#a855f7'];

type TooltipPayload = {
	dataKey: string;
	value: number;
	color: string;
	name: string;
};

const CustomTooltip: React.FC<{
	active?: boolean;
	label?: string;
	payload?: TooltipPayload[];
	selectedKeys: string[];
	variations: Variation[];
	aggregation: AggregationMode;
	rawParsed: ParsedDataPoint[];
}> = ({ active, label, payload, selectedKeys, variations, aggregation, rawParsed }) => {
	if (!active || !payload || payload.length === 0) return null;

	const first = payload[0] as any;
	const index = first?.payload?.index ?? 0;

	const raw = rawParsed[index];

	return (
		<div className={styles.tooltip}>
			<div className={styles.tooltipHeader}>
				{aggregation === 'daily' ? `Дата: ${raw?.date}` : `Период: ${raw?.date}`}
			</div>
			<div className={styles.tooltipBody}>
				{selectedKeys.map((key) => {
					const variation = variations.find((v) => v.key === key);
					const item = payload.find((p) => p.dataKey === key);
					if (!variation || !item || item.value == null) return null;

					const visits = raw?.visits?.[key] ?? 0;
					const conv = raw?.conversions?.[key] ?? 0;

					return (
						<div key={key} className={styles.tooltipRow}>
							<div className={styles.tooltipColor} style={{ background: item.color }} />
							<div className={styles.tooltipName}>{variation.name}</div>
							<div className={styles.tooltipMetrics}>
								<span>CR: {item.value.toFixed(2)}%</span>
								<span>Посещения: {visits}</span>
								<span>Конверсии: {conv}</span>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export const ConversionChart: React.FC<Props> = ({
																									 data,
																									 rawParsed,
																									 variations,
																									 selectedKeys,
																									 lineStyle,
																									 aggregation,
																									 brushRange,
																									 onBrushChange,
																								 }) => {
	const visibleData = useMemo(
		() => data.slice(brushRange.startIndex, brushRange.endIndex + 1),
		[data, brushRange]
	);

	// Пересчёт домена Y под выбранные варианты и видимый диапазон
	const yDomain = useMemo<[number, number]>(() => {
		let min = Infinity;
		let max = -Infinity;

		visibleData.forEach((point) => {
			selectedKeys.forEach((key) => {
				const value = point[key];
				if (typeof value === 'number') {
					if (value < min) min = value;
					if (value > max) max = value;
				}
			});
		});

		if (min === Infinity || max === -Infinity) {
			return [0, 1];
		}

		const padding = (max - min) * 0.1 || 1;
		return [Math.max(0, min - padding), max + padding];
	}, [visibleData, selectedKeys]);

	const renderLines = () => {
		return selectedKeys.map((key, index) => {
			const variation = variations.find((v) => v.key === key);
			if (!variation) return null;
			const color = colors[index % colors.length];

			if (lineStyle === 'area') {
				return (
					<Area
						key={key}
						type="monotone"
						dataKey={key}
						name={variation.name}
						stroke={color}
						fill={color}
						fillOpacity={0.15}
						dot={false}
						isAnimationActive={false}
					/>
				);
			}

			return (
				<Line
					key={key}
					type={lineStyle === 'smooth' ? 'monotone' : 'linear'}
					dataKey={key}
					name={variation.name}
					stroke={color}
					strokeWidth={2}
					dot={false}
					isAnimationActive={false}
				/>
			);
		});
	};

	const ChartComponent = lineStyle === 'area' ? AreaChart : LineChart;

	return (
		<div className={styles.wrapper}>
			<ResponsiveContainer width="100%" height={360}>
				<ChartComponent data={visibleData} margin={{ top: 20, right: 24, bottom: 40, left: 8 }}>
					<CartesianGrid strokeDasharray="3 3" vertical={false} />
					<XAxis
						dataKey="dateLabel"
						tickMargin={8}
						minTickGap={24}
					/>
					<YAxis
						domain={yDomain}
						tickFormatter={(v: number) => `${v.toFixed(0)}%`}
						tickMargin={8}
					/>
					<Tooltip
						content={
							<CustomTooltip
								selectedKeys={selectedKeys}
								variations={variations}
								aggregation={aggregation}
								rawParsed={rawParsed}
							/>
						}
						cursor={{ strokeWidth: 1 }} // вертикальная линия
					/>
					<Legend />
					{renderLines()}
					<Brush
						dataKey="dateLabel"
						startIndex={brushRange.startIndex}
						endIndex={brushRange.endIndex}
						height={24}
						stroke="#8884d8"
						onChange={(range) => {
							if (
								range &&
								typeof range.startIndex === 'number' &&
								typeof range.endIndex === 'number'
							) {
								onBrushChange({
									startIndex: range.startIndex,
									endIndex: range.endIndex,
								});
							}
						}}
					/>
				</ChartComponent>
			</ResponsiveContainer>
		</div>
	);
};
