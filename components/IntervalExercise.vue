<template>
  <view class="exercise-container">
    <view class="exercise-header">
      <text class="exercise-title">{{ title }}</text>
      <text class="exercise-description">{{ description }}</text>
    </view>
    
    <view class="exercise-controls">
      <button class="play-button" @click="playCurrentInterval">
        <text>播放音程</text>
      </button>
      
      <view class="score-display">
        <text class="score-text">得分: {{ score }} / {{ totalAttempts }}</text>
      </view>
    </view>
    
    <view class="answer-options">
      <view v-for="(option, index) in answerOptions" :key="index" 
            class="answer-option" 
            :class="{ 'selected': selectedAnswer === option, 'correct': showResult && option === correctAnswer, 'incorrect': showResult && selectedAnswer === option && option !== correctAnswer }"
            @click="selectAnswer(option)">
        <text>{{ option }}</text>
      </view>
    </view>
    
    <view v-if="showResult" class="result-feedback">
      <text :class="isCorrect ? 'correct-text' : 'incorrect-text'">
        {{ isCorrect ? '正确!' : '错误! 正确答案是: ' + correctAnswer }}
      </text>
      <text v-if="!isHarmonic" class="direction-text">
        {{ currentExercise.isAscending ? '上行音程' : '下行音程' }}
      </text>
      
      <!-- 显示音高信息 -->
      <view class="pitch-info">
        <text class="pitch-text">音高: {{ currentExercise.firstNote }} - {{ currentExercise.secondNote }}</text>
        
        <!-- 和声音程的分离播放按钮 -->
        <view v-if="isHarmonic" class="separate-play-controls">
          <button class="separate-play-button" @click="playFirstNote">
            <text>播放第一个音</text>
          </button>
          <button class="separate-play-button" @click="playSecondNote">
            <text>播放第二个音</text>
          </button>
        </view>
      </view>
      
      <button class="next-button" @click="nextExercise">
        <text>下一题</text>
      </button>
    </view>
  </view>
</template>

<script>
import audioService from '../utils/audioService.js';

export default {
  props: {
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: '听音辨别音程'
    },
    category: {
      type: String,
      required: true
    },
    isHarmonic: {
      type: Boolean,
      default: true
    }
  },
  
  data() {
    return {
      currentExercise: null,
      answerOptions: [],
      selectedAnswer: null,
      correctAnswer: null,
      showResult: false,
      isCorrect: false,
      score: 0,
      totalAttempts: 0
    };
  },
  
  created() {
    this.generateExercise();
  },
  
  methods: {
    generateExercise() {
      // Get intervals for the current category
      const intervalTypes = audioService.getIntervalsForCategory(this.category, this.isHarmonic);
      
      // Generate a random exercise
      this.currentExercise = audioService.generateIntervalExercise(intervalTypes, this.isHarmonic);
      this.correctAnswer = this.currentExercise.intervalType;
      
      // Reset state
      this.selectedAnswer = null;
      this.showResult = false;
      
      // Generate answer options (include the correct answer and some distractors)
      this.generateAnswerOptions();
    },
    
    generateAnswerOptions() {
      // 获取当前类别的所有音程类型
      const categoryIntervals = audioService.getIntervalsForCategory(this.category, this.isHarmonic);
      
      // 直接使用当前类别的所有音程作为选项
      this.answerOptions = this.shuffleArray([...categoryIntervals]);
    },
    
    shuffleArray(array) {
      const newArray = [...array];
      for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
      }
      return newArray;
    },
    
    playCurrentInterval() {
      if (!this.currentExercise) return;
      
      const { firstNote, secondNote, playFunction } = this.currentExercise;
      playFunction(firstNote, secondNote);
    },
    
    // 播放第一个音符
    playFirstNote() {
      if (this.currentExercise) {
        audioService.playNote(this.currentExercise.firstNote);
      }
    },
    
    // 播放第二个音符
    playSecondNote() {
      if (this.currentExercise) {
        audioService.playNote(this.currentExercise.secondNote);
      }
    },
    
    selectAnswer(answer) {
      if (this.showResult) return; // Prevent changing answer after result is shown
      
      this.selectedAnswer = answer;
      this.showResult = true;
      this.isCorrect = answer === this.correctAnswer;
      
      // Update score
      this.totalAttempts++;
      if (this.isCorrect) {
        this.score++;
      }
    },
    
    nextExercise() {
      this.generateExercise();
    },
    
    // 获取随机音程
    getRandomInterval() {
      // 获取当前类别的所有音程
      const intervals = audioService.getIntervalsForCategory(this.category);
      
      // 获取所有可用的基础音符
      const availableNotes = Object.keys(audioService.NOTE_FREQUENCIES);
      
      // 随机选择一个基础音符
      const baseNote = availableNotes[Math.floor(Math.random() * availableNotes.length)];
      
      // 随机选择一个音程
      const interval = intervals[Math.floor(Math.random() * intervals.length)];
      
      // 随机决定是上行还是下行（仅用于旋律音程）
      const isAscending = Math.random() > 0.5;
      
      // 检查音程是否在范围内
      const baseIndex = availableNotes.indexOf(baseNote);
      const semitones = audioService.INTERVALS[interval];
      
      // 如果是上行音程，检查是否超出范围
      if (isAscending && baseIndex + semitones >= availableNotes.length) {
        // 如果超出范围，改为下行
        return this.getRandomInterval();
      }
      
      // 如果是下行音程，检查是否超出范围
      if (!isAscending && baseIndex - semitones < 0) {
        // 如果超出范围，改为上行
        return this.getRandomInterval();
      }
      
      return {
        baseNote,
        interval,
        isAscending
      };
    }
  }
};
</script>

<style>
.exercise-container {
  padding: 20px;
}

.exercise-header {
  margin-bottom: 30px;
  text-align: center;
}

.exercise-title {
  font-size: 22px;
  font-weight: bold;
  margin-bottom: 10px;
}

.exercise-description {
  font-size: 16px;
  color: #666;
}

.exercise-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30px;
}

.play-button {
  background-color: #4CAF50;
  padding: 12px 24px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.play-button text {
  color: white;
  font-size: 18px;
}

.score-display {
  margin-top: 10px;
}

.score-text {
  font-size: 16px;
  color: #333;
}

.answer-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 30px;
}

.answer-option {
  padding: 15px;
  border-radius: 8px;
  background-color: #f0f0f0;
  text-align: center;
}

.selected {
  background-color: #2196F3;
}

.selected text {
  color: white;
}

.correct {
  background-color: #4CAF50;
}

.correct text {
  color: white;
}

.incorrect {
  background-color: #F44336;
}

.incorrect text {
  color: white;
}

.result-feedback {
  text-align: center;
  margin-top: 20px;
}

.correct-text {
  color: #4CAF50;
  font-size: 18px;
  font-weight: bold;
}

.incorrect-text {
  color: #F44336;
  font-size: 18px;
  font-weight: bold;
}

.direction-text {
  display: block;
  margin: 10px 0;
  color: #666;
  font-size: 16px;
}

.pitch-info {
  margin: 20px 0;
  padding: 15px;
  background-color: #f8f8f8;
  border-radius: 8px;
}

.pitch-text {
  display: block;
  font-size: 16px;
  color: #333;
  margin-bottom: 15px;
}

.separate-play-controls {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 10px;
}

.separate-play-button {
  background-color: #2196F3;
  padding: 8px 16px;
  border-radius: 6px;
}

.separate-play-button text {
  color: white;
  font-size: 14px;
}

.next-button {
  background-color: #2196F3;
  padding: 10px 20px;
  border-radius: 8px;
  margin-top: 15px;
}

.next-button text {
  color: white;
  font-size: 16px;
}
</style> 