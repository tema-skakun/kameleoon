import { AggregationMode, LineStyle, Variation } from '../../types';
import styles from './ChartControls.module.css';

type Props = {
	variations: Variation[];
	selectedKeys: string[];
	onToggleVariation: (key: string) => void;
	aggregation: AggregationMode;
	onAggregationChange: (mode: AggregationMode) => void;
	lineStyle: LineStyle;
	onLineStyleChange: (style: LineStyle) => void;
	theme: 'light' | 'dark';
	onThemeToggle: () => void;
	onZoomIn: () => void;
	onZoomOut: () => void;
	onPanLeft: () => void;
	onPanRight: () => void;
	onResetZoom: () => void;
	onExportPng: () => void;
};

export const ChartControls: React.FC<Props> = ({
																								 variations,
																								 selectedKeys,
																								 onToggleVariation,
																								 aggregation,
																								 onAggregationChange,
																								 lineStyle,
																								 onLineStyleChange,
																								 theme,
																								 onThemeToggle,
																								 onZoomIn,
																								 onZoomOut,
																								 onPanLeft,
																								 onPanRight,
																								 onResetZoom,
																								 onExportPng,
																							 }) => {
	return (
		<div className={styles.controls}>
			<div className={styles.block}>
				<div className={styles.blockTitle}>Варианты</div>
				<div className={styles.variants}>
					{variations.map((v) => {
						const checked = selectedKeys.includes(v.key);

						return (
							<label key={v.key} className={styles.checkboxLabel}>
								<input
									type="checkbox"
									checked={checked}
									onChange={() => onToggleVariation(v.key)}
									aria-checked={checked}
								/>
								<span>{v.name}</span>
							</label>
						);
					})}
				</div>
			</div>

			<div className={styles.block}>
				<div className={styles.blockTitle}>Интервал</div>
				<div className={styles.segmented} role="tablist" aria-label="Интервал данных">
					<button
						type="button"
						className={
							aggregation === 'daily'
								? `${styles.segment} ${styles.segmentActive}`
								: styles.segment
						}
						onClick={() => onAggregationChange('daily')}
						role="tab"
						aria-selected={aggregation === 'daily'}
					>
						День
					</button>
					<button
						type="button"
						className={
							aggregation === 'weekly'
								? `${styles.segment} ${styles.segmentActive}`
								: styles.segment
						}
						onClick={() => onAggregationChange('weekly')}
						role="tab"
						aria-selected={aggregation === 'weekly'}
					>
						Неделя
					</button>
				</div>
			</div>

			<div className={styles.block}>
				<div className={styles.blockTitle}>Стиль линии</div>
				<select
					className={styles.select}
					value={lineStyle}
					onChange={(e) => onLineStyleChange(e.target.value as LineStyle)}
					aria-label="Стиль линии"
				>
					<option value="line">Линия</option>
					<option value="smooth">Сглаживание</option>
					<option value="area">Область</option>
				</select>
			</div>

			<div className={styles.block}>
				<div className={styles.blockTitle}>Тема</div>
				<button
					type="button"
					className={styles.button}
					onClick={onThemeToggle}
					aria-label="Переключить тему"
					title="Переключить тему"
				>
					{theme === 'light' ? 'Светлая' : 'Тёмная'}
				</button>
			</div>

			<div className={styles.block}>
				<div className={styles.blockTitle}>Масштаб</div>
				<div className={styles.zoomRow}>
					<button
						type="button"
						className={styles.buttonSmall}
						onClick={onZoomOut}
						aria-label="Уменьшить масштаб"
						title="Уменьшить масштаб"
					>
						-
					</button>
					<button
						type="button"
						className={styles.buttonSmall}
						onClick={onZoomIn}
						aria-label="Увеличить масштаб"
						title="Увеличить масштаб"
					>
						+
					</button>
				</div>
				<div className={styles.zoomRow}>
					<button
						type="button"
						className={styles.buttonSmall}
						onClick={onPanLeft}
						aria-label="Сдвинуть окно влево"
						title="Сдвинуть окно влево"
					>
						←
					</button>
					<button
						type="button"
						className={styles.buttonSmall}
						onClick={onPanRight}
						aria-label="Сдвинуть окно вправо"
						title="Сдвинуть окно вправо"
					>
						→
					</button>
				</div>
				<button
					type="button"
					className={styles.button}
					onClick={onResetZoom}
					aria-label="Сбросить масштаб"
					title="Сбросить масштаб"
				>
					Сбросить
				</button>
			</div>

			<div className={styles.block}>
				<div className={styles.blockTitle}>Экспорт</div>
				<button
					type="button"
					className={styles.button}
					onClick={onExportPng}
					aria-label="Экспорт диаграммы в PNG"
					title="Экспорт диаграммы в PNG"
				>
					PNG
				</button>
			</div>
		</div>
	);
};
