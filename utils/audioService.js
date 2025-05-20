/**
 * Audio Service for PCDear-Training
 * Handles audio playback and music theory logic for ear training exercises
 */

// Constants for note frequencies (A4 = 440Hz standard)
const NOTE_FREQUENCIES = {
  'C3': 130.81,
  'C#3': 138.59,
  'D3': 146.83,
  'D#3': 155.56,
  'E3': 164.81,
  'F3': 174.61,
  'F#3': 185.00,
  'G3': 196.00,
  'G#3': 207.65,
  'A3': 220.00,
  'A#3': 233.08,
  'B3': 246.94,
  'C4': 261.63,
  'C#4': 277.18,
  'D4': 293.66,
  'D#4': 311.13,
  'E4': 329.63,
  'F4': 349.23,
  'F#4': 369.99,
  'G4': 392.00,
  'G#4': 415.30,
  'A4': 440.00,
  'A#4': 466.16,
  'B4': 493.88,
  'C5': 523.25,
  'C#5': 554.37,
  'D5': 587.33,
  'D#5': 622.25,
  'E5': 659.26,
  'F5': 698.46,
  'F#5': 739.99,
  'G5': 783.99,
  'G#5': 830.61,
  'A5': 880.00,
  'A#5': 932.33,
  'B5': 987.77,
  'C6': 1046.50
};

// Interval definitions (in semitones)
const INTERVALS = {
  'Minor 2nd': 1,
  'Major 2nd': 2,
  'Minor 3rd': 3,
  'Major 3rd': 4,
  'Perfect 4th': 5,
  'Tritone': 6,
  'Perfect 5th': 7,
  'Minor 6th': 8,
  'Major 6th': 9,
  'Minor 7th': 10,
  'Major 7th': 11,
  'Octave': 12
};

// Available notes for exercises
const AVAILABLE_NOTES = Object.keys(NOTE_FREQUENCIES);

// 音频实例缓存
const audioInstances = {};

/**
 * 获取单个音符的音频实例
 * @param {string} note - 音符名称
 * @returns {Object} 音频实例
 */
function getNoteAudioInstance(note) {
  const cacheKey = `note_${note}`;
  
  if (!audioInstances[cacheKey]) {
    // 创建新的音频实例
    const audio = uni.createInnerAudioContext();
    // 设置音频源为预生成的音符音频文件
    audio.src = `/static/audio/notes/${note}.wav`;
    audioInstances[cacheKey] = audio;
  }
  return audioInstances[cacheKey];
}

/**
 * 播放单个音符
 * @param {string} note - 音符名称
 */
function playNote(note) {
  const audio = getNoteAudioInstance(note);
  
  // 设置音量
  audio.volume = 0.5;
  
  // 停止当前播放并重新开始
  audio.stop();
  audio.play();
}

/**
 * 获取音程对应的音频实例
 * @param {string} baseNote - 基础音符
 * @param {string} intervalName - 音程名称
 * @param {boolean} isHarmonic - 是否为和声音程
 * @param {boolean} isAscending - 是否为上行音程（仅用于旋律音程）
 * @returns {Object} 音频实例
 */
function getIntervalAudioInstance(baseNote, intervalName, isHarmonic = true, isAscending = true) {
  // 生成文件名
  let fileName;
  if (isHarmonic) {
    // 和声音程不需要区分上下行
    fileName = `${baseNote}_${intervalName.replace(/\s+/g, '_')}_harmonic.wav`;
  } else {
    // 旋律音程需要区分上下行
    const direction = isAscending ? 'ascending' : 'descending';
    fileName = `${baseNote}_${intervalName.replace(/\s+/g, '_')}_melodic_${direction}.wav`;
  }
  
  const cacheKey = fileName;
  
  if (!audioInstances[cacheKey]) {
    // 创建新的音频实例
    const audio = uni.createInnerAudioContext();
    // 设置音频源为预生成的音程音频文件
    audio.src = `/static/audio/intervals/${fileName}`;
    audioInstances[cacheKey] = audio;
  }
  return audioInstances[cacheKey];
}

/**
 * 播放音程
 * @param {string} baseNote - 基础音符
 * @param {string} intervalName - 音程名称
 * @param {boolean} isHarmonic - 是否为和声音程
 * @param {boolean} isAscending - 是否为上行音程（仅用于旋律音程）
 */
function playInterval(baseNote, intervalName, isHarmonic = true, isAscending = true) {
  const audio = getIntervalAudioInstance(baseNote, intervalName, isHarmonic, isAscending);
  
  // 设置音量
  audio.volume = 0.5;
  
  // 停止当前播放并重新开始
  audio.stop();
  audio.play();
}

/**
 * 生成随机音程练习
 * @param {string[]} intervalTypes - 要包含的音程类型数组
 * @param {boolean} isHarmonic - 是否为和声音程
 * @returns {Object} 包含音符和正确答案的练习数据
 */
function generateIntervalExercise(intervalTypes, isHarmonic = true) {
  // 从提供的类型中选择随机音程类型
  const intervalType = intervalTypes[Math.floor(Math.random() * intervalTypes.length)];
  const semitones = INTERVALS[intervalType];
  
  // 选择随机起始音符（避免最高音符以防止超出范围）
  const maxStartingNoteIndex = AVAILABLE_NOTES.length - semitones - 1;
  const startingNoteIndex = Math.floor(Math.random() * maxStartingNoteIndex);
  const startingNote = AVAILABLE_NOTES[startingNoteIndex];
  
  // 根据音程计算第二个音符
  const secondNoteIndex = startingNoteIndex + semitones;
  const secondNote = AVAILABLE_NOTES[secondNoteIndex];
  
  // 随机决定是否为上行音程（仅用于旋律音程）
  const isAscending = Math.random() > 0.5;
  
  return {
    firstNote: startingNote,
    secondNote: secondNote,
    intervalType: intervalType,
    isAscending: isAscending,
    playFunction: () => playInterval(startingNote, intervalType, isHarmonic, isAscending)
  };
}

/**
 * 获取特定类别的可用音程
 * @param {string} category - 类别名称（例如 'seconds', 'thirds' 等）
 * @param {boolean} isHarmonic - 是否为和声音程
 * @returns {string[]} 音程类型数组
 */
function getIntervalsForCategory(category, isHarmonic = true) {
  switch (category.toLowerCase()) {
    case 'seconds':
      return ['Minor 2nd', 'Major 2nd'];
    case 'thirds':
      return ['Minor 3rd', 'Major 3rd'];
    case 'fourths-fifths':
      return ['Perfect 4th', 'Perfect 5th'];
    case 'sixths':
      return ['Minor 6th', 'Major 6th'];
    case 'sevenths':
      return ['Minor 7th', 'Major 7th'];
    case 'tritones-major-sevenths':
      return ['Tritone', 'Major 7th'];
    case 'all-intervals':
      return Object.keys(INTERVALS);
    default:
      return [];
  }
}

export default {
  playInterval,
  playNote,
  generateIntervalExercise,
  getIntervalsForCategory,
  INTERVALS
}; 