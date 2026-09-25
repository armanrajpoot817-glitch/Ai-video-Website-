const express = require("express");
const multer = require("multer");
const path = require("path");
const { Client } = require("magic-hour");

const app = express();
const PORT = process.env.PORT || 3000;

// Upload settings
const storage = multer.diskStorage({
destination: "/tmp/uploads/",

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

// Magic Hour client
const client = new Client({
token: process.env.MAGIC_HOUR_API_KEY
});

// Frontend
app.use(express.static(__dirname));

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

// ===============================
// START VIDEO GENERATION
// ===============================

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

  const prompt =
    req.body.prompt ||
    "Smooth natural motion";

  console.log(
    "Uploaded file:",
    req.file.path
  );

  // Upload image + create project
  const result =
    await client.v1.imageToVideo.create({
      name: "AI Image to Video",

      endSeconds: 5,

      resolution: "480p",

      assets: {
        imageFilePath: req.file.path
      },

      style: {
        prompt: prompt
      }
    });

  console.log(
    "Project created:",
    result.id
  );

  // IMPORTANT:
  // तुरंत Project ID वापस भेजेंगे
  res.json({
    status: "queued",
    projectId: result.id
  });

} catch (error) {

  console.error(
    "Create error:",
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

// ===============================
// CHECK VIDEO STATUS
// ===============================

app.get(
"/video-status/:projectId",
async (req, res) => {

try {

  const projectId =
    req.params.projectId;

  console.log(
    "Checking project:",
    projectId
  );

  const result =
    await client.v1.imageProjects.checkResults(
      projectId,
      {
        waitForCompletion: false,
        downloadOutputs: false
      }
    );

  console.log(
    "Project status:",
    result.status
  );

  // Video complete
  if (
    result.status === "complete" &&
    result.downloads &&
    result.downloads.length > 0
  ) {

    res.json({
      status: "complete",

      videoUrl:
        result.downloads[0].url
    });

    return;
  }

  // Error
  if (
    result.status === "error" ||
    result.status === "failed"
  ) {

    res.json({
      status: "error",

      error:
        result.error ||
        "Video generation failed"
    });

    return;
  }

  // Still generating
  res.json({
    status: result.status
  });

} catch (error) {

  console.error(
    "Status error:",
    error
  );

  res.status(500).json({
    error:
      error.message ||
      "Could not check video status"
  });
}

}
);

// Start server
app.listen(PORT, () => {

console.log(
"Server running on port ${PORT}"
);

});
