let cityCoords = [];
let cityNames = [];
let citiesGA = [];
let offSet = [50, 150];
let citiesRectMargin = [10, 10];
let fileLoaded = false;

// Genetic Algorithm Parameters
let populationSize = 1000;
let mutationRate = 0.05;
let maxGenerations = 2000;
let crossoverRate = 0.8;
let elitismCount = 1; // Number of best individuals to preserve

let population = [];
let fitness = [];
let bestRoute = [];
let bestDistanceGA = Infinity;
let initialDistanceGA = Infinity;
let generationCount = 0;

// Metrics
let startTime, endTime;
let bestDistances = [];

// Additional tracking for best fitness values
let bestFitness = 0;
let bestFitnessHistory = [];

function preload() {
  loadCityCoordsFromFile("coordinates_20.txt");
}

function setup() {
  createCanvas(1500, 800);
  if (!fileLoaded) return;

  startTime = performance.now();

  // Adjust coordinates based on offsets
  for (let i = 0; i < cityCoords.length; i++) {
    citiesGA.push(
      createVector(offSet[0] + cityCoords[i].x, offSet[1] + cityCoords[i].y)
    );
  }

  // Initialize population with random routes
  for (let i = 0; i < populationSize; i++) {
    let route = Array.from({ length: citiesGA.length }, (_, i) => i);
    shuffle(route, true);
    population.push(route);
  }

  // Calculate initial fitness and determine best initial route
  calculateFitness();
  let bestInitialIndex = fitness.indexOf(Math.max(...fitness));
  bestRoute = population[bestInitialIndex].slice();
  initialDistanceGA = calcDistanceGA(bestRoute);
  bestDistanceGA = initialDistanceGA;
  bestFitness = Math.max(...fitness);
  bestFitnessHistory.push(bestFitness);
}

function draw() {
  if (!fileLoaded) return;
  background(255);

  fill(0);
  noStroke();
  textSize(24);
  text( "Genetic Algorithm", 500, 20)
  text( `# of Cities ${citiesGA.length}`, 500, 50)

  // Draw the border around the cities area
  noFill();
  strokeWeight(2)
  stroke(0)
  rect(
    offSet[0] - citiesRectMargin[0],
    offSet[1] - citiesRectMargin[1],
    500 + 2 * citiesRectMargin[0],
    500 + 2 * citiesRectMargin[1]
  );

  // Draw the best route with arrows (green and bold)
  stroke(34, 139, 34);
  strokeWeight(2);
  drawRoute(bestRoute, true);

  // Draw the cities and their names
  for (let i = 0; i < citiesGA.length; i++) {
    fill(0);
    ellipse(citiesGA[i].x, citiesGA[i].y, 5, 5);
    textAlign(CENTER, CENTER);
    textSize(16);
    fill(0);
    strokeWeight(1);
    text(cityNames[i], citiesGA[i].x, citiesGA[i].y - 15);
  }

  // Display statistics on screen
  fill(0);
  textSize(16);
  noStroke();

  textAlign(LEFT);
  text(`Generation: ${generationCount}`, 20, 80);
  text(`Initial Distance: ${initialDistanceGA.toFixed(2)}`, 20, 60);
  text(`Best Distance: ${bestDistanceGA.toFixed(2)}`, 20, 40);
  text(
    `Improvement: ${((1 - bestDistanceGA / initialDistanceGA) * 100).toFixed(2)}%`,
    20,
    20
  );

  // Draw the improvement graph
  let graphX = 820;
  let graphY = 100;
  let graphW = width - graphX - 20;
  let graphH = height - graphY - 50;

  stroke(0);
  strokeWeight(1);
  noFill();
  rect(graphX, graphY, graphW, graphH);

  fill(0);
  noStroke();
  textAlign(CENTER);
  textSize(14);
  text("Generations", graphX + graphW / 2, height - 5);
  push();
  translate(graphX - 30, graphY + graphH / 2);
  rotate(-HALF_PI);
  text("Distance", 0, 0);
  pop();

  // Draw grid lines
  stroke(200);
  strokeWeight(1);
  for (let i = 0; i <= 4; i++) {
    let x = graphX + (graphW * i) / 4;
    line(x, graphY, x, graphY + graphH);
    text(floor((maxGenerations * i) / 4), x, graphY + graphH + 15);
  }
  let maxDistance = initialDistanceGA;
  for (let i = 0; i <= 4; i++) {
    let y = graphY + (graphH * i) / 4;
    line(graphX, y, graphX + graphW, y);
    text((maxDistance * (1 - i / 4)).toFixed(2), graphX - 10, y);
  }

  // Draw the line chart showing best distance improvement
  noFill();
  stroke(0, 0, 255);
  strokeWeight(2);
  beginShape();
  for (let i = 0; i < bestDistances.length; i++) {
    let x = map(i, 0, maxGenerations, graphX, graphX + graphW);
    let y = map(bestDistances[i], 0, maxDistance, graphY + graphH, graphY);
    vertex(x, y);
  }
  endShape();

  // Run the genetic algorithm for the next generation
  if (generationCount < maxGenerations) {
    nextGeneration();
    generationCount++;
    bestDistances.push(bestDistanceGA);
  } else {
    noLoop();
    endTime = performance.now();

    console.log(`=== Genetic Algorithm (${cityCoords.length} Cities) ===`);
    console.log("Initial Distance:", initialDistanceGA.toFixed(2));
    console.log("Final Best Distance:", bestDistanceGA.toFixed(2));
    console.log("Execution Time (ms):", (endTime - startTime).toFixed(2));
    console.log(
      `Improvement: ${((1 - bestDistanceGA / initialDistanceGA) * 100).toFixed(
        2
      )}%`
    );
  }
}

// Calculate fitness values for the entire population
function calculateFitness() {
  let distances = population.map((route) => calcDistanceGA(route));
  let maxDist = Math.max(...distances.filter(d => d !== Infinity));

  // Calculate fitness as the inverse of distance (shorter is better)
  fitness = distances.map((dist) => {
    if (dist === Infinity || isNaN(dist)) return 0;
    return maxDist / dist;
  });

  // Normalize fitness values so they sum to 1
  let totalFitness = fitness.reduce((a, b) => a + b, 0);
  if (totalFitness > 0) {
    fitness = fitness.map((f) => f / totalFitness);
  } else {
    console.error("Total fitness is 0!");
    fitness = Array(fitness.length).fill(1 / fitness.length);
  }

  // Update the best route and best distance if a new best is found
  let bestFitnessIndex = fitness.indexOf(Math.max(...fitness));
  let currentBestDistance = distances[bestFitnessIndex];
  if (currentBestDistance < bestDistanceGA) {
    bestDistanceGA = currentBestDistance;
    bestRoute = population[bestFitnessIndex].slice();
  }

  // Track best fitness history
  bestFitness = Math.max(...fitness);
  bestFitnessHistory.push(bestFitness);
}

// Create the next generation using selection, crossover, mutation, and elitism
function nextGeneration() {
  let newPopulation = [];

  // --- Elitism: Preserve the best individuals ---
  // Find indices of the best individuals
  let sortedIndices = fitness
    .map((fit, idx) => ({ fit, idx }))
    .sort((a, b) => b.fit - a.fit)
    .map(obj => obj.idx);
  for (let i = 0; i < elitismCount; i++) {
    newPopulation.push(population[sortedIndices[i]].slice());
  }

  // Generate the rest of the population
  for (let i = elitismCount; i < populationSize; i++) {
    let parentA = selectParent();
    let parentB = selectParent();
    let child;
    if (random(1) < crossoverRate) {
      child = crossover(parentA, parentB);
    } else {
      child = parentA.slice();
    }
    mutate(child);
    newPopulation.push(child);
  }

  population = newPopulation;
  calculateFitness();

  // Update the best route from the new population
  let currentBest = population[fitness.indexOf(Math.max(...fitness))].slice();
  let currentBestDistance = calcDistanceGA(currentBest);
  if (currentBestDistance < bestDistanceGA) {
    bestRoute = currentBest;
    bestDistanceGA = currentBestDistance;
  }
}

// Roulette wheel selection based on normalized fitness
function selectParent() {
  let index = 0;
  let r = random(1);
  while (r > 0) {
    r -= fitness[index];
    index++;
  }
  return population[index - 1].slice();
}

// Order-based crossover: take a subsequence from parentA and fill remaining positions from parentB
function crossover(parentA, parentB) {
  let start = floor(random(parentA.length));
  let end = floor(random(start + 1, parentA.length));
  let child = Array(parentA.length).fill(-1);

  for (let i = start; i < end; i++) {
    child[i] = parentA[i];
  }

  let fillIndex = 0;
  for (let i = 0; i < parentB.length; i++) {
    if (!child.includes(parentB[i])) {
      while (child[fillIndex] !== -1) fillIndex++;
      child[fillIndex] = parentB[i];
    }
  }
  return child;
}

// Swap mutation: swap two cities in the route with a given probability
function mutate(route) {
  for (let i = 0; i < route.length; i++) {
    if (random(1) < mutationRate) {
      let j = floor(random(route.length));
      [route[i], route[j]] = [route[j], route[i]];
    }
  }
}

// Calculate the total distance of a given route (TSP tour)
function calcDistanceGA(route) {
  if (!route || route.length < 2) return Infinity;
  let distance = 0;
  try {
    for (let i = 0; i < route.length - 1; i++) {
      let cityA = citiesGA[route[i]];
      let cityB = citiesGA[route[i + 1]];
      if (!cityA || !cityB) {
        console.error("Invalid city index:", route[i], route[i + 1]);
        return Infinity;
      }
      distance += dist(cityA.x, cityA.y, cityB.x, cityB.y);
    }
    // Complete the tour by returning to the start
    let lastCity = citiesGA[route[route.length - 1]];
    let firstCity = citiesGA[route[0]];
    distance += dist(lastCity.x, lastCity.y, firstCity.x, firstCity.y);
    if (isNaN(distance)) {
      console.error("NaN distance detected for route:", route);
      return Infinity;
    }
    return distance;
  } catch (error) {
    console.error("Error calculating distance:", error);
    return Infinity;
  }
}

// Draw the route as a series of connected vertices with optional arrows indicating direction
function drawRoute(route, showArrows) {
  noFill();
  beginShape();
  for (let i = 0; i < route.length; i++) {
    let cityIndex = route[i];
    vertex(citiesGA[cityIndex].x, citiesGA[cityIndex].y);
    if (showArrows && i < route.length - 1) {
      drawArrow(citiesGA[cityIndex], citiesGA[route[i + 1]]);
    }
  }
  vertex(citiesGA[route[0]].x, citiesGA[route[0]].y);
  endShape();
}

// Draw an arrow from one city to the next to indicate the route direction
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

// Load city coordinates and generate city names (A-Z, then AA, AB, etc.)
function loadCityCoordsFromFile(filename) {
  loadStrings(filename, (lines) => {
    for (let i = 0; i < lines.length; i++) {
      let coords = lines[i].split(" ");
      if (coords.length === 2) {
        let x = parseFloat(coords[0].trim());
        let y = parseFloat(coords[1].trim());
        cityCoords.push({ x, y });
        let name =
          i < 26
            ? String.fromCharCode(65 + i)
            : String.fromCharCode(65 + Math.floor((i - 26) / 26)) +
              String.fromCharCode(65 + ((i - 26) % 26));
        cityNames.push(name);
      }
    }
    fileLoaded = true;
  });
}