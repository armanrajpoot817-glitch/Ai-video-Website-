const express = require("express");
const multer = require("multer");
const { Client } = require("magic-hour");

const app = express();
const PORT = process.env.PORT || 3000;

const upload = multer({
  dest: "/tmp/uploads/"
});

const client = new Client({
  token: process.env.MAGIC_HOUR_API_KEY
});

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "AI Video Backend Ready"
  });
});

app.get("/test-api-key", (req, res) => {
  res.json({
    status: process.env.MAGIC_HOUR_API_KEY
      ? "API key connected"
      : "API key missing"
  });
});

app.post("/generate-video", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "Image is required"
      });
    }

    const prompt = req.body.prompt || "Smooth natural motion";

    const result = await client.v1.imageToVideo.generate(
      {
        name: "AI Image to Video",
        endSeconds: 5,
        resolution: "480p",
        assets: {
          imageFilePath: req.file.path
        },
        style: {
          prompt: prompt
        }
      },
      {
        waitForCompletion: true,
        downloadOutputs: false
      }
    );

    res.json({
      status: result.status,
      projectId: result.id,
      result: result
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message || "Video generation failed"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
