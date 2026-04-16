import { Router } from "express";
import OpenAI from "openai";

const router = Router();

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

router.post("/food-estimate", async (req, res) => {
  const { name, imageBase64 } = req.body as {
    name?: string;
    imageBase64?: string;
  };

  if (!name && !imageBase64) {
    res.status(400).json({ error: "name or imageBase64 is required" });
    return;
  }

  const prompt = `あなたは日本の栄養士です。${name ? `「${name}」という料理` : "この料理"}の一般的な1食分の栄養素を推定してください。
家庭料理や外食の標準的な1人前を想定し、以下のJSON形式で返してください。数値はすべて数値型（number）で返してください。

{
  "name": "料理名（正式名称）",
  "calories": カロリー数値（kcal、整数）,
  "protein": タンパク質のグラム数（小数点1桁）,
  "carbs": 炭水化物のグラム数（小数点1桁）,
  "fat": 脂質のグラム数（小数点1桁）,
  "amount": 一般的な1食の重量（グラム数、整数）,
  "unit": "g"
}

JSONのみを返し、他のテキストは含めないでください。`;

  try {
    const content: OpenAI.ChatCompletionContentPart[] = [];

    if (imageBase64) {
      content.push({
        type: "image_url",
        image_url: {
          url: `data:image/jpeg;base64,${imageBase64}`,
          detail: "low",
        },
      });
    }

    content.push({ type: "text", text: prompt });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content }],
      max_tokens: 300,
    });

    const text = response.choices[0]?.message?.content ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      res.status(422).json({ error: "Could not estimate nutrition data" });
      return;
    }

    const data = JSON.parse(jsonMatch[0]);
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Food estimate failed");
    res.status(500).json({ error: "Failed to estimate nutrition" });
  }
});

export default router;
