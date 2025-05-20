/**
 * 统计服务 - 用于保存和计算训练数据
 * 包括按日期保存训练数据，计算今日和总的准确率及训练次数
 */

// 获取当前日期的字符串，格式为 YYYY-MM-DD
function getCurrentDateString() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * 获取默认的 stats 空对象结构（用于 data() 初始化）
 */
function getDefaultStats() {
  return {
    today: {
      intervals: { correct: 0, total: 0, accuracy: 0 },
      triads: { correct: 0, total: 0, accuracy: 0 },
      seventhChords: { correct: 0, total: 0, accuracy: 0 },
      overall: { correct: 0, total: 0, accuracy: 0 }
    },
    total: {
      intervals: { correct: 0, total: 0, accuracy: 0 },
      triads: { correct: 0, total: 0, accuracy: 0 },
      seventhChords: { correct: 0, total: 0, accuracy: 0 },
      overall: { correct: 0, total: 0, accuracy: 0 }
    }
  };
}

/**
 * 记录训练结果
 * @param {string} trainingType - 训练类型，如 'intervals', 'triads', 'seventhChords'
 * @param {string} category - 训练分类，如 'seconds', 'thirds' 等
 * @param {boolean} isHarmonic - 是否为和声（只适用于音程训练）
 * @param {boolean} isCorrect - 是否回答正确
 */
function recordTrainingResult(trainingType, category, isHarmonic = null, isCorrect = false) {
  const today = getCurrentDateString();
  
  // 获取现有数据或初始化
  const allStats = uni.getStorageSync('all_training_stats') || {};
  
  // 确保日期数据存在
  if (!allStats[today]) {
    allStats[today] = {
      intervals: { correct: 0, total: 0 },
      triads: { correct: 0, total: 0 },
      seventhChords: { correct: 0, total: 0 }
    };
  }
  
  // 更新特定训练类型的统计
  allStats[today][trainingType].total += 1;
  if (isCorrect) {
    allStats[today][trainingType].correct += 1;
  }
  
  // 更新特定分类的详细统计
  const categoryKey = isHarmonic !== null ? 
    `${category}_${isHarmonic ? 'harmonic' : 'melodic'}` : 
    category;
    
  if (!allStats[today][`${trainingType}_details`]) {
    allStats[today][`${trainingType}_details`] = {};
  }
  
  if (!allStats[today][`${trainingType}_details`][categoryKey]) {
    allStats[today][`${trainingType}_details`][categoryKey] = { correct: 0, total: 0 };
  }
  
  allStats[today][`${trainingType}_details`][categoryKey].total += 1;
  if (isCorrect) {
    allStats[today][`${trainingType}_details`][categoryKey].correct += 1;
  }
  
  // 保存更新后的数据
  uni.setStorageSync('all_training_stats', allStats);
  
  // 更新汇总统计数据（用于快速访问）
  updateSummaryStats();
}

/**
 * 更新汇总统计数据
 * 计算今日和总的准确率及训练次数
 */
function updateSummaryStats() {
  const allStats = uni.getStorageSync('all_training_stats') || {};
  const today = getCurrentDateString();
  
  // 初始化汇总数据
  const summary = getDefaultStats();
  
  // 处理今日数据
  if (allStats[today]) {
    const todayData = allStats[today];
    
    // 计算音程训练
    summary.today.intervals = {
      correct: todayData.intervals.correct,
      total: todayData.intervals.total,
      accuracy: todayData.intervals.total > 0 ? 
        Math.round((todayData.intervals.correct / todayData.intervals.total) * 100) : 0
    };
    
    // 计算三和弦训练
    summary.today.triads = {
      correct: todayData.triads.correct,
      total: todayData.triads.total,
      accuracy: todayData.triads.total > 0 ? 
        Math.round((todayData.triads.correct / todayData.triads.total) * 100) : 0
    };
    
    // 计算七和弦训练
    summary.today.seventhChords = {
      correct: todayData.seventhChords.correct,
      total: todayData.seventhChords.total,
      accuracy: todayData.seventhChords.total > 0 ? 
        Math.round((todayData.seventhChords.correct / todayData.seventhChords.total) * 100) : 0
    };
    
    // 计算总体训练
    const todayOverallCorrect = todayData.intervals.correct + todayData.triads.correct + todayData.seventhChords.correct;
    const todayOverallTotal = todayData.intervals.total + todayData.triads.total + todayData.seventhChords.total;
    
    summary.today.overall = {
      correct: todayOverallCorrect,
      total: todayOverallTotal,
      accuracy: todayOverallTotal > 0 ? 
        Math.round((todayOverallCorrect / todayOverallTotal) * 100) : 0
    };
  }
  
  // 处理历史总数据
  Object.keys(allStats).forEach(date => {
    const dateData = allStats[date];
    
    // 累加音程训练数据
    summary.total.intervals.correct += dateData.intervals.correct;
    summary.total.intervals.total += dateData.intervals.total;
    
    // 累加三和弦训练数据
    summary.total.triads.correct += dateData.triads.correct;
    summary.total.triads.total += dateData.triads.total;
    
    // 累加七和弦训练数据
    summary.total.seventhChords.correct += dateData.seventhChords.correct;
    summary.total.seventhChords.total += dateData.seventhChords.total;
  });
  
  // 计算总历史准确率
  summary.total.intervals.accuracy = summary.total.intervals.total > 0 ?
    Math.round((summary.total.intervals.correct / summary.total.intervals.total) * 100) : 0;
    
  summary.total.triads.accuracy = summary.total.triads.total > 0 ?
    Math.round((summary.total.triads.correct / summary.total.triads.total) * 100) : 0;
    
  summary.total.seventhChords.accuracy = summary.total.seventhChords.total > 0 ?
    Math.round((summary.total.seventhChords.correct / summary.total.seventhChords.total) * 100) : 0;
  
  // 计算总历史总体准确率
  const totalOverallCorrect = summary.total.intervals.correct + summary.total.triads.correct + summary.total.seventhChords.correct;
  const totalOverallTotal = summary.total.intervals.total + summary.total.triads.total + summary.total.seventhChords.total;
  
  summary.total.overall = {
    correct: totalOverallCorrect,
    total: totalOverallTotal,
    accuracy: totalOverallTotal > 0 ? 
      Math.round((totalOverallCorrect / totalOverallTotal) * 100) : 0
  };
  
  // 保存汇总数据
  uni.setStorageSync('training_stats_summary', summary);
}

/**
 * 获取训练统计汇总
 * @returns {Object} 今日和总的训练统计数据
 */
function getStatsSummary() {
  // 确保统计数据是最新的
  updateSummaryStats();
  return uni.getStorageSync('training_stats_summary') || {
    today: {
      intervals: { correct: 0, total: 0, accuracy: 0 },
      triads: { correct: 0, total: 0, accuracy: 0 },
      seventhChords: { correct: 0, total: 0, accuracy: 0 },
      overall: { correct: 0, total: 0, accuracy: 0 }
    },
    total: {
      intervals: { correct: 0, total: 0, accuracy: 0 },
      triads: { correct: 0, total: 0, accuracy: 0 },
      seventhChords: { correct: 0, total: 0, accuracy: 0 },
      overall: { correct: 0, total: 0, accuracy: 0 }
    }
  };
}



export default {
  recordTrainingResult,
  getStatsSummary,
  updateSummaryStats,
  getDefaultStats
}; 