<template>
  <view class="exercise-container">
    <view class="exercise-header">
      <text class="exercise-title">{{ title }}</text>
      <text class="exercise-description">{{ description }}</text>
    </view>
    
    <view class="exercise-stats">
      <view class="stats-row">
        <text class="stats-label">今日: </text>
        <text class="stats-value">{{ todayStats.accuracy }}% ({{ todayStats.total }}次)</text>
      </view>
      <view class="stats-row">
        <text class="stats-label">总计: </text>
        <text class="stats-value">{{ totalStats.accuracy }}% ({{ totalStats.total }}次)</text>
      </view>
    </view>
    
    <view class="exercise-controls">
      <button class="play-button" @click="playCurrentInterval">
        <text>播放音程</text>
      </button>
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
import statisticsService from '../utils/statisticsService.js';

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
      todayStats: { correct: 0, total: 0, accuracy: 0 },
      totalStats: { correct: 0, total: 0, accuracy: 0 }
    };
  },
  
  created() {
    this.loadStats();
    this.generateExercise();
  },
  
  methods: {
    loadStats() {
      const summary = statisticsService.getStatsSummary();
      
      // 获取特定分类的统计数据
      const categoryKey = `${this.category}_${this.isHarmonic ? 'harmonic' : 'melodic'}`;
      const allStats = uni.getStorageSync('all_training_stats') || {};
      const today = new Date().toISOString().split('T')[0];
      
      // 今日详细统计数据
      if (allStats[today] && 
          allStats[today]['intervals_details'] && 
          allStats[today]['intervals_details'][categoryKey]) {
        const details = allStats[today]['intervals_details'][categoryKey];
        this.todayStats = {
          correct: details.correct,
          total: details.total,
          accuracy: details.total > 0 ? Math.round((details.correct / details.total) * 100) : 0
        };
      } else {
        this.todayStats = { correct: 0, total: 0, accuracy: 0 };
      }
      
      // 总体音程训练统计
      this.totalStats = {
        correct: summary.total.intervals.correct,
        total: summary.total.intervals.total,
        accuracy: summary.total.intervals.accuracy
      };
    },
    
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
      
      // 记录训练结果
      statisticsService.recordTrainingResult(
        'intervals',     // 训练类型
        this.category,   // 训练分类
        this.isHarmonic, // 是否为和声音程
        this.isCorrect   // 是否回答正确
      );
      
      // 重新加载统计数据
      this.loadStats();
    },
    
    nextExercise() {
      this.generateExercise();
    }
  }
};
</script>

<style>
.exercise-container {
  padding: 20px;
}

.exercise-header {
  margin-bottom: 20px;
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

.exercise-stats {
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 20px;
}

.stats-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.stats-label {
  font-size: 14px;
  color: #666;
}

.stats-value {
  font-size: 14px;
  font-weight: bold;
  color: #333;
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