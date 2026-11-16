"use strict";
const PRELOADER_DURATION = 3000;
const SLIDE_UP_DURATION = 500;
const SHAPE_STEP = 6.6;
const TOTAL_FRAMES = 15;
let preloader;
let shapeLeft;
let shapeCenter;
let shapeRight;
let documentLoaded = false;
let virtualProgress = 0;
let currentFrameIndex = 0;
let animationFrameId = null;
let hideStarted = false;
document.addEventListener("DOMContentLoaded", () => {
  preloader = document.getElementById("preloader");
  if (!preloader) {
    return;
  }
  shapeLeft = preloader.querySelector(".shape-left");
  shapeCenter = preloader.querySelector(".shape-center");
  shapeRight = preloader.querySelector(".shape-right");
  if (!shapeLeft || !shapeCenter || !shapeRight) {
    return;
  }
  updateSprites(0);
  startVirtualProgress();
});
window.addEventListener("load", () => {
  documentLoaded = true;
  if (virtualProgress >= 99 && !hideStarted) {
    virtualProgress = 100;
    finishPreloader();
  }
});
function startVirtualProgress() {
  const startTime = performance.now();
  function updateProgress(currentTime) {
    const elapsed = currentTime - startTime;
    const calculatedProgress = Math.min(elapsed / PRELOADER_DURATION, 1);
    if (calculatedProgress >= 1 && !documentLoaded) {
      virtualProgress = 99;
      updateShapeRotation();
      animationFrameId = requestAnimationFrame(updateProgress);
      return;
    }
    if (!documentLoaded) {
      virtualProgress = calculatedProgress * 100;
    } else {
      virtualProgress = Math.min(calculatedProgress * 100, 100);
    }
    updateShapeRotation();
    if (virtualProgress >= 100 && documentLoaded) {
      virtualProgress = 100;
      finishPreloader();
      return;
    }
    animationFrameId = requestAnimationFrame(updateProgress);
  }
  animationFrameId = requestAnimationFrame(updateProgress);
}
function updateShapeRotation() {
  const nextFrame = Math.min(Math.floor(virtualProgress / SHAPE_STEP), TOTAL_FRAMES - 1);
  if (nextFrame === currentFrameIndex) {
    return;
  }
  currentFrameIndex = nextFrame;
  updateSprites(currentFrameIndex);
}
function updateSprites(frameIndex) {
  const percent = frameIndex / (TOTAL_FRAMES - 1) * 100;
  shapeLeft.style.backgroundPosition = `${percent}% 0%`;
  shapeCenter.style.backgroundPosition = `${percent}% 0%`;
  shapeRight.style.backgroundPosition = `${percent}% 0%`;
  pulseShape(shapeLeft);
  pulseShape(shapeCenter);
  pulseShape(shapeRight);
}
function pulseShape(element) {
  element.classList.remove("shape-pulse");
  void element.offsetWidth;
  element.classList.add("shape-pulse");
}
function finishPreloader() {
  if (hideStarted || !preloader) {
    return;
  }
  hideStarted = true;
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  virtualProgress = 100;
  updateSprites(TOTAL_FRAMES - 1);
  preloader.classList.add("preloader-hide");
  if (document.body) {
    document.body.classList.remove("preloader-active");
  }
  window.__preloaderFinished = true;
  window.dispatchEvent(new CustomEvent("preloaderFinished"));
  setTimeout(() => {
    if (preloader) {
      preloader.remove();
    }
  }, SLIDE_UP_DURATION);
}