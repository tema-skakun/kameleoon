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
	aggregateWeekly,
	buildChartData,
	buildVariations,
	parseRawData,
} from './utils/transformData';
import { ChartControls } from './components/ChartControls/ChartControls';
import { ConversionChart } from './components/ConversionChart/ConversionChart';
import styles from './App.module.css';
import html2canvas from 'html2canvas';
import { useBrush } from './hooks/useBrush';

const typedRaw = raw as RawPayload;
const variations: Variation[] = buildVariations(typedRaw.variations);
const parsed: ParsedDataPoint[] = parseRawData(typedRaw.data, variations);

const App: React.FC = () => {
	const [aggregation, setAggregation] = useState<AggregationMode>('daily');
	const [lineStyle, setLineStyle] = useState<LineStyle>('line');
	const [theme, setTheme] = useState<'light' | 'dark'>('light');

	const sourceParsed = useMemo<ParsedDataPoint[]>(
		() => (aggregation === 'daily' ? parsed : aggregateWeekly(parsed, variations)),
		[aggregation],
	);

	const allChartData = useMemo(
		() => buildChartData(sourceParsed, variations, aggregation),
		[sourceParsed, aggregation],
	);

	const totalPoints = allChartData.length;

	const {
		brushRange,
		reset: handleResetZoom,
		zoomIn: handleZoomIn,
		zoomOut: handleZoomOut,
		panLeft: handlePanLeft,
		panRight: handlePanRight,
	} = useBrush(totalPoints);

	const [selectedKeys, setSelectedKeys] = useState<string[]>(
		() => variations.map((v) => v.key),
	);

	const chartRef = useRef<HTMLDivElement | null>(null);

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

	const handleExportPng = async () => {
		if (!chartRef.current) return;

		const canvas = await html2canvas(chartRef.current);
		const link = document.createElement('a');

		link.href = canvas.toDataURL('image/png');
		link.download = 'ab-test-conversion-chart.png';
		link.click();
	};

	const rootClassName =
		theme === 'light'
			? styles.appRoot
			: `${styles.appRoot} ${styles.appDark}`;

	return (
		<div className={rootClassName}>
			<div className={styles.appInner}>
				<header className={styles.header}>
					<h1 className={styles.title}>Conversion Rate A/B Testing</h1>
					<p className={styles.subtitle}>
						Интерактивная линейная диаграмма коэффициента конверсии по вариантам.
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
						sourceParsed={sourceParsed}
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
