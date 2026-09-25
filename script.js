const imageInput = document.getElementById("imageInput");
const promptInput = document.getElementById("prompt");
const generateBtn = document.getElementById("generateBtn");
const statusText = document.getElementById("status");

generateBtn.addEventListener("click", async () => {
  const image = imageInput.files[0];
  const prompt = promptInput.value.trim();

  if (!image) {
    statusText.innerText = "Please select an image.";
    return;
  }

  statusText.innerText = "Generating video... Please wait.";
  generateBtn.disabled = true;

  try {
    const formData = new FormData();

    formData.append("image", image);
    formData.append(
      "prompt",
      prompt || "Smooth natural motion"
    );

    const response = await fetch(
      "https://ai-video-website-1.onrender.com/generate-video",
      {
        method: "POST",
        body: formData
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Video generation failed");
    }

    statusText.innerText =
      "Video generation started! Project ID: " +
      data.projectId;

    console.log("Magic Hour response:", data);

  } catch (error) {
    console.error(error);

    statusText.innerText =
      "Error: " + error.message;

  } finally {
    generateBtn.disabled = false;
  }
});
