import { AlgorithmType, DataScenario, SortMetrics } from '../types';

// Helper to generate data
export const generateData = (size: number, scenario: DataScenario): number[] => {
  const arr = Array.from({ length: size }, (_, i) => i);
  
  if (scenario === DataScenario.Sorted) {
    return arr;
  }
  
  if (scenario === DataScenario.Reverse) {
    return arr.reverse();
  }
  
  // Fisher-Yates shuffle for Random
  for (let i = size - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// --- Algorithms ---

export const bubbleSort = (input: number[]): { sorted: number[]; metrics: SortMetrics } => {
  const arr = [...input];
  let comparisons = 0;
  let swaps = 0;
  const start = performance.now();
  const n = arr.length;

  for (let i = 0; i < n; i++) {
    let swapped = false;
    for (let j = 0; j < n - i - 1; j++) {
      comparisons++;
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swaps++;
        swapped = true;
      }
    }
    if (!swapped) break;
  }

  const end = performance.now();
  return { sorted: arr, metrics: { timeMs: end - start, comparisons, swaps } };
};

export const selectionSort = (input: number[]): { sorted: number[]; metrics: SortMetrics } => {
  const arr = [...input];
  let comparisons = 0;
  let swaps = 0;
  const start = performance.now();
  const n = arr.length;

  for (let i = 0; i < n; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      comparisons++;
      if (arr[j] < arr[minIdx]) {
        minIdx = j;
      }
    }
    if (minIdx !== i) {
      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
      swaps++;
    }
  }

  const end = performance.now();
  return { sorted: arr, metrics: { timeMs: end - start, comparisons, swaps } };
};

export const insertionSort = (input: number[]): { sorted: number[]; metrics: SortMetrics } => {
  const arr = [...input];
  let comparisons = 0;
  let swaps = 0; 
  const start = performance.now();
  const n = arr.length;

  for (let i = 1; i < n; i++) {
    const key = arr[i];
    let j = i - 1;

    while (j >= 0) {
      comparisons++;
      if (arr[j] > key) {
        arr[j + 1] = arr[j];
        swaps++; // Shift
        j--;
      } else {
        break;
      }
    }
    arr[j + 1] = key;
  }

  const end = performance.now();
  return { sorted: arr, metrics: { timeMs: end - start, comparisons, swaps } };
};

// --- Quick Sort Helpers ---

const quickSortRecursive = (
  arr: number[], 
  low: number, 
  high: number, 
  counters: { comparisons: number; swaps: number }
) => {
  if (low < high) {
    // Basic partition scheme (Lomuto)
    const pivot = arr[high];
    let i = low - 1;

    for (let j = low; j < high; j++) {
      counters.comparisons++;
      if (arr[j] < pivot) {
        i++;
        [arr[i], arr[j]] = [arr[j], arr[i]];
        counters.swaps++;
      }
    }
    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    counters.swaps++;
    const pi = i + 1;

    quickSortRecursive(arr, low, pi - 1, counters);
    quickSortRecursive(arr, pi + 1, high, counters);
  }
};

export const quickSort = (input: number[]): { sorted: number[]; metrics: SortMetrics } => {
  const arr = [...input];
  const counters = { comparisons: 0, swaps: 0 };
  const start = performance.now();
  
  try {
     quickSortRecursive(arr, 0, arr.length - 1, counters);
  } catch (e) {
    console.error("Stack overflow or recursion error", e);
  }

  const end = performance.now();
  return { sorted: arr, metrics: { timeMs: end - start, comparisons: counters.comparisons, swaps: counters.swaps } };
};

// --- Merge Sort Helpers ---

const merge = (
  left: number[], 
  right: number[], 
  counters: { comparisons: number; swaps: number }
): number[] => {
  let resultArray = [], leftIndex = 0, rightIndex = 0;

  while (leftIndex < left.length && rightIndex < right.length) {
    counters.comparisons++;
    if (left[leftIndex] < right[rightIndex]) {
      resultArray.push(left[leftIndex]);
      leftIndex++;
    } else {
      resultArray.push(right[rightIndex]);
      rightIndex++;
    }
    counters.swaps++; // Counting movements
  }

  while(leftIndex < left.length) {
    resultArray.push(left[leftIndex++]);
    counters.swaps++;
  }
  while(rightIndex < right.length) {
    resultArray.push(right[rightIndex++]);
    counters.swaps++;
  }

  return resultArray;
};

const mergeSortRecursive = (arr: number[], counters: { comparisons: number; swaps: number }): number[] => {
  if (arr.length <= 1) {
    return arr;
  }
  const middle = Math.floor(arr.length / 2);
  const left = arr.slice(0, middle);
  const right = arr.slice(middle);

  return merge(
    mergeSortRecursive(left, counters),
    mergeSortRecursive(right, counters),
    counters
  );
};

export const mergeSort = (input: number[]): { sorted: number[]; metrics: SortMetrics } => {
  const counters = { comparisons: 0, swaps: 0 };
  const start = performance.now();
  
  const sorted = mergeSortRecursive(input, counters);

  const end = performance.now();
  return { sorted, metrics: { timeMs: end - start, comparisons: counters.comparisons, swaps: counters.swaps } };
};

export const runAlgorithm = (
  algo: AlgorithmType, 
  data: number[]
): { sorted: number[]; metrics: SortMetrics } => {
  switch (algo) {
    case AlgorithmType.Bubble: return bubbleSort(data);
    case AlgorithmType.Selection: return selectionSort(data);
    case AlgorithmType.Insertion: return insertionSort(data);
    case AlgorithmType.Quick: return quickSort(data);
    case AlgorithmType.Merge: return mergeSort(data);
    default: return { sorted: data, metrics: { timeMs: 0, comparisons: 0, swaps: 0 } };
  }
};
