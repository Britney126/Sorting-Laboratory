export enum AlgorithmType {
  Bubble = '冒泡排序',
  Selection = '选择排序',
  Insertion = '插入排序',
  Quick = '快速排序',
  Merge = '归并排序',
}

export enum DataScenario {
  Random = '随机数组',
  Sorted = '有序数组',
  Reverse = '逆序数组',
}

export interface SortMetrics {
  timeMs: number;
  comparisons: number;
  swaps: number;
}

export interface BenchmarkResult {
  id: string;
  algorithm: AlgorithmType;
  size: number;
  scenario: DataScenario;
  metrics: SortMetrics;
}

export type SortFunction = (arr: number[]) => { sorted: number[]; metrics: SortMetrics };