const express = require("express");
const multer = require("multer");
const cors = require("cors");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use("/outputs", express.static(path.join(__dirname, "outputs")));

if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
if (!fs.existsSync("outputs")) fs.mkdirSync("outputs");

const upload = multer({ dest: "uploads/" });

app.get("/", (req, res) => {
  res.send("AirCamX Photo Enhancer Backend Running");
});

app.post("/enhance-pro", upload.array("photos"), async (req, res) => {
  try {
    const mode = req.body.mode || "standard";
    const images = [];

    for (const file of req.files) {
      const outputName = `enhanced-${Date.now()}-${Math.round(Math.random() * 9999)}.jpg`;
      const outputPath = path.join(__dirname, "outputs", outputName);

      let edit = sharp(file.path)
        .resize({ width: 2200, withoutEnlargement: true })
        .jpeg({ quality: 92 });

      if (mode === "standard") {
        edit = edit.modulate({ brightness: 1.08, saturation: 1.12 }).sharpen();
      }

      if (mode === "mls") {
        edit = edit.modulate({ brightness: 1.12, saturation: 1.18 }).sharpen();
      }

      if (mode === "sky") {
        edit = edit.modulate({ brightness: 1.15, saturation: 1.25 }).sharpen();
      }

      if (mode === "twilight") {
        edit = edit.modulate({ brightness: 0.85, saturation: 1.3, hue: 15 }).sharpen();
      }

      if (mode === "luxury") {
        edit = edit.modulate({ brightness: 1.06, saturation: 1.15 }).sharpen();
      }

      await edit.toFile(outputPath);

      fs.unlinkSync(file.path);

      images.push(`/outputs/${outputName}`);
    }

    res.json({ success: true, images });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, error: "Enhancement failed" });
  }
});

app.listen(PORT, () => {
  console.log(`AirCamX backend running on http://localhost:${PORT}`);
});