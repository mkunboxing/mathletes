// server/services/mathService.js
class MathService {
    generateProblem(difficulty = 'easy') {
      const types = ['addition', 'subtraction', 'multiplication', 'division'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      let operand1, operand2, answer;
      
      switch (type) {
        case 'addition':
          operand1 = Math.floor(Math.random() * 50) + 1;
          operand2 = Math.floor(Math.random() * 50) + 1;
          answer = operand1 + operand2;
          break;
        case 'subtraction':
          operand1 = Math.floor(Math.random() * 50) + 50; // Ensure positive result
          operand2 = Math.floor(Math.random() * operand1);
          answer = operand1 - operand2;
          break;
        case 'multiplication':
          operand1 = Math.floor(Math.random() * 12) + 1;
          operand2 = Math.floor(Math.random() * 12) + 1;
          answer = operand1 * operand2;
          break;
        case 'division':
          operand2 = Math.floor(Math.random() * 10) + 1;
          answer = Math.floor(Math.random() * 10) + 1;
          operand1 = operand2 * answer; // Ensure clean division
          break;
      }
      
      return {
        type,
        operand1,
        operand2,
        answer
      };
    }
  }
  
  module.exports = new MathService();