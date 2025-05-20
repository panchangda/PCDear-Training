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

// 确保输出目录存在
const outputDir = path.join(__dirname, '../static/audio/notes');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 生成单个音符的音频
async function generateNote(note, frequency) {
  // 创建合成器
  const synth = new Tone.Synth({
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

  // 生成音频
  const duration = 1.5; // 音符持续时间（秒）
  const now = Tone.now();
  synth.triggerAttackRelease(frequency, duration, now);

  // 等待音频生成完成
  await new Promise(resolve => setTimeout(resolve, duration * 1000 + 100));

  // 获取音频数据
  const audioData = await Tone.Offline(() => {
    synth.triggerAttackRelease(frequency, duration);
  }, duration + 0.1);

  // 将音频数据转换为 MP3
  const buffer = await audioData.getAudioBuffer();
  const wav = await Tone.Offline(() => {
    synth.triggerAttackRelease(frequency, duration);
  }, duration + 0.1);

  // 保存为 MP3 文件
  const outputPath = path.join(outputDir, `${note}.mp3`);
  await Tone.Offline(() => {
    synth.triggerAttackRelease(frequency, duration);
  }, duration + 0.1).then(buffer => {
    const blob = buffer.toWav();
    fs.writeFileSync(outputPath, Buffer.from(await blob.arrayBuffer()));
  });

  console.log(`Generated ${note}.mp3`);
}

// 生成所有音符的音频
async function generateAllNotes() {
  console.log('Starting note generation...');
  
  for (const [note, frequency] of Object.entries(NOTE_FREQUENCIES)) {
    await generateNote(note, frequency);
  }
  
  console.log('Note generation completed!');
}

// 运行生成脚本
generateAllNotes().catch(console.error); 