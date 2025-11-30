import { useCallback, useEffect, useState } from 'react';

export type BrushRange = {
	startIndex: number;
	endIndex: number;
};

type DirectionZoom = 'in' | 'out';
type DirectionPan = 'left' | 'right';

type Options = {
	minPoints?: number;
	step?: number;
};

export const useBrush = (
	totalPoints: number,
	options: Options = {},
) => {
	const { minPoints = 5, step = 4 } = options;

	const [brushRange, setBrushRange] = useState<BrushRange>(() => ({
		startIndex: 0,
		endIndex: totalPoints > 0 ? totalPoints - 1 : 0,
	}));

	// При изменении количества точек сбрасываем окно на весь диапазон
	useEffect(() => {
		setBrushRange({
			startIndex: 0,
			endIndex: totalPoints > 0 ? totalPoints - 1 : 0,
		});
	}, [totalPoints]);

	const reset = useCallback(() => {
		setBrushRange({
			startIndex: 0,
			endIndex: totalPoints > 0 ? totalPoints - 1 : 0,
		});
	}, [totalPoints]);

	const zoom = useCallback(
		(direction: DirectionZoom) => {
			const total = totalPoints;
			if (total === 0) return;

			setBrushRange((prev) => {
				let start = prev.startIndex;
				let end = prev.endIndex;

				if (start < 0 || end >= total || start >= end) {
					return { startIndex: 0, endIndex: total - 1 };
				}

				const length = end - start + 1;

				if (direction === 'in') {
					if (length <= minPoints) {
						return prev;
					}

					const newLength = Math.max(minPoints, length - step);
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

					return { startIndex: newStart, endIndex: newEnd };
				}

				// zoom out
				if (length >= total) {
					return prev;
				}

				const newLength = Math.min(total, length + step);
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

				return { startIndex: newStart, endIndex: newEnd };
			});
		},
		[minPoints, step, totalPoints],
	);

	const pan = useCallback(
		(direction: DirectionPan) => {
			const total = totalPoints;
			if (total === 0) return;

			setBrushRange((prev) => {
				let start = prev.startIndex;
				let end = prev.endIndex;

				if (start < 0 || end >= total || start >= end) {
					return { startIndex: 0, endIndex: total - 1 };
				}

				const length = end - start + 1;

				if (length >= total) {
					return prev;
				}

				const panStep = Math.max(1, Math.floor(length / 3));

				if (direction === 'left') {
					const newStart = Math.max(0, start - panStep);
					const newEnd = newStart + length - 1;

					return {
						startIndex: newStart,
						endIndex: Math.min(total - 1, newEnd),
					};
				}

				const newEnd = Math.min(total - 1, end + panStep);
				const newStart = newEnd - length + 1;

				return {
					startIndex: Math.max(0, newStart),
					endIndex: newEnd,
				};
			});
		},
		[totalPoints],
	);

	const zoomIn = useCallback(() => zoom('in'), [zoom]);
	const zoomOut = useCallback(() => zoom('out'), [zoom]);
	const panLeft = useCallback(() => pan('left'), [pan]);
	const panRight = useCallback(() => pan('right'), [pan]);

	return {
		brushRange,
		reset,
		zoomIn,
		zoomOut,
		panLeft,
		panRight,
	};
};
