export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  console.log("[Route] POST /api/generate - 请求开始");
  try {
    const { prompt, image } = await request.json();
    console.log("[Route] 接收到的参数:", {
      prompt: prompt?.substring(0, 100),
      hasImage: !!image
    });

    interface Message {
      role: string;
      content: Array<{
        type: string;
        text?: string;
        image_url?: {
          url: string;
        };
      }>;
    }

    const messages: Message[] = [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: prompt,
          },
        ],
      },
    ];

    // 如果有上传的图片,添加到消息内容中
    if (image) {
      console.log("[Route] 添加图片到消息中");
      messages[0].content.push({
        type: "image_url",
        image_url: {
          url: image,
        },
      });
    }

    console.log("[Route] 准备调用 API，消息数量:", messages[0].content.length);
    const response = await fetch("https://breakout.wenwen-ai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        stream: false,
        messages,
      }),
    });

    if (!response.ok) {
      console.error("[Route] API 响应错误:", response.status, response.statusText);
      throw new Error(`API error: ${response.statusText}`);
    }

    console.log("[Route] API 调用成功，解析响应数据");
    const data = await response.json();
    console.log("[Route] 返回响应数据", data);
    return Response.json(data);
  } catch (error) {
    console.error("[Route] 发生错误:", error);
    return Response.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}
