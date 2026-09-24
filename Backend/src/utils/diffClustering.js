/**
 * Clusters visual diff pixels into human-readable bounding boxes
 * @param {Uint8Array|Buffer} diffData - RGBA pixel buffer of the diff image
 * @param {number} width - image width
 * @param {number} height - image height
 * @param {Object} options - clustering parameters
 * @returns {Array<{ x: number, y: number, width: number, height: number, area: number, differencePercentage: number }>}
 */
export const detectDifferenceRegions = (diffData, width, height, options = {}) => {
  const {
    gridSize = 8,           // grid cell size for fast spatial clustering
    mergeGap = 28,          // distance to merge nearby bounding boxes
    minRegionArea = 120,    // filter out noise / antialiasing speckles
    diffThreshold = 20,     // color difference threshold for red highlight
  } = options;

  if (!diffData || width <= 0 || height <= 0) {
    return [];
  }

  // 1. Identify grid cells that contain difference pixels (pixelmatch produces red/yellow diff pixels)
  const gridW = Math.ceil(width / gridSize);
  const gridH = Math.ceil(height / gridSize);
  const grid = new Uint8Array(gridW * gridH);

  let totalDiffPixels = 0;

  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const idx = (y * width + x) * 4;
      const r = diffData[idx];
      const g = diffData[idx + 1];
      const b = diffData[idx + 2];
      const a = diffData[idx + 3];

      // Pixelmatch highlights differences in red (r is high, g & b are low) or colored overlay
      const isDiff = a > 50 && (r > 180 && g < 100 && b < 100 || (r > 200 && g > 150 && b < 50));

      if (isDiff) {
        totalDiffPixels++;
        const gx = Math.floor(x / gridSize);
        const gy = Math.floor(y / gridSize);
        if (gx < gridW && gy < gridH) {
          grid[gy * gridW + gx] = 1;
        }
      }
    }
  }

  if (totalDiffPixels === 0) {
    return [];
  }

  // 2. Find connected components on the grid
  const visited = new Uint8Array(gridW * gridH);
  const rawBoxes = [];

  const getNeighbors = (gx, gy) => {
    const list = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = gx + dx;
        const ny = gy + dy;
        if (nx >= 0 && nx < gridW && ny >= 0 && ny < gridH) {
          list.push([nx, ny]);
        }
      }
    }
    return list;
  };

  for (let gy = 0; gy < gridH; gy++) {
    for (let gx = 0; gx < gridW; gx++) {
      const gIndex = gy * gridW + gx;
      if (grid[gIndex] === 1 && !visited[gIndex]) {
        // BFS component expansion
        visited[gIndex] = 1;
        const queue = [[gx, gy]];
        let minX = gx * gridSize;
        let maxX = (gx + 1) * gridSize;
        let minY = gy * gridSize;
        let maxY = (gy + 1) * gridSize;
        let cellCount = 0;

        while (queue.length > 0) {
          const [cx, cy] = queue.shift();
          cellCount++;

          const px0 = cx * gridSize;
          const px1 = (cx + 1) * gridSize;
          const py0 = cy * gridSize;
          const py1 = (cy + 1) * gridSize;

          if (px0 < minX) minX = px0;
          if (px1 > maxX) maxX = px1;
          if (py0 < minY) minY = py0;
          if (py1 > maxY) maxY = py1;

          const neighbors = getNeighbors(cx, cy);
          for (const [nx, ny] of neighbors) {
            const nIndex = ny * gridW + nx;
            if (grid[nIndex] === 1 && !visited[nIndex]) {
              visited[nIndex] = 1;
              queue.push([nx, ny]);
            }
          }
        }

        const bWidth = Math.min(width, maxX) - minX;
        const bHeight = Math.min(height, maxY) - minY;
        const area = bWidth * bHeight;

        if (area >= minRegionArea) {
          rawBoxes.push({
            minX,
            minY,
            maxX: Math.min(width, maxX),
            maxY: Math.min(height, maxY),
            area,
          });
        }
      }
    }
  }

  // 3. Merge overlapping or closely adjacent boxes within mergeGap
  const merged = [];
  const mergedFlags = new Array(rawBoxes.length).fill(false);

  for (let i = 0; i < rawBoxes.length; i++) {
    if (mergedFlags[i]) continue;

    let current = { ...rawBoxes[i] };
    mergedFlags[i] = true;

    let expanded = true;
    while (expanded) {
      expanded = false;
      for (let j = 0; j < rawBoxes.length; j++) {
        if (mergedFlags[j]) continue;
        const other = rawBoxes[j];

        // Check if boxes are within mergeGap
        const overlapsOrNear =
          current.minX - mergeGap <= other.maxX &&
          current.maxX + mergeGap >= other.minX &&
          current.minY - mergeGap <= other.maxY &&
          current.maxY + mergeGap >= other.minY;

        if (overlapsOrNear) {
          current.minX = Math.min(current.minX, other.minX);
          current.minY = Math.min(current.minY, other.minY);
          current.maxX = Math.max(current.maxX, other.maxX);
          current.maxY = Math.max(current.maxY, other.maxY);
          current.area = (current.maxX - current.minX) * (current.maxY - current.minY);
          mergedFlags[j] = true;
          expanded = true;
        }
      }
    }

    merged.push(current);
  }

  // 4. Format into final coordinates
  const totalImagePixels = width * height;

  const result = merged
    .map((box) => {
      const bWidth = box.maxX - box.minX;
      const bHeight = box.maxY - box.minY;
      const area = bWidth * bHeight;
      const differencePercentage = parseFloat(((area / totalImagePixels) * 100).toFixed(2));

      return {
        x: box.minX,
        y: box.minY,
        width: bWidth,
        height: bHeight,
        area,
        differencePercentage,
      };
    })
    .filter((box) => box.area >= minRegionArea)
    .sort((a, b) => b.area - a.area);

  return result.slice(0, 15); // Return top 15 most prominent visual difference regions
};
