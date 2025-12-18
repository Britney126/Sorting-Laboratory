import React, { useState, useEffect } from 'react';
import { 
  AlgorithmType, 
  DataScenario, 
  BenchmarkResult 
} from './types';
import { generateData, runAlgorithm } from './services/sorting';
import { PerformanceCharts } from './components/Charts';
import { analyzeBenchmarkResults, generatePythonCode } from './services/qwen';

// --- Constants & Helpers ---
const AVAILABLE_SIZES = [100, 1000, 10000, 100000];
const SLOW_ALGOS = [AlgorithmType.Bubble, AlgorithmType.Selection, AlgorithmType.Insertion];

// A helper to detect if a combination is too slow for the browser
const isDangerousCombination = (algo: AlgorithmType, size: number) => {
  return SLOW_ALGOS.includes(algo) && size >= 20000;
};

const App: React.FC = () => {
  // --- State ---
  const [selectedAlgos, setSelectedAlgos] = useState<Set<AlgorithmType>>(
    new Set([AlgorithmType.Bubble, AlgorithmType.Quick, AlgorithmType.Merge])
  );
  const [selectedSizes, setSelectedSizes] = useState<Set<number>>(
    new Set([100, 1000])
  );
  const [selectedScenarios, setSelectedScenarios] = useState<Set<DataScenario>>(
    new Set([DataScenario.Random])
  );

  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState('');

  const [activeTab, setActiveTab] = useState<'dashboard' | 'table' | 'analysis' | 'code'>('dashboard');
  
  // Analysis State
  const [analysisText, setAnalysisText] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Code Gen State
  const [selectedCodeAlgo, setSelectedCodeAlgo] = useState<AlgorithmType>(AlgorithmType.Bubble);
  const [pythonCode, setPythonCode] = useState<string>('# 请选择算法并点击“生成代码”以查看 Python 实现。');
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  // --- Handlers ---
  
  // Fix: Explicitly typing the toggleSelection to avoid inference issues with enums
  const toggleSelection = <T,>(set: Set<T>, item: T, updateFn: (s: Set<T>) => void) => {
    const newSet = new Set(set);
    if (newSet.has(item)) newSet.delete(item);
    else newSet.add(item);
    updateFn(newSet);
  };

  const runExperiments = async () => {
    setResults([]);
    setIsRunning(true);
    setAnalysisText('');
    
    const tasks: { algo: AlgorithmType; size: number; scenario: DataScenario }[] = [];
    
    selectedSizes.forEach(size => {
      selectedScenarios.forEach(scenario => {
        selectedAlgos.forEach(algo => {
          if (!isDangerousCombination(algo, size)) {
            tasks.push({ algo, size, scenario });
          }
        });
      });
    });

    if (tasks.length === 0) {
      alert("没有有效的实验任务，请检查你的选择。");
      setIsRunning(false);
      return;
    }

    let completed = 0;
    const newResults: BenchmarkResult[] = [];

    for (const task of tasks) {
      setProgress(`正在运行: ${task.algo}, 规模: ${task.size} (${task.scenario})...`);
      
      await new Promise(resolve => setTimeout(resolve, 50));

      const data = generateData(task.size, task.scenario);
      const result = runAlgorithm(task.algo, data);

      newResults.push({
        id: crypto.randomUUID(),
        algorithm: task.algo,
        size: task.size,
        scenario: task.scenario,
        metrics: result.metrics,
      });

      completed++;
    }

    setResults(newResults);
    setProgress(`已完成 ${completed} 项实验。`);
    setIsRunning(false);
  };

  const handleAnalyze = async () => {
    if (results.length === 0) return;
    setIsAnalyzing(true);
    const text = await analyzeBenchmarkResults(results);
    setAnalysisText(text || '');
    setIsAnalyzing(false);
  };

  const handleGenerateCode = async () => {
    setIsGeneratingCode(true);
    const code = await generatePythonCode(selectedCodeAlgo);
    setPythonCode(code || '');
    setIsGeneratingCode(false);
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold">
              SL
            </div>
            <h1 className="text-xl font-bold text-slate-800">排序实验室</h1>
          </div>
          <div className="text-sm text-slate-500 hidden sm:block">
            算法实验与性能分析平台
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sidebar Configuration */}
        <aside className="lg:col-span-3 space-y-6">
          
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              配置参数
            </h2>
            
            {/* Algorithms */}
            <div className="mb-6">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">选择算法</label>
              <div className="space-y-2">
                {/* Fix: Directly cast Object.values results to enum array for proper type inference in map */}
                {(Object.values(AlgorithmType) as AlgorithmType[]).map((algo) => {
                  return (
                    <label key={algo} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedAlgos.has(algo) ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`}>
                        {selectedAlgos.has(algo) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={selectedAlgos.has(algo)} 
                        onChange={() => toggleSelection<AlgorithmType>(selectedAlgos, algo, setSelectedAlgos)} 
                      />
                      <span className="text-sm text-slate-700 group-hover:text-slate-900">{algo}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Data Size */}
            <div className="mb-6">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">数据规模 (N)</label>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_SIZES.map(size => (
                  <button
                    key={size}
                    onClick={() => toggleSelection<number>(selectedSizes, size, setSelectedSizes)}
                    className={`px-3 py-2 text-sm rounded-md border transition-all ${
                      selectedSizes.has(size) 
                        ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {size.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Scenarios */}
            <div className="mb-6">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">数据场景</label>
              <div className="space-y-2">
                {/* Fix: Directly cast Object.values results to enum array for proper type inference in map */}
                {(Object.values(DataScenario) as DataScenario[]).map((sc) => {
                  return (
                    <label key={sc} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${selectedScenarios.has(sc) ? 'border-blue-600' : 'border-slate-300'}`}>
                        {selectedScenarios.has(sc) && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                      </div>
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={selectedScenarios.has(sc)}
                        onChange={() => toggleSelection<DataScenario>(selectedScenarios, sc, setSelectedScenarios)}
                      />
                       <span className="text-sm text-slate-700 group-hover:text-slate-900">{sc}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <button
              onClick={runExperiments}
              disabled={isRunning || selectedAlgos.size === 0 || selectedSizes.size === 0}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-white shadow-md transition-all ${
                isRunning 
                  ? 'bg-slate-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg active:transform active:scale-[0.98]'
              }`}
            >
              {isRunning ? '正在运行...' : '开始实验'}
            </button>
            
            {isRunning && (
              <div className="mt-3 text-xs text-center text-slate-500 animate-pulse">
                {progress}
              </div>
            )}
            
            {/* Warning for large datasets */}
            {selectedSizes.has(100000) && Array.from(selectedAlgos).some((a: AlgorithmType) => SLOW_ALGOS.includes(a)) && (
               <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800">
                 <strong>注意：</strong> 对于 N=100,000，将自动跳过 O(n²) 算法（冒泡、插入、选择），以防止浏览器无响应。
               </div>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <section className="lg:col-span-9 space-y-6">
          
          {/* Tabs */}
          <div className="flex border-b border-slate-200">
            {[
              { id: 'dashboard', label: '可视化图表' },
              { id: 'table', label: '原始数据' },
              { id: 'analysis', label: 'AI 深度分析' },
              { id: 'code', label: 'Python 代码' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="min-h-[500px]">
            {activeTab === 'dashboard' && (
              <PerformanceCharts results={results} />
            )}

            {activeTab === 'table' && (
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-slate-600">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3">算法</th>
                        <th className="px-6 py-3">规模</th>
                        <th className="px-6 py-3">场景</th>
                        <th className="px-6 py-3 text-right">时间 (ms)</th>
                        <th className="px-6 py-3 text-right">比较次数</th>
                        <th className="px-6 py-3 text-right">交换次数</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                            暂无数据，请先运行实验。
                          </td>
                        </tr>
                      ) : (
                        results.map((r) => (
                          <tr key={r.id} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                            <td className="px-6 py-3 font-medium text-slate-900">{r.algorithm}</td>
                            <td className="px-6 py-3">{r.size.toLocaleString()}</td>
                            <td className="px-6 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                r.scenario === DataScenario.Random ? 'bg-purple-100 text-purple-700' :
                                r.scenario === DataScenario.Sorted ? 'bg-green-100 text-green-700' :
                                'bg-orange-100 text-orange-700'
                              }`}>
                                {r.scenario}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-right font-mono">{r.metrics.timeMs.toFixed(4)}</td>
                            <td className="px-6 py-3 text-right font-mono">{r.metrics.comparisons.toLocaleString()}</td>
                            <td className="px-6 py-3 text-right font-mono">{r.metrics.swaps.toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'analysis' && (
              <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">AI 性能分析报告</h3>
                    <p className="text-sm text-slate-500">使用 Qwen AI 分析实验结果</p>
                  </div>
                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || results.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {isAnalyzing ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        正在生成...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        生成分析报告
                      </>
                    )}
                  </button>
                </div>
                
                {results.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    请先运行实验以获得可供分析的数据。
                  </div>
                ) : (
                  <div className="prose prose-slate max-w-none bg-slate-50 p-6 rounded-lg border border-slate-200 font-medium text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {analysisText || "点击“生成分析报告”以获取对实验数据的深度解读..."}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'code' && (
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row min-h-[500px]">
                <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 p-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-4">选择排序算法</h4>
                  <div className="space-y-1">
                    {/* Fix: Directly cast Object.values results to enum array for proper type inference in map */}
                    {(Object.values(AlgorithmType) as AlgorithmType[]).map((algo) => {
                      return (
                        <button
                          key={algo}
                          onClick={() => {
                            setSelectedCodeAlgo(algo);
                            setPythonCode('# 点击按钮生成代码...');
                          }}
                          className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                            selectedCodeAlgo === algo 
                              ? 'bg-blue-100 text-blue-700 font-medium' 
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {algo}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={handleGenerateCode}
                    disabled={isGeneratingCode}
                    className="mt-6 w-full py-2 bg-white border border-slate-300 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50 shadow-sm"
                  >
                    {isGeneratingCode ? '正在生成...' : '生成 Python 代码'}
                  </button>
                </div>
                <div className="flex-1 bg-[#1e1e1e] p-0 overflow-auto">
                   <div className="flex items-center justify-between px-4 py-2 bg-[#252526] text-slate-300 text-xs border-b border-[#333]">
                     <span>{selectedCodeAlgo.replace(' ', '_').toLowerCase()}.py</span>
                     <span>Python 3.10</span>
                   </div>
                   <pre className="p-4 text-sm font-mono text-gray-300 leading-6">
                     <code>{pythonCode}</code>
                   </pre>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;