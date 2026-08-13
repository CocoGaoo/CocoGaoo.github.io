import assert from 'node:assert/strict';
import {gradeExam} from '../seven-day-exam.mjs';

const quiz=[
  {id:'a',type:'listening',answer:1,explanation:'A'},
  {id:'b',type:'speaking',answer:0,explanation:'B'},
  {id:'c',type:'reading',answer:2,explanation:'C'},
  {id:'d',type:'writing',answer:0,explanation:'D'},
];
const pass=gradeExam(quiz,{a:1,b:0,c:2,d:0});
assert.equal(pass.score,100);
assert.equal(pass.passed,true);
assert.deepEqual(pass.completed.sort(),['listening','reading','speaking','writing']);
const fail=gradeExam(quiz,{a:1,b:0,c:1,d:0});
assert.equal(fail.score,75);
assert.equal(fail.passed,false);
assert.equal(fail.details[2].correct,false);
assert.equal(fail.details[2].explanation,'C');
console.log('seven-day exam: scored and explained');
