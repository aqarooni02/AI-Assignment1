let cityCoords = [];
let cityNames = [];
let citiesHC = [];
let currentRoute = [];
let bestRoute = [];
let bestDistanceHC = Infinity;
let initialDistanceHC = 0;
let maxIterations = 1000;
let iterationCount = 0;
let offSet = [50, 150];
let citiesRectMargin = [10, 10];

// Metrics
let startTime, endTime;
let bestDistances = [];
let bestIterationFound = 0;
let fileLoaded = false;

function preload() {
  loadCityCoordsFromFile("coordinates_100.txt");
}

function setup() {
  createCanvas(1500, 800);
  if (!fileLoaded) return;

  startTime = performance.now();

  // Load coordinates (translate by 200, 50)
  for (let i = 0; i < cityCoords.length; i++) {
    citiesHC.push(
      createVector(offSet[0] + cityCoords[i].x, offSet[1] + cityCoords[i].y)
    );
  }

  // Create random initial route
  for (let i = 0; i < citiesHC.length; i++) {
    currentRoute.push(i);
  }
  currentRoute = shuffle(currentRoute);
  bestRoute = currentRoute.slice();
  initialDistanceHC = calcDistanceHC(currentRoute);
  bestDistanceHC = initialDistanceHC;
}

function draw() {
  if (!fileLoaded) return;
  background(255);

  // Draw faded edges between all cities
  // stroke(200, 50);
  // for (let i = 0; i < citiesHC.length; i++) {
  //   for (let j = i + 1; j < citiesHC.length; j++) {
  //     line(citiesHC[i].x, citiesHC[i].y, citiesHC[j].x, citiesHC[j].y);
  //   }
  // }

  fill(0);
  noStroke();
  textSize(24);
  text( "Hill Climb Steepest", 500, 20)
  text( `# of Cities ${citiesHC.length}`, 500, 50)

  noFill();
  strokeWeight(2)
  stroke(0)
  rect(
    offSet[0] - citiesRectMargin[0],
    offSet[1] - citiesRectMargin[1],
    500 + 2 * citiesRectMargin[0],
    500 + 2 * citiesRectMargin[1]
  );

  // Draw the best route (bold and green) with arrows
  stroke(34, 139, 34);
  strokeWeight(2);
  drawRoute(bestRoute, true);

  // Draw the current route (dashed and blue)
  stroke(30, 144, 255);
  strokeWeight(1);
  drawingContext.setLineDash([5, 15]);
  drawRoute(currentRoute, false);
  drawingContext.setLineDash([]); // Reset line dash

  // Draw cities with names
  for (let i = 0; i < citiesHC.length; i++) {
    if (i === currentRoute[0]) fill(34, 139, 34); // Start node - green
    else if (i === currentRoute[currentRoute.length - 1])
      fill(255, 0, 0); // End node - red
    else fill(0);
    ellipse(citiesHC[i].x, citiesHC[i].y, 5, 5);
    textAlign(CENTER, CENTER);
    textSize(16);
    fill(0);
    strokeWeight(1);
    text(cityNames[i], citiesHC[i].x, citiesHC[i].y - 15);
  }

  // Perform hill climbing step
  if (iterationCount < maxIterations) {
    hillClimbingStep();
    iterationCount++;
    bestDistances.push(bestDistanceHC);
  } else {
    noLoop();
    endTime = performance.now();

    console.log(`=== Hill Climbing Steepest (${cityCoords.length} Cities) ===`);
    console.log("Initial Distance:", initialDistanceHC.toFixed(2));
    console.log("Final Best Distance:", bestDistanceHC.toFixed(2));
    console.log("Execution Time (ms):", (endTime - startTime).toFixed(2));
    console.log(
      `Improvement: ${((1 - bestDistanceHC / initialDistanceHC) * 100).toFixed(
        2
      )}%`
    );
    printRouteDetails();
  }

  // Display stats
  fill(0);
  noStroke();
  textSize(16);
  textAlign(LEFT);
  text(`Iteration: ${iterationCount}`, 20, 80);
  text(`Initial Distance: ${initialDistanceHC.toFixed(2)}`, 20, 60);
  text(`Best Distance: ${bestDistanceHC.toFixed(2)}`, 20, 40);
  text(
    `Improvement: ${((1 - bestDistanceHC / initialDistanceHC) * 100).toFixed(
      2
    )}%`,
    20,
    20
  );

  // Improvement graph
  let graphX = 820;
  let graphY = 100;
  let graphW = width - graphX - 20;
  let graphH = height - graphY - 50;

  // Draw graph border
  stroke(0);
  strokeWeight(1);
  noFill();
  rect(graphX, graphY, graphW, graphH);

  // Draw axes labels
  fill(0);
  noStroke();
  textAlign(CENTER);
  textSize(14);
  text("Iterations", graphX + graphW / 2, height - 5);
  push();
  translate(graphX - 30, graphY + graphH / 2);
  rotate(-HALF_PI);
  text("Distance", 0, 0);
  pop();

  // Draw grid lines and values
  stroke(200);
  strokeWeight(1);
  // Vertical grid lines
  for (let i = 0; i <= 4; i++) {
    let x = graphX + (graphW * i) / 4;
    line(x, graphY, x, graphY + graphH);
    text(floor((maxIterations * i) / 4), x, graphY + graphH + 15);
  }
  // Horizontal grid lines
  let maxBestDist = max(bestDistances);
  for (let i = 0; i <= 4; i++) {
    let y = graphY + (graphH * i) / 4;
    line(graphX, y, graphX + graphW, y);
    text(floor(maxBestDist * (1 - i / 4)), graphX - 10, y);
  }

  // Draw improvement line
  noFill();
  stroke(0, 0, 255);
  strokeWeight(2);
  beginShape();
  for (let i = 0; i < bestDistances.length; i++) {
    let x = map(i, 0, maxIterations, graphX, graphX + graphW);
    let y = map(bestDistances[i], 0, maxBestDist, graphY + graphH, graphY);
    vertex(x, y);
    
    // Mark the best iteration point
    if (i === bestIterationFound) {
      push();
      fill(255, 0, 0);
      stroke(0);
      strokeWeight(1);
      ellipse(x, y, 8, 8);
      textAlign(LEFT);
      text(`Best:\nIteration ${bestIterationFound}`, x - 100 , y + 10);
      pop();
    }
  }
  endShape();
}

function drawRoute(route, showArrows) {
  noFill();
  beginShape();
  for (let i = 0; i < route.length; i++) {
    let cityIndex = route[i];
    vertex(citiesHC[cityIndex].x, citiesHC[cityIndex].y);
    if (showArrows && i < route.length - 1) {
      drawArrow(citiesHC[cityIndex], citiesHC[route[i + 1]]);
    }
  }
  vertex(citiesHC[route[0]].x, citiesHC[route[0]].y);
  endShape();
}

function drawArrow(from, to) {
  let angle = atan2(to.y - from.y, to.x - from.x);
  let arrowSize = 8;
  push();
  translate(to.x, to.y);
  rotate(angle);
  fill(34, 139, 34);
  noStroke();
  triangle(0, 0, -arrowSize, arrowSize / 2, -arrowSize, -arrowSize / 2);
  pop();
}

function loadCityCoordsFromFile(filename) {
  loadStrings(filename, (lines) => {
    for (let i = 0; i < lines.length; i++) {
      let coords = lines[i].split(" ");
      if (coords.length === 2) {
        let x = parseFloat(coords[0].trim());
        let y = parseFloat(coords[1].trim());
        cityCoords.push({ x, y });

        // Generate city names (A-Z, then AA, AB, AC, etc.)
        let name = "";
        if (i < 26) {
          name = String.fromCharCode(65 + i);
        } else {
          let firstChar = String.fromCharCode(65 + Math.floor((i - 26) / 26));
          let secondChar = String.fromCharCode(65 + ((i - 26) % 26));
          name = firstChar + secondChar;
        }
        cityNames.push(name);
      }
    }
    fileLoaded = true;
  });
}

function calcDistanceHC(route) {
  let distance = 0;
  for (let i = 0; i < route.length - 1; i++) {
    let cityA = citiesHC[route[i]];
    let cityB = citiesHC[route[i + 1]];
    distance += dist(cityA.x, cityA.y, cityB.x, cityB.y);
  }
  let lastCity = citiesHC[route[route.length - 1]];
  let firstCity = citiesHC[route[0]];
  distance += dist(lastCity.x, lastCity.y, firstCity.x, firstCity.y);
  return distance;
}

function hillClimbingStep() {
  let bestNeighbor = currentRoute.slice();
  let bestNeighborDistance = bestDistanceHC;

  // Explore all possible swaps to find the steepest improvement
  for (let i = 0; i < currentRoute.length - 1; i++) {
    for (let j = i + 1; j < currentRoute.length; j++) {
      let newRoute = currentRoute.slice();
      [newRoute[i], newRoute[j]] = [newRoute[j], newRoute[i]]; // Swap cities

      let newDistance = calcDistanceHC(newRoute);
      if (newDistance < bestNeighborDistance) {
        bestNeighborDistance = newDistance;
        bestNeighbor = newRoute;
      }
    }
  }

  // Move to the best neighbor if it improves the route
  if (bestNeighborDistance < bestDistanceHC) {
    bestDistanceHC = bestNeighborDistance;
    bestRoute = bestNeighbor.slice();
    currentRoute = bestNeighbor;
    if (bestDistanceHC < bestDistances[bestIterationFound]) {
      bestIterationFound = iterationCount;
    }
  }
}


function printRouteDetails() {
  console.log("Route Details:");
  for (let i = 0; i < bestRoute.length; i++) {
    let currentCity = bestRoute[i];
    let nextCity = bestRoute[(i + 1) % bestRoute.length];
    let segmentDistance = dist(
      citiesHC[currentCity].x,
      citiesHC[currentCity].y,
      citiesHC[nextCity].x,
      citiesHC[nextCity].y
    );
    console.log(
      `${cityNames[currentCity]} -> ${
        cityNames[nextCity]
      } : ${segmentDistance.toFixed(2)}`
    );
  }
}
