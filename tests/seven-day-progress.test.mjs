import assert from 'node:assert/strict';
import {progressSummary} from '../seven-day-progress.mjs';

assert.deepEqual(progressSummary({day:3,stages:{d1:[true,true,true],d2:[true,false,false]},exams:[{day:1,score:100}]}),{day:3,completedStages:4,totalStages:21,passedDays:1,percent:19});
console.log('seven-day progress: summarized');
