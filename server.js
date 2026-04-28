import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import OpenAI from "openai";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log("OPENAI KEY EXISTS:", !!process.env.OPENAI_API_KEY);
console.log("ENV KEYS:", Object.keys(process.env).filter(k => k.includes("OPENAI")));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

app.post("/generate-ad", upload.single("image"), async (req, res) => {
  try {
    const { adType, location, address, price, audience, tone, details, email } = req.body;

    const prompt = `
Create a professional Arizona real estate ad.

Ad Type: ${adType}
Location: ${location}
Address: ${address}
Price: ${price}
Audience: ${audience}
Tone: ${tone}
Details: ${details}

Return ONLY JSON:
{
  "headline": "",
  "caption": "",
  "cta": "",
  "hashtags": []
}
`;

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: prompt
    });

    let cleanText = response.output_text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const ad = JSON.parse(cleanText);

    let imageUrl = "";

    if (req.file) {
      const base64Image = req.file.buffer.toString("base64");
      imageUrl = `data:${req.file.mimetype};base64,${base64Image}`;
    } else {
      const imageResponse = await openai.images.generate({
        model: "gpt-image-1",
        prompt: `Professional real estate social media ad image. ${ad.headline}. ${details}. Arizona home, luxury real estate photography, clean marketing design.`,
        size: "1024x1024"
      });

      const imageBase64 = imageResponse.data[0].b64_json;
      imageUrl = `data:image/png;base64,${imageBase64}`;
    }

    if (email) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your AirCamX AI Real Estate Ad",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;padding:24px;">
            <h2>${ad.headline}</h2>
            ${imageUrl ? `<img src="${imageUrl}" style="width:100%;border-radius:12px;margin:15px 0;" />` : ""}
            <p>${ad.caption}</p>
            <p><strong>CTA:</strong> ${ad.cta}</p>
            <p><strong>Hashtags:</strong> ${ad.hashtags.join(" ")}</p>
          </div>
        `
      });
    }

    res.json({
      ...ad,
      imageUrl,
      emailSent: !!email
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate ad" });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server running on port ${process.env.PORT || 3000}`);
});