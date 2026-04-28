const express = require("express");
const multer = require("multer");
const cors = require("cors");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const uploadsDir = path.join(__dirname, "uploads");
const outputsDir = path.join(__dirname, "outputs");

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
if (!fs.existsSync(outputsDir)) fs.mkdirSync(outputsDir);

app.use("/outputs", express.static(outputsDir));

const upload = multer({ dest: uploadsDir });

app.get("/", (req, res) => {
    res.send("AirCamX Backend Running");
});

app.post("/enhance-pro", upload.array("photos"), async (req, res) => {
    try {
        const mode = req.body.mode || "standard";
        const images = [];

        for (const file of req.files) {
            const name = `img-${Date.now()}-${Math.floor(Math.random()*9999)}.jpg`;
            const output = path.join(outputsDir, name);

            let img = sharp(file.path)
                .resize({ width: 2000, withoutEnlargement: true })
                .jpeg({ quality: 92 });

            if (mode === "standard") {
                img = img.modulate({ brightness: 1.08, saturation: 1.1 }).sharpen();
            }

            if (mode === "mls") {
                img = img.modulate({ brightness: 1.12, saturation: 1.2 }).sharpen();
            }

            if (mode === "luxury") {
                img = img.modulate({ brightness: 1.05, saturation: 1.1 }).sharpen({ sigma: 1.4 });
            }

            if (mode === "twilight") {
                img = img.modulate({ brightness: 0.85, saturation: 1.3, hue: 10 });
            }

            if (mode === "sky") {
                img = img.modulate({ brightness: 1.15, saturation: 1.25 });
            }

            await img.toFile(output);

            fs.unlinkSync(file.path);

            images.push(`/outputs/${name}`);
        }

        res.json({ success: true, images });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
});

app.listen(PORT, () => {
    console.log("Running on http://localhost:3000");
});