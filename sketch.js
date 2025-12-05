let img;
let capture;
let hands = [];
let options = { maxHands: 1, flipped: false };
let fingertipX;
let fingertipY;

let painting;
let px = 0;
let py = 0;

let tracingMode = false;
let viewImageMode = false;

let blurredImg; 
let revealMask;

function preload() {
  handPose = ml5.handPose();
  img = loadImage('/image.jpg');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  painting = createGraphics(width, height);

  capture = createCapture(VIDEO, {
    audio: false,
    video: { width: 640, height: 480 }
  });
  capture.hide();

  handPose.detectStart(capture, gotHands);

  revealMask = createGraphics(img.width, img.height);
  revealMask.background(0);
}


function draw() {
  background(255);

  // Calculate camera display dimensions
  let cameraAspectRatio = capture.width / capture.height;
  let cameraDisplayHeight = width / 2 / cameraAspectRatio;
  let cameraYOffset = (height - cameraDisplayHeight) / 2;
  
  blurredImg = createGraphics(img.width, img.height);
  blurredImg.image(img, 0, 0);
  blurredImg.filter(BLUR, 8);
  
  // Draw camera on left half
  if (capture.loadedmetadata) {
    image(capture, 0, cameraYOffset, width/2, cameraDisplayHeight);
    
    drawHands();
  }
  
  // RIGHT SIDE DISPLAY
  if (viewImageMode) {

    // Show blurred image first
    image(blurredImg, width/2, cameraYOffset, width/2, cameraDisplayHeight);
    console.log("enter");

    // Apply mask to original
    let masked = img.get();   // copy original
    masked.mask(revealMask);

    // Draw unblurred reveal areas
    image(masked, width/2, cameraYOffset, width/2, cameraDisplayHeight);

  } else {
    // Show normal image without blur
    image(img, width/2, cameraYOffset, width/2, cameraDisplayHeight);
    drawCircleOnImage();
  }

  
  if (tracingMode) {
    image(painting, 0, 0); 
    image(painting, width/2, 0, width/2, height); 
  }
  
  drawModeStatus();
}

function gotHands(results) {
  hands = results;
}

function drawModeStatus() {
  fill(0);
  textSize(16);
  
  if (viewImageMode) {
    fill(255, 0, 0);
    text("VIEW IMAGE MODE (Press 'v' to exit)", 20, 30);
  } else {
    fill(0);
    text("Normal Mode (Press 'v' for view mode)", 20, 30);
  }
  
  if (tracingMode) {
    fill(0, 0, 255);
    text("TRACING MODE ON (Press 'f' to stop)", 20, 50);
  } else {
    fill(0);
    text("Tracing: OFF (Press 'f' to trace)", 20, 50);
  }
}

function drawHands() {
  if (hands.length === 0) return;
  
  let cameraAspectRatio = capture.width / capture.height;
  let cameraDisplayHeight = width / 2 / cameraAspectRatio;
  let cameraYOffset = (height - cameraDisplayHeight) / 2;
  
  for (let i = 0; i < hands.length; i++) {
    let hand = hands[i];
    let indexFingertipKeypoint = hand.keypoints[8];

    fingertipX = indexFingertipKeypoint.x * (width/2) / capture.width;
    fingertipY = (indexFingertipKeypoint.y * cameraDisplayHeight / capture.height) + cameraYOffset;

    fill(0, 255, 0);
    noStroke();
    circle(fingertipX, fingertipY, 10);
    
    if (tracingMode) {
      traceLine();
    }
    
    if (viewImageMode) {
      traceUnblurred();
    }

  }
}

function drawCircleOnImage(){
  if (fingertipX === undefined || fingertipY === undefined) return;
  
  let imageCircleX = width/2 + fingertipX;
  let imageCircleY = fingertipY;

  fill(255, 0, 0);
  noStroke();
  circle(imageCircleX, imageCircleY, 10);
}

function traceUnblurred() {
  if (!viewImageMode) return;
  if (fingertipX === undefined || fingertipY === undefined) return;

  let imageX = fingertipX;
  let imageY = fingertipY;

  // Convert camera coords to image coords
  imageX = constrain(imageX, 0, width/2);
  imageY = constrain(imageY, 0, height);

  // Draw white circles on the mask → reveal original image
  revealMask.noStroke();
  revealMask.fill(255);
  revealMask.circle(imageX * (img.width/(width/2)), 
                    imageY * (img.height/height), 
                    60);
}

function traceLine(){
  if (fingertipX === undefined || fingertipY === undefined) return;
  
  painting.stroke(0, 0, 255);
  painting.strokeWeight(8);
  painting.line(px, py, fingertipX, fingertipY);
  
  // Update previous position
  px = fingertipX;
  py = fingertipY;
}

function keyPressed(){
  if (key === 'v') {
    viewImageMode = !viewImageMode;
    
  }
  if (key === 'f') {
    tracingMode = !tracingMode; 
    
    if (tracingMode) {
      if (fingertipX !== undefined && fingertipY !== undefined) {
        px = fingertipX;
        py = fingertipY;
      } else {
        px = 0;
        py = 0;
      }
    } else {
      painting.clear();
      px = 0;
      py = 0;
      console.log("Cleared drawing");
    }
  }
  if (key === 'e'){
    viewImageMode = false;
    // Exit tracing mode
    if (tracingMode) {
      tracingMode = false;
      // Reset previous positions
      px = 0;
      py = 0;
    }
  }
}