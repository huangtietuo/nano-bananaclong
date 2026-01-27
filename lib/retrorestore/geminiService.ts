import { RestorationConfig } from '@/components/retrorestore/types';

export const restoreImage = async (
  base64Image: string,
  mimeType: string,
  config: RestorationConfig
): Promise<string> => {
  // 构建基于用户配置的提示词
  let prompt = "Act as a professional photo restorer. Restore this old photograph.";
  
  const tasks: string[] = [];
  if (config.denoise) tasks.push("remove all film grain, noise, and scratches");
  if (config.sharpen) tasks.push("significantly improve sharpness, clarity and resolution of details");
  if (config.colorize) {
    tasks.push("colorize the image realistically with historically accurate colors");
  } else {
    tasks.push("maintain the black and white aesthetic but improve dynamic range and contrast");
  }

  if (tasks.length > 0) {
    prompt += ` Your tasks are: ${tasks.join(", ")}.`;
  }

  if (config.promptEnhancement) {
    prompt += ` Additionally: ${config.promptEnhancement}`;
  }

  prompt += " Return ONLY the restored image. Do not change the aspect ratio significantly.";

  try {
    // 使用项目内部的 API 路由，这样可以利用现有的积分系统和统一的 API 调用方式
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        image: `data:${mimeType};base64,${base64Image}`
      }),
    });

    if (!response.ok) {
      if (response.status === 402) {
        // 积分不足错误，需要特殊处理
        const errorData = await response.json();
        throw new Error(errorData.error || "Insufficient credits");
      }
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    // 解析响应，提取修复后的图片
    if (data.choices && data.choices.length > 0) {
      const content = data.choices[0].message?.content;
      if (content && typeof content === 'string') {
        // 处理可能的响应格式
        const match = content.match(/data:image\/[^;]+;base64,[^\s]+/);
        if (match) {
          return match[0];
        }
      }
    }

    throw new Error("No image data found in response.");

  } catch (error) {
    console.error("Restoration failed:", error);
    throw error;
  }
};