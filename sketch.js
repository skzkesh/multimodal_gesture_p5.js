let img;
let capture;
let hands = [];
let fingertipX, fingertipY;

let painting;
let px = 0, py = 0;

let tracingMode = false;

let viewImageMode = false;
let drawCircleMode = false;

let blurImg;

function preload() {
  handPose = ml5.handPose();
  img = loadImage("bali.jpg");
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  painting = createGraphics(windowWidth, windowHeight);
  painting.clear();

  blurImg = createGraphics(800, 800);
  blurImg.image(img, 0, 0, blurImg.width, blurImg.height);
  blurImg.filter(BLUR, 5);

  capture = createCapture(VIDEO, {
    audio: false,
    video: { width: 640, height: 480 }
  });
  capture.hide();

  handPose.detectStart(capture, gotHands);
}

function draw() {
  background(255);

  let camAspect = capture.width / capture.height;
  let camH = (width / 2) / camAspect;
  let camYoff = (height - camH) / 2;

  // ---- Left camera ----
  if (capture.loadedmetadata) {
    image(capture, 0, camYoff, width / 2, camH);
    drawHands(camH, camYoff);
  }

  // ---- Right screen ----
  if (!viewImageMode) {
    image(img, width / 2, camYoff, width / 2, camH);
  } else {
    displayViewMode(camH, camYoff);
  }
  
  image(painting, 0, 0);

  if (drawCircleMode) drawCircleAtColor(camH, camYoff);

  drawStatusText();
}

function displayViewMode(camH, camYoff) {
  image(blurImg, width / 2, camYoff, width / 2, camH);

  if (fingertipX === undefined) return;

  let rSize = 40;
  let rx = fingertipX;
  let ry = fingertipY;

  let srcX = (rx / (width/2)) * img.width;
  let srcY = ((ry - camYoff) / camH) * img.height;

  image(
    img,
    width/2 + rx - rSize/2, ry - rSize/2, rSize, rSize,
    srcX - (rSize/2)*(img.width/(width/2)),
    srcY - (rSize/2)*(img.height/camH),
    (rSize)*(img.width/(width/2)),
    (rSize)*(img.height/camH)
  );

  noFill();
  stroke(255,0,0);
  rect(width/2 + rx - rSize/2, ry - rSize/2, rSize, rSize);
}

function gotHands(results) {
  hands = results;
}

function drawHands(camH, camYoff) {
  if (hands.length === 0) return;
  let hand = hands[0];
  let tip = hand.keypoints[8];

  fingertipX = (tip.x / capture.width) * (width / 2);
  fingertipY = (tip.y / capture.height) * camH + camYoff;

  fill(0, 255, 0);
  circle(fingertipX, fingertipY, 12);

  if (tracingMode) traceLine();
}

function traceLine() {
  if (fingertipX === undefined) return;

  painting.stroke(0, 0, 255);
  painting.strokeWeight(8);
  painting.line(px, py, fingertipX, fingertipY);

  painting.line(px + width/2, py,
                fingertipX + width/2, fingertipY);

  px = fingertipX;
  py = fingertipY;
}

function drawCircleAtColor(camH, camYoff) {
  if (hands.length === 0 || fingertipX === undefined) return;

  let hand = hands[0];
  let indexTip = hand.keypoints[8];
  let thumbTip = hand.keypoints[4];

  let dist = distThumbIndex(thumbTip, indexTip);
  let r = map(dist, 0, 150, 8, 40);

  let rx = fingertipX;
  let ry = fingertipY;

  let sx = (rx / (width / 2)) * img.width;
  let sy = ((ry - camYoff) / camH) * img.height;
  let col = img.get(int(sx), int(sy));

  painting.noStroke();
  painting.fill(col[0], col[1], col[2], 180);
  painting.circle(rx + width/2, ry, r);
}

function distThumbIndex(t, i) {
  return Math.hypot(t.x - i.x, t.y - i.y);
}

function keyPressed() {

  // TRACE mode
  if (key === 'f') {
    tracingMode = !tracingMode;
    drawCircleMode = false;
    viewImageMode = false;

    if (tracingMode && fingertipX !== undefined) {
      px = fingertipX;  
      py = fingertipY;  
    }
  }

  // CIRCLE MODE
  if (key === 'c') {
    drawCircleMode = true;
    tracingMode = false;
    viewImageMode = false;
  }

  // VIEW MODE
  if (key === 'v') {
    viewImageMode = true;
    tracingMode = false;
    drawCircleMode = false;
  }

  // EXIT
  if (key === 'e') {
    viewImageMode = false;
    tracingMode = false;
    drawCircleMode = false;
    painting.clear();
  }
}

function drawStatusText() {
  fill(0);
  textSize(18);

  text("Press f=trace | c=circles | x=clear | v=view | e=exit", 20, 30);

  if (tracingMode) {
    fill(0, 0, 255);
    text("Tracing Mode", 20, 60);
  }
  if (viewImageMode) {
    fill(255, 0, 0);
    text("View Mode (Patch Reveal)", 20, 60);
  }
  if (drawCircleMode) {
    fill(0, 150, 0);
    text("Circle Drawing Mode", 20, 60);
  }
}
