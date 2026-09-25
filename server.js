const express = require("express");
const multer = require("multer");
const path = require("path");
const { Client } = require("magic-hour");

const app = express();
const PORT = process.env.PORT || 3000;

// Upload file को original extension के साथ save करना
const storage = multer.diskStorage({
  destination: "/tmp/uploads/",
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    cb(
      null,
      "image-" + Date.now() + extension
    );
  }
});

const upload = multer({
  storage: storage
});

const client = new Client({
  token: process.env.MAGIC_HOUR_API_KEY
});

// Frontend files
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
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

    console.log("Uploaded file:", req.file.path);

    const prompt =
      req.body.prompt || "Smooth natural motion";

    const result =
      await client.v1.imageToVideo.generate(
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
      error:
        error.message ||
        "Video generation failed"
    });
  }
});

app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});
