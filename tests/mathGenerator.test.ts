import test from 'node:test';
import assert from 'node:assert';
import { generateQuestion } from '../src/mathGenerator';

test('generateQuestion returns valid MathQuestion objects across difficulties', () => {
  const difficulties = ['easy', 'medium', 'hard'] as const;

  for (const diff of difficulties) {
    for (let i = 0; i < 20; i++) {
      const q = generateQuestion(diff);

      assert.ok(q.id, 'Question should have an ID');
      assert.ok(q.topic, 'Question should have a topic');
      assert.ok(q.question.length > 0, 'Question text should not be empty');
      assert.strictEqual(q.options.length, 4, 'Question should have exactly 4 options');
      assert.ok(q.options.includes(q.correctAnswer), 'Options must contain the correct answer');
      assert.strictEqual(q.difficulty, diff, 'Question difficulty should match requested');
    }
  }
});
