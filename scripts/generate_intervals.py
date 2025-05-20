import os
import numpy as np
from scipy.io import wavfile
from scipy import signal
import math

# 音符频率表（扩展范围：C3-C6）
NOTE_FREQUENCIES = {
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
}

# 音程定义（半音数）
INTERVALS = {
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
}

# 音频参数
SAMPLE_RATE = 44100  # 采样率
NOTE_DURATION = 1.0  # 单个音符持续时间（秒）
GAP_DURATION = 0.5   # 音符之间的间隔（秒）
REPEAT_GAP = 1.5    # 重复播放之间的间隔（秒）

def generate_piano_tone(frequency, duration, amplitude=0.5):
    """
    生成一个"更自然"的钢琴音色：
      - 排除超出 Nyquist 的泛音
      - 指数型 ADSR 包络
      - 叠加短暂 hammer noise
    """
    # 时间轴
    t = np.arange(int(SAMPLE_RATE * duration)) / SAMPLE_RATE
    
    # 1. 基频 + 几个主要泛音（只要 f*mult < Nyquist）
    partials = [
        (1.00, 1),
        (0.50, 2),
        (0.30, 3),
        (0.20, 4),
        (0.10, 5),
        (0.05, 6),
    ]
    wave = np.zeros_like(t)
    nyquist = SAMPLE_RATE / 2
    for amp_ratio, mult in partials:
        f_h = frequency * mult
        if f_h < nyquist:
            # 轻微去调 (detune) 让音色更"活"
            detune = 1 + np.random.uniform(-1e-4, 1e-4)
            phase = np.random.rand() * 2 * np.pi
            wave += amp_ratio * np.sin(2 * np.pi * f_h * detune * t + phase)
    
    # 2. hammer noise：只在前 10ms 加一点指数衰减的白噪声
    hammer_len = int(0.01 * SAMPLE_RATE)
    noise = np.random.randn(hammer_len) * np.exp(-np.linspace(0, 1, hammer_len) * 5)
    wave[:hammer_len] += noise * 0.3
    
    # 3. 指数型 ADSR 包络
    A = 0.005  # 5ms
    D = 0.1    # 100ms
    S = 0.6    # sustain 电平
    R = 0.3    # 300ms
    aN = int(A * SAMPLE_RATE)
    dN = int(D * SAMPLE_RATE)
    rN = int(R * SAMPLE_RATE)
    sN = len(wave) - (aN + dN + rN)
    # 构造各段
    attack_env  = np.linspace(0,    1.0, aN, endpoint=False)
    decay_env   = np.linspace(1.0,  S,   dN, endpoint=False)
    sustain_env = np.full(sN, S)
    release_env = np.linspace(S,    0.0, rN)
    envelope = np.concatenate([attack_env, decay_env, sustain_env, release_env])
    wave *= envelope
    
    # 4. 按 amplitude 缩放一次（不再做每音符最大值归一化）
    peak = np.max(np.abs(wave))
    if peak > 0:
        wave = wave / peak * amplitude
    
    # 5. 转为 int16 输出
    return np.int16(wave * 32767)

def generate_interval(base_note, interval_name, is_harmonic=True, is_ascending=True):
    """生成单个音程的音频"""
    # 获取基础音符和间隔音符的频率
    base_freq = NOTE_FREQUENCIES[base_note]
    semitones = INTERVALS[interval_name]
    
    # 找到间隔音符
    base_index = list(NOTE_FREQUENCIES.keys()).index(base_note)
    if is_ascending:
        # 检查上行音程是否超出范围
        if base_index + semitones >= len(NOTE_FREQUENCIES):
            print(f"Interval {interval_name} from {base_note} ascending is out of range")
            return None
        interval_note = list(NOTE_FREQUENCIES.keys())[base_index + semitones]
    else:
        # 检查下行音程是否超出范围
        if base_index - semitones < 0:
            print(f"Interval {interval_name} from {base_note} descending is out of range")
            return None
        interval_note = list(NOTE_FREQUENCIES.keys())[base_index - semitones]
    
    if not interval_note:
        print(f"Cannot find interval note for {base_note} {'+' if is_ascending else '-'} {interval_name}")
        return None
        
    interval_freq = NOTE_FREQUENCIES[interval_note]
    
    base_wave = generate_piano_tone(base_freq, NOTE_DURATION).astype(np.float32) / 32767
    
    interval_wave = generate_piano_tone(interval_freq, NOTE_DURATION).astype(np.float32) / 32767

    # 音符之间的间隔
    gap = np.zeros(int(GAP_DURATION * SAMPLE_RATE), dtype=np.float32)

    # 重复播放的间隔
    repeat_gap = np.zeros(int(REPEAT_GAP * SAMPLE_RATE), dtype=np.float32)
    
    if is_harmonic:
        # 和声音程：同时播放两个音符，不需要区分上下行
        combined_wave = base_wave + interval_wave
        # 归一化
        combined_wave = combined_wave / np.max(np.abs(combined_wave))
        
        # 重复播放两次
        final_wave = np.concatenate([combined_wave, gap, combined_wave])
    else:
        # 旋律音程：依次播放两个音符，需要区分上下行
        gap_samples = int(GAP_DURATION * SAMPLE_RATE)
        gap = np.zeros(gap_samples)
        
        # 根据方向决定音符播放顺序
        if is_ascending:
            # 上行：先播放低音，再播放高音
            first_play = np.concatenate([base_wave, gap, interval_wave])
        else:
            # 下行：先播放高音，再播放低音
            first_play = np.concatenate([base_wave, gap,interval_wave ])
        
        
        # 重复播放
        final_wave = np.concatenate([first_play, repeat_gap, first_play])
        # 归一化
        final_wave /= np.max(np.abs(final_wave))
    
    # —— 最后把 float 波形转回 int16 PCM —— 
    audio_data = np.int16(final_wave * 32767)
    
    return audio_data

def save_interval(base_note, interval_name, is_harmonic=True, is_ascending=True):
    """保存音程音频文件"""
    # 创建输出目录
    output_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static', 'audio', 'intervals')
    os.makedirs(output_dir, exist_ok=True)
    
    # 生成音频数据
    audio_data = generate_interval(base_note, interval_name, is_harmonic, is_ascending)
    if audio_data is None:
        return
    
    # 生成文件名
    if is_harmonic:
        # 和声音程不需要区分上下行
        file_name = f"{base_note}_{interval_name.replace(' ', '_')}_harmonic.wav"
    else:
        # 旋律音程需要区分上下行
        direction = 'ascending' if is_ascending else 'descending'
        file_name = f"{base_note}_{interval_name.replace(' ', '_')}_melodic_{direction}.wav"
    
    output_path = os.path.join(output_dir, file_name)
    
    # 保存为WAV文件
    wavfile.write(output_path, SAMPLE_RATE, audio_data)
    print(f"Generated {file_name}")

def save_note(note):
    """保存单个音符音频文件"""
    # 创建输出目录
    output_dir = os.path.join('static', 'audio', 'notes')
    os.makedirs(output_dir, exist_ok=True)
    
    # 生成音频数据
    frequency = NOTE_FREQUENCIES[note]
    wave = generate_piano_tone(frequency, 1.0)  # 持续1秒
    
    # 保存文件
    output_path = os.path.join(output_dir, f"{note}.wav")
    wavfile.write(output_path, SAMPLE_RATE, wave)
    print(f"Generated: {note}.wav")

def generate_all_intervals():
    """生成所有音程的音频文件"""
    print("Starting interval generation...")
    
    # 生成所有单个音符的音频文件
    for note in NOTE_FREQUENCIES.keys():
        save_note(note)
    
    # 为每个基础音符生成所有音程
    for base_note in NOTE_FREQUENCIES.keys():
        for interval_name in INTERVALS.keys():
            # 检查是否超出范围
            base_index = list(NOTE_FREQUENCIES.keys()).index(base_note)
            semitones = INTERVALS[interval_name]
            
            # 检查上行音程
            if base_index + semitones < len(NOTE_FREQUENCIES):
                # 生成和声音程（不需要区分上下行）
                save_interval(base_note, interval_name, True, True)
                # 生成上行旋律音程
                save_interval(base_note, interval_name, False, True)
            
            # 检查下行音程
            if base_index - semitones >= 0:
                # 生成下行旋律音程
                save_interval(base_note, interval_name, False, False)
    
    print("Interval generation completed!")

if __name__ == "__main__":
    generate_all_intervals() 