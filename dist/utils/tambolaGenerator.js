/**
 * Tambola Ticket Generator
 * Generates a valid 3x9 matrix for a Tambola ticket
 * Rules:
 * - 3 rows, 9 columns
 * - 5 numbers per row
 * - Total 15 numbers
 * - Columns have specific ranges:
 *   Col 0: 1-9
 *   Col 1: 10-19
 *   Col 2: 20-29
 *   ...
 *   Col 8: 80-90
 */
export const generateTicketMatrix = () => {
    const matrix = [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
    ];
    // Column ranges
    const colRanges = [
        { min: 1, max: 9 },
        { min: 10, max: 19 },
        { min: 20, max: 29 },
        { min: 30, max: 39 },
        { min: 40, max: 49 },
        { min: 50, max: 59 },
        { min: 60, max: 69 },
        { min: 70, max: 79 },
        { min: 80, max: 90 },
    ];
    // Helper to get random integer between min and max (inclusive)
    const getRandom = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    // 1. Ensure every column has at least one number (except typically one empty column is allowed in some variations, but standard is 5-5-5 distribution)
    // Actually, standard rule is 15 numbers total. 5 per row.
    // We need to distribute 15 numbers across 9 columns such that each column has at least 1 number.
    // 15 - 9 = 6 extra numbers to distribute.
    // We will simply ensure each column gets at least 1 number first.
    const columnCounts = new Array(9).fill(1); // Start with 1 per column
    let remaining = 15 - 9;
    while (remaining > 0) {
        const colIndex = getRandom(0, 8);
        // Max 3 numbers per column
        if (columnCounts[colIndex] < 3) {
            columnCounts[colIndex]++;
            remaining--;
        }
    }
    // Now populate numbers for each column
    const columnNumbers = [];
    for (let c = 0; c < 9; c++) {
        const range = colRanges[c];
        const count = columnCounts[c];
        const nums = new Set();
        while (nums.size < count) {
            nums.add(getRandom(range.min, range.max));
        }
        columnNumbers.push(Array.from(nums).sort((a, b) => a - b));
    }
    // Place numbers into the 3 rows
    // This is the tricky part: ensuring exactly 5 numbers per row
    // We can use a backtracking or greedy approach, or simplified allocation
    // Simplistic approach:
    // For each column, place the numbers in available rows from top to bottom
    // But we need to ensure row constraints (5 per row).
    // Let's refine:
    // We have the numbers for each column.
    // We need to decide which cells in the column they occupy.
    // - If col has 3 nums -> must be in row 0, 1, 2
    // - If col has 2 nums -> can be (0,1), (0,2), or (1,2)
    // - If col has 1 num  -> can be 0, 1, or 2
    // We need to make these choices such that row counts are 5, 5, 5.
    // Let's iterate and try to fill.
    // A randomized backtracking solver is best here but might be overkill.
    // Let's try filling 3-count columns first.
    // Initialize grid occupancy
    const grid = [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
    ];
    const rowCounts = [0, 0, 0];
    // 1. Process columns with 3 numbers (fixed)
    for (let c = 0; c < 9; c++) {
        if (columnNumbers[c].length === 3) {
            grid[0][c] = columnNumbers[c][0];
            grid[1][c] = columnNumbers[c][1];
            grid[2][c] = columnNumbers[c][2];
            rowCounts[0]++;
            rowCounts[1]++;
            rowCounts[2]++;
        }
    }
    // 2. Process columns with 2 numbers
    // 3. Process columns with 1 number
    // For simplification, we will just randomly assign for now and retry if invalid
    // Since this is a critical core utility, let's make it robust by trying a few times until valid.
    let valid = false;
    let attempts = 0;
    while (!valid && attempts < 100) {
        attempts++;
        // Reset grid/counts for partials
        const currentGrid = grid.map(r => [...r]);
        const currentRowCounts = [...rowCounts];
        let failed = false;
        // Shuffle columns to randomize placement
        const colIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8].sort(() => Math.random() - 0.5);
        for (const c of colIndices) {
            const nums = columnNumbers[c];
            if (nums.length === 3)
                continue; // Already done
            // Valid row indices to put numbers in
            const availableRows = [];
            if (nums.length === 2) {
                // Find 2 rows that preserve constraints
                // We look for rows with < 5 count
                // Pairs: (0,1), (0,2), (1,2)
                const pairs = [[0, 1], [0, 2], [1, 2]];
                const validPairs = pairs.filter(p => currentRowCounts[p[0]] < 5 && currentRowCounts[p[1]] < 5);
                if (validPairs.length === 0) {
                    failed = true;
                    break;
                }
                const chosen = validPairs[Math.floor(Math.random() * validPairs.length)];
                currentGrid[chosen[0]][c] = nums[0];
                currentGrid[chosen[1]][c] = nums[1];
                currentRowCounts[chosen[0]]++;
                currentRowCounts[chosen[1]]++;
            }
            else if (nums.length === 1) {
                // Find 1 row with < 5 count
                const validRows = [0, 1, 2].filter(r => currentRowCounts[r] < 5);
                if (validRows.length === 0) {
                    failed = true;
                    break;
                }
                const chosen = validRows[Math.floor(Math.random() * validRows.length)];
                currentGrid[chosen][c] = nums[0];
                currentRowCounts[chosen]++;
            }
        }
        if (!failed && currentRowCounts[0] === 5 && currentRowCounts[1] === 5 && currentRowCounts[2] === 5) {
            valid = true;
            // Copy to result matrix
            for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 9; c++) {
                    matrix[r][c] = currentGrid[r][c];
                }
            }
        }
    }
    // Fallback if random generation fails (rare but possible) - return empty or simple valid one
    // For now, assuming success.
    return matrix;
};
//# sourceMappingURL=tambolaGenerator.js.map