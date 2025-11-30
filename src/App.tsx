import React, { useMemo, useRef, useState } from 'react';
import raw from './data/data.json';
import {
	AggregationMode,
	LineStyle,
	ParsedDataPoint,
	RawPayload,
	Variation,
} from './types';
import {
	buildChartData,
	buildVariations,
	parseRawData,
} from './utils/transformData';
import { ChartControls } from './components/ChartControls/ChartControls';
import { ConversionChart } from './components/ConversionChart/ConversionChart';
import styles from './App.module.css';
import html2canvas from 'html2canvas';

const typedRaw = raw as RawPayload;

const App: React.FC = () => {
	const [aggregation, setAggregation] = useState<AggregationMode>('daily');
	const [lineStyle, setLineStyle] = useState<LineStyle>('line');
	const [theme, setTheme] = useState<'light' | 'dark'>('light');

	const variations: Variation[] = useMemo(
		() => buildVariations(typedRaw.variations),
		[],
	);

	const parsed: ParsedDataPoint[] = useMemo(
		() => parseRawData(typedRaw.data, variations),
		[variations],
	);

	const [selectedKeys, setSelectedKeys] = useState<string[]>(() =>
		variations.map((v) => v.key),
	);

	const allChartData = useMemo(
		() => buildChartData(parsed, variations, aggregation),
		[parsed, variations, aggregation],
	);

	const [brushRange, setBrushRange] = useState<{
		startIndex: number;
		endIndex: number;
	}>({
		startIndex: 0,
		endIndex: allChartData.length - 1,
	});

	// при смене агрегации – сброс зума
	React.useEffect(() => {
		setBrushRange({
			startIndex: 0,
			endIndex: allChartData.length - 1,
		});
	}, [aggregation, allChartData.length]);

	const handleToggleVariation = (key: string) => {
		setSelectedKeys((prev) => {
			const isSelected = prev.includes(key);
			if (isSelected) {
				// не даём снять последний вариант
				if (prev.length === 1) return prev;
				return prev.filter((k) => k !== key);
			}
			return [...prev, key];
		});
	};

	const chartRef = useRef<HTMLDivElement | null>(null);

	const handleExportPng = async () => {
		if (!chartRef.current) return;
		const canvas = await html2canvas(chartRef.current);
		const link = document.createElement('a');
		link.href = canvas.toDataURL('image/png');
		link.download = 'ab-test-conversion-chart.png';
		link.click();
	};

	const handleResetZoom = () => {
		setBrushRange({
			startIndex: 0,
			endIndex: allChartData.length - 1,
		});
	};

	const handleZoom = (direction: 'in' | 'out') => {
		const total = allChartData.length;
		if (total === 0) return;

		const MIN_POINTS = 5;
		const STEP = 4;

		setBrushRange((prev) => {
			let start = prev.startIndex;
			let end = prev.endIndex;

			if (start < 0 || end >= total || start >= end) {
				return {
					startIndex: 0,
					endIndex: total - 1,
				};
			}

			const length = end - start + 1;

			if (direction === 'in') {
				if (length <= MIN_POINTS) {
					return prev;
				}

				const newLength = Math.max(MIN_POINTS, length - STEP);
				const center = (start + end) / 2;

				let newStart = Math.round(center - (newLength - 1) / 2);
				let newEnd = newStart + newLength - 1;

				if (newStart < 0) {
					newStart = 0;
					newEnd = newLength - 1;
				}

				if (newEnd > total - 1) {
					newEnd = total - 1;
					newStart = total - newLength;
				}

				return {
					startIndex: newStart,
					endIndex: newEnd,
				};
			}

			if (length >= total) {
				return prev;
			}

			const newLength = Math.min(total, length + STEP);
			const center = (start + end) / 2;

			let newStart = Math.round(center - (newLength - 1) / 2);
			let newEnd = newStart + newLength - 1;

			if (newStart < 0) {
				newStart = 0;
				newEnd = newLength - 1;
			}

			if (newEnd > total - 1) {
				newEnd = total - 1;
				newStart = total - newLength;
			}

			return {
				startIndex: newStart,
				endIndex: newEnd,
			};
		});
	};

	const handlePan = (direction: 'left' | 'right') => {
		const total = allChartData.length;
		if (total === 0) return;

		setBrushRange((prev) => {
			let start = prev.startIndex;
			let end = prev.endIndex;

			if (start < 0 || end >= total || start >= end) {
				return {
					startIndex: 0,
					endIndex: total - 1,
				};
			}

			const length = end - start + 1;

			if (length >= total) {
				return prev;
			}

			const step = Math.max(1, Math.floor(length / 3));

			if (direction === 'left') {
				const newStart = Math.max(0, start - step);
				const newEnd = newStart + length - 1;

				return {
					startIndex: newStart,
					endIndex: Math.min(total - 1, newEnd),
				};
			}

			const newEnd = Math.min(total - 1, end + step);
			const newStart = newEnd - length + 1;

			return {
				startIndex: Math.max(0, newStart),
				endIndex: newEnd,
			};
		});
	};

	const handleZoomIn = () => handleZoom('in');
	const handleZoomOut = () => handleZoom('out');
	const handlePanLeft = () => handlePan('left');
	const handlePanRight = () => handlePan('right');

	const rootClassName =
		theme === 'light'
			? `${styles.appRoot}`
			: `${styles.appRoot} ${styles.appDark}`;

	return (
		<div className={rootClassName}>
			<div className={styles.appInner}>
				<header className={styles.header}>
					<h1 className={styles.title}>Conversion Rate A/B Testing</h1>
					<p className={styles.subtitle}>
						Интерактивная линейная диаграмма коэффициента конверсии по
						вариантам.
					</p>
				</header>

				<ChartControls
					variations={variations}
					selectedKeys={selectedKeys}
					onToggleVariation={handleToggleVariation}
					aggregation={aggregation}
					onAggregationChange={setAggregation}
					lineStyle={lineStyle}
					onLineStyleChange={setLineStyle}
					theme={theme}
					onThemeToggle={() =>
						setTheme((t) => (t === 'light' ? 'dark' : 'light'))
					}
					onZoomIn={handleZoomIn}
					onZoomOut={handleZoomOut}
					onPanLeft={handlePanLeft}
					onPanRight={handlePanRight}
					onResetZoom={handleResetZoom}
					onExportPng={handleExportPng}
				/>

				<div ref={chartRef}>
					<ConversionChart
						data={allChartData}
						rawParsed={parsed}
						variations={variations}
						selectedKeys={selectedKeys}
						lineStyle={lineStyle}
						aggregation={aggregation}
						brushRange={brushRange}
						theme={theme}
					/>
				</div>
			</div>
		</div>
	);
};

export default App;
