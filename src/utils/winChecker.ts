import { ITicket } from '../models/ticket.model.js';

// Helper to flatten the 3x9 grid into a single array of numbers (excluding 0s)
const getFlatNumbers = (matrix: number[][]) => matrix.flat().filter(n => n !== 0);

// Helper to get specific row numbers
const getRowNumbers = (matrix: number[][], rowIndex: number) => matrix[rowIndex].filter(n => n !== 0);

// Helper to check if all target numbers exist in the marked numbers array
const hasAllNumbers = (targetNumbers: number[], markedNumbers: number[]) => {
  return targetNumbers.every(num => markedNumbers.includes(num));
};

export const checkTicketWin = (ticket: ITicket, pattern: string, calledNumbers: number[]): boolean => {
  // We use calledNumbers from the game, or rely on ticket.markedNumbers if you are updating that reliably.
  // Ideally, use the Game's calledNumbers to be secure against client-side tampering.

  const marked = ticket.markedNumbers; // Assuming this is up to date

  switch (pattern) {
    case 'full_house':
      // All 15 numbers must be marked
      const allNums = getFlatNumbers(ticket.numbers);
      return hasAllNumbers(allNums, marked);

    case 'top_line': // First Row
    case 'first_row':
      const row1 = getRowNumbers(ticket.numbers, 0);
      return hasAllNumbers(row1, marked);

    case 'middle_line': // Second Row
    case 'second_row':
      const row2 = getRowNumbers(ticket.numbers, 1);
      return hasAllNumbers(row2, marked);

    case 'bottom_line': // Third Row
    case 'third_row':
      const row3 = getRowNumbers(ticket.numbers, 2);
      return hasAllNumbers(row3, marked);

    case 'corners':
      // 1st and last number of top and bottom rows
      const r1 = getRowNumbers(ticket.numbers, 0);
      const r3 = getRowNumbers(ticket.numbers, 2);
      const corners = [r1[0], r1[r1.length - 1], r3[0], r3[r3.length - 1]];
      return hasAllNumbers(corners, marked);

    case 'early_five':
      // Any 5 numbers marked
      return marked.length >= 5;

    default:
      return false;
  }
};