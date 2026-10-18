"use strict";

const weatherMap = { snow: "雪", rain: "雨", fog: "雾" };
const sceneMap = { garden: "Garden", bicycle: "Bicycle", treehill: "Treehill", truck: "Truck" };
const geometryMethodMap = { snow: "ClimateNeRF", rain: "RainyGS", fog: "ClimateNeRF" };
const methodMap = {
  ours: "本文方法",
  weatheredit: "WeatherEdit",
  climatenerf: "ClimateNeRF",
  ditto: "Ditto",
  vace: "VACE-Wan2.1-1.3B"
};
const levelMap = { low: "低强度", medium: "中等强度", high: "高强度" };

const weatherState = { weather: "snow", scene: "garden", method: "ours" };
const controlState = { weather: "snow", level: "medium" };

class VideoController {
  constructor(videoId, stageId, statusId) {
    this.video = document.getElementById(videoId);
    this.stage = document.getElementById(stageId);
    this.status = document.getElementById(statusId);
    this.statusText = this.status.querySelector(".status-text");
    this.missingMessage = "暂无视频结果";

    this.video.addEventListener("loadedmetadata", () => this.fitStageToVideo());
    this.video.addEventListener("loadeddata", () => this.showVideo());
    this.video.addEventListener("canplay", () => this.showVideo());
    this.video.addEventListener("error", () => this.showMissing());
  }

  fitStageToVideo() {
    if (this.video.videoWidth && this.video.videoHeight) {
      this.stage.style.aspectRatio = `${this.video.videoWidth} / ${this.video.videoHeight}`;
    }
  }

  update(source, missingMessage) {
    this.missingMessage = missingMessage;
    this.stage.classList.remove("is-missing");
    this.status.classList.add("is-visible", "is-loading");
    this.statusText.textContent = "正在加载视频…";
    this.video.pause();
    this.video.src = source;
    this.video.load();
  }

  showVideo() {
    this.stage.classList.remove("is-missing");
    this.status.classList.remove("is-visible", "is-loading");
    const playPromise = this.video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  }

  showMissing() {
    this.video.pause();
    this.stage.classList.add("is-missing");
    this.status.classList.add("is-visible");
    this.status.classList.remove("is-loading");
    this.statusText.textContent = this.missingMessage;
  }
}

class BeforeAfterController {
  constructor() {
    this.original = document.getElementById("original-video");
    this.result = document.getElementById("weather-video");
    this.stage = document.getElementById("weather-stage");
    this.status = document.getElementById("weather-status");
    this.statusText = this.status.querySelector(".status-text");
    this.afterLabel = document.getElementById("weather-after-label");
    this.generation = 0;
    this.isDragging = false;
    this.isSyncing = false;

    this.bindDivider();
    this.bindPlaybackSync();
    this.monitorPlayback();
  }

  bindDivider() {
    const moveDivider = (clientX) => {
      const bounds = this.stage.getBoundingClientRect();
      const percent = Math.min(100, Math.max(0, ((clientX - bounds.left) / bounds.width) * 100));
      this.stage.style.setProperty("--split-position", `${percent}%`);
      this.stage.setAttribute("aria-valuenow", String(Math.round(percent)));
    };

    this.stage.addEventListener("pointerdown", (event) => {
      if (this.stage.classList.contains("is-missing")) return;
      this.isDragging = true;
      this.stage.setPointerCapture(event.pointerId);
      moveDivider(event.clientX);
    });
    this.stage.addEventListener("pointermove", (event) => {
      if (this.isDragging) moveDivider(event.clientX);
    });
    ["pointerup", "pointercancel"].forEach((type) => {
      this.stage.addEventListener(type, (event) => {
        this.isDragging = false;
        if (this.stage.hasPointerCapture(event.pointerId)) this.stage.releasePointerCapture(event.pointerId);
      });
    });
    this.stage.addEventListener("keydown", (event) => {
      const current = Number(this.stage.getAttribute("aria-valuenow"));
      let next = current;
      if (event.key === "ArrowLeft") next -= 2;
      if (event.key === "ArrowRight") next += 2;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = 100;
      if (next !== current) {
        event.preventDefault();
        next = Math.min(100, Math.max(0, next));
        this.stage.style.setProperty("--split-position", `${next}%`);
        this.stage.setAttribute("aria-valuenow", String(next));
      }
    });
  }

  bindPlaybackSync() {
    const videos = [this.original, this.result];
    videos.forEach((source, index) => {
      const target = videos[1 - index];
      source.addEventListener("play", () => {
        if (target.paused) target.play().catch(() => {});
      });
      source.addEventListener("pause", () => {
        if (!target.paused) target.pause();
      });
      source.addEventListener("seeking", () => this.syncTime(source, target, true));
      source.addEventListener("seeked", () => this.syncTime(source, target, true));
      source.addEventListener("ratechange", () => {
        if (target.playbackRate !== source.playbackRate) target.playbackRate = source.playbackRate;
      });
    });
  }

  syncTime(source, target, force = false) {
    if (this.isSyncing || source.readyState < 1 || target.readyState < 1) return;
    const targetDuration = Number.isFinite(target.duration) ? target.duration : source.currentTime;
    const desiredTime = Math.min(source.currentTime, Math.max(0, targetDuration - 0.001));
    if (!force && Math.abs(target.currentTime - desiredTime) <= 0.05) return;

    this.isSyncing = true;
    target.currentTime = desiredTime;
    window.setTimeout(() => { this.isSyncing = false; }, 60);
  }

  monitorPlayback() {
    if (!this.result.paused) this.syncTime(this.result, this.original);
    window.requestAnimationFrame(() => this.monitorPlayback());
  }

  loadVideo(video, source) {
    return new Promise((resolve, reject) => {
      const cleanup = () => {
        video.removeEventListener("loadeddata", onReady);
        video.removeEventListener("error", onError);
      };
      const onReady = () => { cleanup(); resolve(); };
      const onError = () => { cleanup(); reject(new Error("Video unavailable")); };
      video.addEventListener("loadeddata", onReady, { once: true });
      video.addEventListener("error", onError, { once: true });
      video.src = source;
      video.load();
    });
  }

  async update(originalSource, resultSource, weatherLabel, missingMessage) {
    const generation = ++this.generation;
    this.original.pause();
    this.result.pause();
    this.stage.classList.remove("is-missing");
    this.status.classList.add("is-visible", "is-loading");
    this.statusText.textContent = "正在加载视频…";
    this.afterLabel.textContent = weatherLabel;

    try {
      await Promise.all([
        this.loadVideo(this.original, originalSource),
        this.loadVideo(this.result, resultSource)
      ]);
      if (generation !== this.generation) return;

      if (this.original.videoWidth && this.original.videoHeight) {
        this.stage.style.aspectRatio = `${this.original.videoWidth} / ${this.original.videoHeight}`;
      }
      this.original.currentTime = 0;
      this.result.currentTime = 0;
      this.status.classList.remove("is-visible", "is-loading");
      await Promise.allSettled([this.original.play(), this.result.play()]);
      this.syncTime(this.result, this.original, true);
    } catch (_error) {
      if (generation !== this.generation) return;
      this.original.pause();
      this.result.pause();
      this.stage.classList.add("is-missing");
      this.status.classList.add("is-visible");
      this.status.classList.remove("is-loading");
      this.statusText.textContent = missingMessage;
    }
  }
}

const weatherComparison = new BeforeAfterController();
const controlPlayer = new VideoController("control-video", "control-stage", "control-status");

function setActiveButton(button, selector) {
  document.querySelectorAll(selector).forEach((item) => {
    const isActive = item === button;
    item.classList.toggle("is-active", isActive);
    item.setAttribute("aria-pressed", String(isActive));
  });
}

function getMethodName(weather, method) {
  return method === "climatenerf" ? geometryMethodMap[weather] : methodMap[method];
}

function updateGeometryMethodLabel() {
  const button = document.getElementById("geometry-method-button");
  button.textContent = geometryMethodMap[weatherState.weather];
  button.setAttribute("aria-label", geometryMethodMap[weatherState.weather]);
}

function updateWeatherVideo() {
  const { weather, scene, method } = weatherState;
  const originalPath = `assets/videos/original/${scene}.mp4`;
  const resultPath = `assets/videos/weather/${weather}/${scene}/${method}.mp4`;
  updateGeometryMethodLabel();
  document.getElementById("weather-selection").textContent =
    `${weatherMap[weather]} · ${sceneMap[scene]} · ${getMethodName(weather, method)}`;
  weatherComparison.update(originalPath, resultPath, weatherMap[weather], "暂无该组合的视频结果");
}

function updateControlVideo() {
  const { weather, level } = controlState;
  const path = `assets/videos/control/${weather}_${level}.mp4`;
  document.getElementById("control-selection").textContent =
    `${weatherMap[weather]} · ${levelMap[level]}`;
  controlPlayer.update(path, "暂无该强度结果");
}

document.querySelectorAll("[data-weather]").forEach((button) => {
  button.addEventListener("click", () => {
    weatherState.weather = button.dataset.weather;
    setActiveButton(button, "[data-weather]");
    updateWeatherVideo();
  });
});

document.querySelectorAll("[data-scene]").forEach((button) => {
  button.addEventListener("click", () => {
    weatherState.scene = button.dataset.scene;
    setActiveButton(button, "[data-scene]");
    updateWeatherVideo();
  });
});

document.querySelectorAll("[data-method]").forEach((button) => {
  button.addEventListener("click", () => {
    weatherState.method = button.dataset.method;
    setActiveButton(button, "[data-method]");
    updateWeatherVideo();
  });
});

document.querySelectorAll("[data-control-weather]").forEach((button) => {
  button.addEventListener("click", () => {
    controlState.weather = button.dataset.controlWeather;
    setActiveButton(button, "[data-control-weather]");
    updateControlVideo();
  });
});

document.querySelectorAll("[data-level]").forEach((button) => {
  button.addEventListener("click", () => {
    controlState.level = button.dataset.level;
    setActiveButton(button, "[data-level]");
    updateControlVideo();
  });
});

document.querySelectorAll("[data-disabled-link]").forEach((link) => {
  link.addEventListener("click", (event) => event.preventDefault());
});

document.querySelectorAll("[data-image-fallback] img").forEach((image) => {
  const markMissing = () => image.closest("[data-image-fallback]").classList.add("is-missing");
  image.addEventListener("error", markMissing);
  if (image.complete && image.naturalWidth === 0) markMissing();
});

async function loadAbstract() {
  const container = document.getElementById("abstract-copy");
  const path = container.dataset.abstractPath;

  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error("Abstract file not found");
    const sourceText = (await response.text()).trim();
    if (!sourceText) throw new Error("Abstract file is empty");

    const chineseAbstract = sourceText.match(/摘\s*要[：:]([\s\S]*?)关键词[：:]/);
    const text = chineseAbstract ? chineseAbstract[1].trim() : sourceText;

    container.replaceChildren();
    text.split(/\r?\n\s*\r?\n/).forEach((paragraph) => {
      const element = document.createElement("p");
      element.textContent = paragraph.replace(/\r?\n/g, " ").trim();
      container.appendChild(element);
    });
  } catch (_error) {
    // file:// 下部分浏览器会阻止 fetch；保留 HTML 中已嵌入的摘要。
  }
}

loadAbstract();
updateWeatherVideo();
updateControlVideo();
