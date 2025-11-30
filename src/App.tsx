import React, { useMemo, useRef, useState } from 'react';
import raw from './data/data.json';
import {
	AggregationMode,
	LineStyle,
	ParsedDataPoint,
	RawPayload,
	Variation,
} from './types';
import { buildChartData, buildVariations, parseRawData } from './utils/transformData';
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
		[]
	);

	const parsed: ParsedDataPoint[] = useMemo(
		() => parseRawData(typedRaw.data, variations),
		[variations]
	);

	const [selectedKeys, setSelectedKeys] = useState<string[]>(
		() => variations.map((v) => v.key) // по умолчанию все включены
	);

	const allChartData = useMemo(
		() => buildChartData(parsed, variations, aggregation),
		[parsed, variations, aggregation]
	);

	const [brushRange, setBrushRange] = useState<{ startIndex: number; endIndex: number }>({
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
					onThemeToggle={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
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
						onBrushChange={setBrushRange}
					/>
				</div>
			</div>
		</div>
	);
};

export default App;
