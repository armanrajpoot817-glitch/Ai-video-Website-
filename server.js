const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { Client } = require("magic-hour");

const app = express();
const PORT = process.env.PORT || 3000;

const uploadDir = "/tmp/uploads";
const outputDir = "/tmp/outputs";

fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(outputDir, { recursive: true });

const storage = multer.diskStorage({
destination: uploadDir,

filename: (req, file, cb) => {
const extension =
path.extname(file.originalname).toLowerCase();

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

app.use(express.static(__dirname));

app.get("/", (req, res) => {
res.sendFile(
path.join(__dirname, "index.html")
);
});

app.get("/test-api-key", (req, res) => {
res.json({
status: process.env.MAGIC_HOUR_API_KEY
? "API key connected"
: "API key missing"
});
});

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
          imageFilePath: req.file.path
        },

        style: {
          prompt: prompt
        }
      },
      {
        waitForCompletion: true,

        downloadOutputs: true,

        downloadDirectory: outputDir
      }
    );

  console.log(
    "Generation complete:",
    result.id
  );

  console.log(
    "Downloaded files:",
    result.downloadedPaths
  );

  let videoUrl = null;

  if (
    result.downloadedPaths &&
    result.downloadedPaths.length > 0
  ) {

    const filePath =
      result.downloadedPaths[0];

    const fileName =
      path.basename(filePath);

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

  // Magic Hour की असली error निकालने की कोशिश
  let details = null;

  try {
    if (error.response) {
      details =
        await error.response.json();
    }
  } catch (parseError) {
    details = null;
  }

  res.status(500).json({
    error:
      details?.message ||
      error.message ||
      "Video generation failed"
  });
}

}
);

// Generated videos serve करना
app.use(
"/videos",
express.static(outputDir)
);

app.listen(PORT, () => {

console.log(
"Server running on port ${PORT}"
);

});
