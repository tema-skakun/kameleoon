import {FC, useMemo} from 'react';
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
	Legend,
} from 'recharts';
import type { TooltipProps } from 'recharts';
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';
import {
	AggregationMode,
	ChartPoint,
	LineStyle,
	ParsedDataPoint,
	Variation,
} from '../../types';
import styles from './ConversionChart.module.css';
import { IconCalendar, IconTrophy } from '../../icons';

type Props = {
	data: ChartPoint[];
	sourceParsed: ParsedDataPoint[]; // источник, из которого строилась диаграмма
	variations: Variation[];
	selectedKeys: string[];
	lineStyle: LineStyle;
	aggregation: AggregationMode;
	brushRange: { startIndex: number; endIndex: number };
	theme: 'light' | 'dark';
};

const colors = ['#3772ff', '#f97316', '#10b981', '#ec4899', '#a855f7'];

const getColorForKey = (key: string, variations: Variation[]): string => {
	const index = variations.findIndex((v) => v.key === key);
	const normalizedIndex = index >= 0 ? index : 0;
	return colors[normalizedIndex % colors.length];
};

const formatTooltipDate = (dateStr: string): string => {
	// ожидаем формат YYYY-MM-DD
	const [year, month, day] = dateStr.split('-');
	if (!year || !month || !day) return dateStr;
	return `${day}/${month}/${year}`;
};

const formatTooltipRange = (rangeStr: string): string => {
	// ожидаем формат "YYYY-MM-DD – YYYY-MM-DD"
	const [from, to] = rangeStr.split(' – ');
	if (!from || !to) return rangeStr;
	return `${formatTooltipDate(from)} – ${formatTooltipDate(to)}`;
};

type CustomTooltipProps = TooltipProps<ValueType, NameType> & {
	selectedKeys: string[];
	variations: Variation[];
	aggregation: AggregationMode;
	sourceParsed: ParsedDataPoint[];
};

const CustomTooltip: FC<CustomTooltipProps> = ({
																								 active,
																								 payload,
																								 selectedKeys,
																								 variations,
																								 aggregation,
																								 sourceParsed,
																							 }) => {
	if (!active || !payload || payload.length === 0) return null;

	const first = payload[0];
	const point = first?.payload as ChartPoint | undefined;
	const index = point?.index ?? 0;
	const raw = sourceParsed[index];

	if (!raw || !point) return null;

	// список серий, отсортированный по CR по убыванию
	const rows = selectedKeys
		.reduce<{ key: string; name: string; value: number }[]>((acc, key) => {
			const variation = variations.find((v) => v.key === key);
			const value = point.values[key];

			if (!variation || value == null) {
				return acc;
			}

			acc.push({
				key,
				name: variation.name,
				value,
			});

			return acc;
		}, [])
		.sort((a, b) => b.value - a.value);

	if (rows.length === 0) return null;

	const headerText =
		aggregation === 'daily'
			? formatTooltipDate(raw.date)
			: formatTooltipRange(raw.date);

	return (
		<div className={styles.tooltip}>
			<div className={styles.tooltipHeader}>
        <span className={styles.tooltipHeaderIcon}>
          <IconCalendar />
        </span>
				<span>{headerText}</span>
			</div>

			<div className={styles.tooltipBody}>
				{rows.map((row, idx) => {
					const color = getColorForKey(row.key, variations);
					const isTop = idx === 0;

					return (
						<div key={row.key} className={styles.tooltipRow}>
							<div className={styles.tooltipRowMain}>
                <span
									className={styles.tooltipDot}
									style={{ background: color }}
								/>
								<span className={styles.tooltipName}>{row.name}</span>
								{isTop && (
									<span className={styles.tooltipTrophy}>
                    <IconTrophy />
                  </span>
								)}
							</div>

							<span className={styles.tooltipValue}>
                {row.value.toFixed(2)}%
              </span>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export const ConversionChart: React.FC<Props> = ({
																									 data,
																									 sourceParsed,
																									 variations,
																									 selectedKeys,
																									 lineStyle,
																									 aggregation,
																									 brushRange,
																									 theme,
																								 }) => {
	const visibleData = useMemo(
		() => data.slice(brushRange.startIndex, brushRange.endIndex + 1),
		[data, brushRange],
	);

	// Пересчёт домена Y под выбранные варианты и видимый диапазон
	const yDomain = useMemo<[number, number]>(() => {
		let min = Infinity;
		let max = -Infinity;

		visibleData.forEach((point) => {
			selectedKeys.forEach((key) => {
				const value = point.values[key];
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

	const renderLines = () =>
		selectedKeys.map((key) => {
			const variation = variations.find((v) => v.key === key);
			if (!variation) return null;

			const color = getColorForKey(key, variations);

			if (lineStyle === 'area') {
				return (
					<Area
						key={key}
						type="monotone"
						dataKey={(point: ChartPoint) => point.values[key]}
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
					dataKey={(point: ChartPoint) => point.values[key]}
					name={variation.name}
					stroke={color}
					strokeWidth={2}
					dot={false}
					isAnimationActive={false}
				/>
			);
		});

	const ChartComponent = lineStyle === 'area' ? AreaChart : LineChart;

	const textColor = theme === 'light' ? '#0f172a' : '#e5e7eb';
	const gridColor = theme === 'light' ? '#e5e7eb' : '#1f2937';

	return (
		<div className={styles.wrapper}>
			<ResponsiveContainer width="100%" height={360}>
				<ChartComponent
					data={visibleData}
					margin={{ top: 20, right: 24, bottom: 40, left: 8 }}
				>
					<CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
					<XAxis
						dataKey="dateLabel"
						tickMargin={8}
						minTickGap={24}
						tick={{ fill: textColor, fontSize: 12 }}
					/>
					<YAxis
						domain={yDomain}
						tickFormatter={(v: number) => `${v.toFixed(0)}%`}
						tickMargin={8}
						tick={{ fill: textColor, fontSize: 12 }}
					/>
					<Tooltip
						content={
							<CustomTooltip
								selectedKeys={selectedKeys}
								variations={variations}
								aggregation={aggregation}
								sourceParsed={sourceParsed}
							/>
						}
						cursor={{ strokeWidth: 1 }}
					/>
					<Legend wrapperStyle={{ color: textColor, fontSize: 12 }} />
					{renderLines()}
				</ChartComponent>
			</ResponsiveContainer>
		</div>
	);
};
