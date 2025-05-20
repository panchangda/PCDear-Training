const Tone = require('tone');
const fs = require('fs');
const path = require('path');

// 音符频率表（与 audioService.js 中的一致）
const NOTE_FREQUENCIES = {
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
  'B5': 987.77
};

// 音程定义（半音数）
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

// 确保输出目录存在
const outputDir = path.join(__dirname, '../static/audio/intervals');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 生成单个音程的音频
async function generateInterval(baseNote, intervalName, isHarmonic = true) {
  // 创建两个合成器
  const synth1 = new Tone.PolySynth(Tone.Synth, {
    oscillator: {
      type: 'sine'
    },
    envelope: {
      attack: 0.005,
      decay: 0.1,
      sustain: 0.3,
      release: 1
    }
  }).toDestination();

  const synth2 = new Tone.PolySynth(Tone.Synth, {
    oscillator: {
      type: 'sine'
    },
    envelope: {
      attack: 0.005,
      decay: 0.1,
      sustain: 0.3,
      release: 1
    }
  }).toDestination();

  // 获取基础音符和间隔音符的频率
  const baseFreq = NOTE_FREQUENCIES[baseNote];
  const semitones = INTERVALS[intervalName];
  const intervalNote = Object.entries(NOTE_FREQUENCIES).find(([note, freq]) => {
    const baseIndex = Object.keys(NOTE_FREQUENCIES).indexOf(baseNote);
    const noteIndex = Object.keys(NOTE_FREQUENCIES).indexOf(note);
    return noteIndex === baseIndex + semitones;
  })?.[0];

  if (!intervalNote) {
    console.error(`Cannot find interval note for ${baseNote} + ${intervalName}`);
    return;
  }

  const intervalFreq = NOTE_FREQUENCIES[intervalNote];

  // 生成音频
  const duration = 2; // 音程持续时间（秒）
  
  // 使用 Offline 上下文生成音频
  const audioData = await Tone.Offline(() => {
    if (isHarmonic) {
      // 和声音程：同时播放两个音符
      synth1.triggerAttackRelease(baseFreq, duration);
      synth2.triggerAttackRelease(intervalFreq, duration);
    } else {
      // 旋律音程：依次播放两个音符
      synth1.triggerAttackRelease(baseFreq, duration / 2);
      synth2.triggerAttackRelease(intervalFreq, duration / 2, duration / 2 + 0.1);
    }
  }, duration + 0.1);

  // 保存为 WAV 文件
  const fileName = `${baseNote}_${intervalName.replace(/\s+/g, '_')}_${isHarmonic ? 'harmonic' : 'melodic'}.wav`;
  const outputPath = path.join(outputDir, fileName);
  
  const buffer = await audioData.getAudioBuffer();
  const blob = await buffer.toWav();
  fs.writeFileSync(outputPath, Buffer.from(await blob.arrayBuffer()));

  console.log(`Generated ${fileName}`);
}

// 生成所有音程的音频
async function generateAllIntervals() {
  console.log('Starting interval generation...');
  
  // 为每个基础音符生成所有音程
  for (const baseNote of Object.keys(NOTE_FREQUENCIES)) {
    for (const intervalName of Object.keys(INTERVALS)) {
      // 生成和声音程
      await generateInterval(baseNote, intervalName, true);
      // 生成旋律音程
      await generateInterval(baseNote, intervalName, false);
    }
  }
  
  console.log('Interval generation completed!');
}

// 运行生成脚本
generateAllIntervals().catch(console.error); 