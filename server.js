const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { Client } = require("magic-hour");

const app = express();
const PORT = process.env.PORT || 3000;

// Upload folder
const uploadDir = "/tmp/uploads";
const outputDir = "/tmp/outputs";

fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(outputDir, { recursive: true });

// Uploaded image को extension के साथ save करना
const storage = multer.diskStorage({
  destination: uploadDir,

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

// Magic Hour
const client = new Client({
  token: process.env.MAGIC_HOUR_API_KEY
});

// Frontend
app.use(express.static(__dirname));

// Generated video को browser में serve करना
app.use(
  "/videos",
  express.static(outputDir)
);

app.get("/", (req, res) => {
  res.sendFile(
    path.join(__dirname, "index.html")
  );
});

// API key test
app.get("/test-api-key", (req, res) => {
  res.json({
    status: process.env.MAGIC_HOUR_API_KEY
      ? "API key connected"
      : "API key missing"
  });
});

// Generate video
app.post(
  "/generate-video",
  upload.single("image"),
  async (req, res) => {

    try {

      if (!req.file) {
        return res.status(400).json({
          error: "Image is required"
        });
      }

      console.log(
        "Uploaded file:",
        req.file.path
      );

      const prompt =
        req.body.prompt ||
        "Smooth natural motion";

      const result =
        await client.v1.imageToVideo.generate(
          {
            name: "AI Image to Video",

            endSeconds: 5,

            resolution: "480p",

            assets: {
              imageFilePath:
                req.file.path
            },

            style: {
              prompt: prompt
            }
          },
          {
            waitForCompletion: true,

            downloadOutputs: true,

            downloadDirectory:
              outputDir
          }
        );

      console.log(
        "Generation result:",
        result
      );

      // Downloaded video path
      let videoUrl = null;

      if (
        result.downloadedPaths &&
        result.downloadedPaths.length > 0
      ) {

        const downloadedFile =
          result.downloadedPaths[0];

        const fileName =
          path.basename(downloadedFile);

        videoUrl =
          "/videos/" + fileName;
      }

      res.json({

        status: result.status,

        projectId: result.id,

        videoUrl: videoUrl

      });

    } catch (error) {

      console.error(
        "Generation error:",
        error
      );

      res.status(500).json({

        error:
          error.message ||
          "Video generation failed"

      });
    }
  }
);

// Start server
app.listen(PORT, () => {

  console.log(
    `Server running on port ${PORT}`
  );

});
