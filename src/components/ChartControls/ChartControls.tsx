import React from 'react';
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
								/>
								<span>{v.name}</span>
							</label>
						);
					})}
				</div>
			</div>

			<div className={styles.block}>
				<div className={styles.blockTitle}>Интервал</div>
				<div className={styles.segmented}>
					<button
						type="button"
						className={
							aggregation === 'daily'
								? `${styles.segment} ${styles.segmentActive}`
								: styles.segment
						}
						onClick={() => onAggregationChange('daily')}
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
				>
					<option value="line">Линия</option>
					<option value="smooth">Сглаживание</option>
					<option value="area">Область</option>
				</select>
			</div>

			<div className={styles.block}>
				<div className={styles.blockTitle}>Тема</div>
				<button type="button" className={styles.button} onClick={onThemeToggle}>
					{theme === 'light' ? 'Светлая' : 'Тёмная'}
				</button>
			</div>

			<div className={styles.block}>
				<div className={styles.blockTitle}>Масштаб</div>
				<button type="button" className={styles.button} onClick={onResetZoom}>
					Сбросить
				</button>
			</div>

			<div className={styles.block}>
				<div className={styles.blockTitle}>Экспорт</div>
				<button type="button" className={styles.button} onClick={onExportPng}>
					PNG
				</button>
			</div>
		</div>
	);
};
