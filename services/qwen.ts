import axios from 'axios';
import { BenchmarkResult } from "../types";

/**
 * QwenAI API配置
 */
const isDev = import.meta.env.DEV;
const QWEN_API_URL = isDev ? "/api/qwen" : "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation";
const QWEN_MODEL = "qwen-turbo";

/**
 * 调用QwenAI API的通用函数
 */
const callQwenAPI = async (prompt: string): Promise<string> => {
  if (!import.meta.env.VITE_QWEN_API_KEY) {
    return "未配置 QwenAI API 密钥。请在环境变量中设置 VITE_QWEN_API_KEY。";
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    // 生产环境需要添加Authorization头
    if (!isDev) {
      headers['Authorization'] = `Bearer ${import.meta.env.VITE_QWEN_API_KEY}`;
    }

    const response = await axios.post(
      QWEN_API_URL,
      {
        model: QWEN_MODEL,
        input: {
          messages: [
            {
              role: "user",
              content: prompt
            }
          ]
        },
        parameters: {
          temperature: 0.7,
          max_tokens: 2000
        }
      },
      { headers }
    );

    console.log("QwenAPI Response:", JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.output && response.data.output.choices && response.data.output.choices.length > 0) {
      return response.data.output.choices[0].message.content || "未能生成响应。";
    } else {
      // 尝试其他可能的响应格式
      if (response.data.output && response.data.output.text) {
        return response.data.output.text;
      }
      if (response.data.choices && response.data.choices.length > 0) {
        return response.data.choices[0].message?.content || response.data.choices[0].text || "未能生成响应。";
      }
      return `API响应格式异常。完整响应: ${JSON.stringify(response.data)}`;
    }
  } catch (error) {
    console.error("QwenAI Error:", error);
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        return "API密钥无效或已过期。请检查 VITE_QWEN_API_KEY 环境变量。";
      } else if (error.response?.status === 429) {
        return "API调用频率过高，请稍后重试。";
      } else {
        return `API调用失败: ${error.response?.data?.message || error.message}`;
      }
    }
    return "生成分析失败。请检查 API 密钥或网络连接。";
  }
};

/**
 * 使用QwenAI分析排序算法基准测试结果
 */
export const analyzeBenchmarkResults = async (results: BenchmarkResult[]) => {
  const prompt = `
    你是一位计算机科学实验室助教。
    请分析以下排序算法的基准测试结果。
    根据时间复杂度（Big O）和空间复杂度解释性能差异。
    强调为什么某些算法在特定数据集（随机、有序、逆序）上表现更好。
    
    请使用中文回答，保持解释简洁且具有教育意义，适合大学实验报告。
    
    数据：
    ${JSON.stringify(results.map(r => ({
      算法: r.algorithm,
      规模: r.size,
      场景: r.scenario,
      用时: r.metrics.timeMs.toFixed(4) + 'ms',
      比较次数: r.metrics.comparisons,
    })), null, 2)}
  `;

  return await callQwenAPI(prompt);
};

/**
 * 使用QwenAI生成排序算法的Python实现
 */
export const generatePythonCode = async (algorithm: string) => {
  const prompt = `
    请编写一个简洁、具有教育意义的 ${algorithm} 的 Python 实现。
    包含解释逻辑的中文注释。
    同时包含一个小的 main 代码块，演示其对 10 个整数的随机列表进行排序。
    不要使用 markdown 代码块标记，直接返回原始代码文本。
  `;

  const code = await callQwenAPI(prompt);
  
  // 清理可能的markdown代码块标记
  return code.replace(/```python/g, "").replace(/```/g, "").trim();
};