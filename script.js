const themeToggle = document.querySelector(".theme-toggle");
const promptForm = document.querySelector(".prompt-form");
const promptInput = document.querySelector(".prompt-input");
const promptBtn = document.querySelector(".prompt-btn");
const generateBtn = document.querySelector(".generate-btn");
const countSelect = document.getElementById("count-select");
const ratioSelect = document.getElementById("ratio-select");
const gridGallery = document.querySelector(".gallery-grid");
const logoutBtn = document.querySelector(".logout-btn");

const examplePrompts = [
  "A magic forest with glowing plants and fairy homes among giant mushrooms",
  "An old steampunk airship floating through golden clouds at sunset",
  "A future Mars colony with glass domes and gardens against red mountains",
  "A dragon sleeping on gold coins in a crystal cave",
  "An underwater kingdom with merpeople and glowing coral buildings",
  "A floating island with waterfalls pouring into clouds below",
  "A witch's cottage in fall with magic herbs in the garden",
  "A robot painting in a sunny studio with art supplies around it",
  "A magical library with floating glowing books and spiral staircases",
  "A Japanese shrine during cherry blossom season with lanterns and misty mountains",
];

(() => {
  const savedTheme = localStorage.getItem("theme");
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDarkTheme = savedTheme === "dark" || (!savedTheme && systemPrefersDark);
  document.body.classList.toggle("dark-theme", isDarkTheme);
  themeToggle.querySelector("i").className = isDarkTheme ? "fa-solid fa-sun" : "fa-solid fa-moon";
})();

const toggleTheme = () => {
  const isDarkTheme = document.body.classList.toggle("dark-theme");
  localStorage.setItem("theme", isDarkTheme ? "dark" : "light");
  themeToggle.querySelector("i").className = isDarkTheme ? "fa-solid fa-sun" : "fa-solid fa-moon";
};

const getImageDimensions = (aspectRatio, baseSize = 512) => {
  const [width, height] = aspectRatio.split("/").map(Number);
  const scaleFactor = baseSize / Math.sqrt(width * height);
  let calculatedWidth = Math.round(width * scaleFactor);
  let calculatedHeight = Math.round(height * scaleFactor);
  calculatedWidth = Math.floor(calculatedWidth / 16) * 16;
  calculatedHeight = Math.floor(calculatedHeight / 16) * 16;
  return { width: calculatedWidth, height: calculatedHeight };
};

const applyFilter = async (imgUrl, imgIndex) => {
  const imgCard = document.getElementById(`img-card-${imgIndex}`);
  if (!imgCard) return;

  try {
    const response = await fetch(imgUrl, { mode: "cors" });
    if (!response.ok) throw new Error("Failed to fetch image");

    const blob = await response.blob();
    const localUrl = URL.createObjectURL(blob);

    const img = new Image();
    img.src = localUrl;
    img.crossOrigin = "Anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = avg;
        data[i + 1] = avg;
        data[i + 2] = avg;
      }
      ctx.putImageData(imageData, 0, 0);

      const newImgUrl = canvas.toDataURL("image/png");
      updateImageCard(imgIndex, newImgUrl);
      URL.revokeObjectURL(localUrl);
    };

    img.onerror = () => {
      console.error("Rasmni yuklashda xato!");
      imgCard.classList.replace("loading", "error");
      imgCard.querySelector(".status-text").textContent = "Image load failed!";
    };
  } catch (error) {
    console.error("Tahrirlashda xato:", error);
    imgCard.classList.replace("loading", "error");
    imgCard.querySelector(".status-text").textContent = "Edit failed!";
  }
};

const deleteImage = (imgIndex) => {
  const imgCard = document.getElementById(`img-card-${imgIndex}`);
  if (imgCard) imgCard.remove();
};

const updateImageCard = (imgIndex, imgUrl) => {
  const imgCard = document.getElementById(`img-card-${imgIndex}`);
  if (!imgCard) return;

  imgCard.classList.remove("loading");
  imgCard.innerHTML = `
    <img src="${imgUrl}" class="result-img">
    <div class="img-overlay" style="display: flex; gap: 12px; justify-content: center; align-items: center; padding: 10px;">
      <a href="${imgUrl}" download="${Date.now()}.png" style="
        background-color: rgba(0, 0, 0, 0.6);
        border: none;
        color: #fff;
        padding: 8px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 16px;
        transition: all 0.3s ease;"
        onmouseover="this.style.backgroundColor='#198754'; this.style.transform='scale(1.1)'"
        onmouseout="this.style.backgroundColor='rgba(0, 0, 0, 0.6)'; this.style.transform='scale(1)'"
        title="Yuklab olish">
        <i class="fa-solid fa-download"></i>
      </a>
      <button onclick="applyFilter('${imgUrl}', ${imgIndex})" style="
        background-color: rgba(0, 0, 0, 0.6);
        border: none;
        color: #fff;
        padding: 8px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 16px;
        transition: all 0.3s ease;"
        onmouseover="this.style.backgroundColor='#0d6efd'; this.style.transform='scale(1.1)'"
        onmouseout="this.style.backgroundColor='rgba(0, 0, 0, 0.6)'; this.style.transform='scale(1)'"
        title="Tahrirlash">
        <i class="fa-solid fa-edit"></i>
      </button>
      <button onclick="deleteImage(${imgIndex})" style="
        background-color: rgba(0, 0, 0, 0.6);
        border: none;
        color: #fff;
        padding: 8px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 16px;
        transition: all 0.3s ease;"
        onmouseover="this.style.backgroundColor='#dc3545'; this.style.transform='scale(1.1)'"
        onmouseout="this.style.backgroundColor='rgba(0, 0, 0, 0.6)'; this.style.transform='scale(1)'"
        title="O‘chirish">
        <i class="fa-solid fa-trash"></i>
      </button>
    </div>
  `;
};

const generateImages = async (imageCount, aspectRatio, promptText) => {
  const { width, height } = getImageDimensions(aspectRatio);
  generateBtn.setAttribute("disabled", "true");

  const imagePromises = [...Array(imageCount).keys()].map(async (i) => {
    try {
      const imgUrl = `https://picsum.photos/${width}/${height}?random=${Math.random()}`;
      updateImageCard(i, imgUrl);
    } catch (error) {
      console.error(error);
      const imgCard = document.getElementById(`img-card-${i}`);
      imgCard.classList.replace("loading", "error");
      imgCard.querySelector(".status-text").textContent = "Generation failed!";
    }
  });

  await Promise.allSettled(imagePromises);
  generateBtn.removeAttribute("disabled");
};

const createImageCards = (imageCount, aspectRatio, promptText) => {
  gridGallery.innerHTML = "";
  for (let i = 0; i < imageCount; i++) {
    gridGallery.innerHTML += `
      <div class="img-card loading" id="img-card-${i}" style="aspect-ratio: ${aspectRatio}">
        <div class="status-container">
          <div class="spinner"></div>
          <i class="fa-solid fa-triangle-exclamation"></i>
          <p class="status-text">Generating...</p>
        </div>
      </div>
    `;
  }
  generateImages(imageCount, aspectRatio, promptText);
};

const handleFormSubmit = (e) => {
  e.preventDefault();
  const imageCount = parseInt(countSelect.value) || 1;
  const aspectRatio = ratioSelect.value || "1/1";
  const promptText = promptInput.value.trim();
  if (!promptText) {
    alert("Iltimos, prompt matnini kiriting!");
    return;
  }
  createImageCards(imageCount, aspectRatio, promptText);
};

promptBtn.addEventListener("click", () => {
  const prompt = examplePrompts[Math.floor(Math.random() * examplePrompts.length)];
  promptInput.value = prompt;
  promptInput.focus();
});

promptForm.addEventListener("submit", handleFormSubmit);
themeToggle.addEventListener("click", toggleTheme);

logoutBtn?.addEventListener("click", () => {
  localStorage.removeItem("user");
  window.location.href = "index.html";
});

window.applyFilter = applyFilter;
window.deleteImage = deleteImage;
