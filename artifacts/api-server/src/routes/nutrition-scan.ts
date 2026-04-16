import { Router } from "express";
import OpenAI from "openai";

const router = Router();

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

router.post("/nutrition-scan", async (req, res) => {
  const { imageBase64 } = req.body as { imageBase64?: string };

  if (!imageBase64) {
    res.status(400).json({ error: "imageBase64 is required" });
    return;
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: "high",
              },
            },
            {
              type: "text",
              text: `この画像は食品の栄養成分表示ラベルです。以下のJSON形式で栄養情報を抽出してください。数値はすべて数値型（number）で返してください。見つからない場合は0を返してください。

{
  "name": "食品名（ラベルから読み取れる場合）",
  "calories": カロリー数値（kcal）,
  "protein": タンパク質のグラム数,
  "carbs": 炭水化物のグラム数,
  "fat": 脂質のグラム数,
  "amount": 内容量または1食あたりのグラム数（見つからない場合は100）,
  "unit": "g"
}

JSONのみを返し、他のテキストは含めないでください。`,
            },
          ],
        },
      ],
      max_tokens: 300,
    });

    const content = response.choices[0]?.message?.content ?? "";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      res.status(422).json({ error: "Could not extract nutrition data from image" });
      return;
    }

    const data = JSON.parse(jsonMatch[0]);
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Nutrition scan failed");
    res.status(500).json({ error: "Failed to analyze image" });
  }
});

export default router;
