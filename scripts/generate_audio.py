import asyncio
import json
import os
import subprocess
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, lfilter
import edge_tts

os.makedirs("public/audio", exist_ok=True)
os.makedirs("src/data", exist_ok=True)

# 15 narrative segments precisely timed across the 60-second (3600-frame @ 60fps) timeline
SEGMENTS = [
    {
        "id": 1,
        "start_sec": 0.2,
        "text": "Tahun seribu delapan ratus empat belas, kota London ditenggelamkan oleh tsunami bir setinggi empat setengah meter!",
        "gold_words": ["1814", "seribu", "delapan", "ratus", "empat", "belas", "london", "tsunami", "bir", "empat", "setengah", "meter"]
    },
    {
        "id": 2,
        "start_sec": 6.4,
        "text": "Semua berawal di pabrik bir Horse Shoe Brewery di jalan Tottenham Court Road.",
        "gold_words": ["horse", "shoe", "brewery", "tottenham", "court", "road"]
    },
    {
        "id": 3,
        "start_sec": 11.4,
        "text": "Para pemilik kaya membangun tong kayu ek raksasa setinggi gedung tiga lantai untuk pamer kekayaan.",
        "gold_words": ["kaya", "tong", "kayu", "ek", "raksasa", "tiga", "lantai", "kekayaan"]
    },
    {
        "id": 4,
        "start_sec": 17.6,
        "text": "Di dalamnya mendidih lebih dari satu koma empat juta liter bir hitam porter panas bertekanan tinggi.",
        "gold_words": ["satu", "koma", "empat", "juta", "liter", "bir", "porter", "bertekanan", "tinggi"]
    },
    {
        "id": 5,
        "start_sec": 24.2,
        "text": "Tanggal tujuh belas Oktober sore, mandor gudang George Crick memeriksa sabuk besi seberat tujuh ratus kilogram.",
        "gold_words": ["tujuh", "belas", "oktober", "george", "crick", "sabuk", "besi", "tujuh", "ratus", "kilogram"]
    },
    {
        "id": 6,
        "start_sec": 31.0,
        "text": "Tiba-tiba sabuk besi raksasa itu putus seperti tembakan meriam! Namun bosnya malah santai menulis surat.",
        "gold_words": ["putus", "tembakan", "meriam", "santai"]
    },
    {
        "id": 7,
        "start_sec": 37.6,
        "text": "Satu jam kemudian, tekanan gas fermentasi meledakkan tong utama dan menghancurkan tong-tong di sebelahnya!",
        "gold_words": ["meledakkan", "tong", "utama", "menghancurkan"]
    },
    {
        "id": 8,
        "start_sec": 44.2,
        "text": "Dinding batu bata pabrik jebol! Gelombang bir raksasa menerjang pemukiman padat Saint Giles dalam hitungan detik.",
        "gold_words": ["dinding", "jebol", "gelombang", "bir", "raksasa", "saint", "giles"]
    },
    {
        "id": 9,
        "start_sec": 51.0,
        "text": "Anehnya, pengadilan memutuskan bencana ini sebagai takdir Tuhan, dan sejak itu tong kayu raksasa resmi dilarang selamanya!",
        "gold_words": ["takdir", "tuhan", "dilarang", "selamanya"]
    }
]

VOICE = "id-ID-ArdiNeural"
RATE = "+12%"

async def generate_voiceover():
    all_words = []
    sr = 44100
    full_voice = np.zeros(int(60.0 * sr), dtype=np.float32)

    for seg in SEGMENTS:
        mp3_path = f"public/audio/seg_{seg['id']}.mp3"
        wav_path = f"public/audio/seg_{seg['id']}.wav"
        communicate = edge_tts.Communicate(seg["text"], VOICE, rate=RATE, boundary="WordBoundary")
        seg_words = []
        with open(mp3_path, "wb") as f:
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    f.write(chunk["data"])
                elif chunk["type"] == "WordBoundary":
                    w_start = chunk["offset"] / 10_000_000.0
                    w_dur = max(0.08, chunk["duration"] / 10_000_000.0)
                    word_text = chunk["text"]
                    clean_w = "".join(c for c in word_text.lower() if c.isalnum())
                    is_gold = clean_w in seg["gold_words"]
                    seg_words.append({
                        "word": word_text,
                        "startSec": round(seg["start_sec"] + w_start, 3),
                        "endSec": round(seg["start_sec"] + w_start + w_dur, 3),
                        "startFrame": int(round((seg["start_sec"] + w_start) * 60)),
                        "endFrame": int(round((seg["start_sec"] + w_start + w_dur) * 60)),
                        "highlight": is_gold,
                        "segmentId": seg["id"]
                    })

        # Fallback if WordBoundary did not emit individual words
        if not seg_words:
            words_split = seg["text"].split()
            est_dur = 5.5
            per_w = est_dur / len(words_split)
            for idx, w in enumerate(words_split):
                ws = seg["start_sec"] + idx * per_w
                we = ws + per_w * 0.9
                clean_w = "".join(c for c in w.lower() if c.isalnum())
                seg_words.append({
                    "word": w,
                    "startSec": round(ws, 3),
                    "endSec": round(we, 3),
                    "startFrame": int(round(ws * 60)),
                    "endFrame": int(round(we * 60)),
                    "highlight": clean_w in seg["gold_words"],
                    "segmentId": seg["id"]
                })

        all_words.extend(seg_words)

        # Convert segment mp3 to wav 44100 Hz mono
        subprocess.run([
            "ffmpeg", "-y", "-i", mp3_path,
            "-ar", str(sr), "-ac", "1", wav_path
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

        _, data = wavfile.read(wav_path)
        if data.dtype == np.int16:
            data = data.astype(np.float32) / 32768.0
        start_idx = int(seg["start_sec"] * sr)
        end_idx = min(len(full_voice), start_idx + len(data))
        full_voice[start_idx:end_idx] += data[:end_idx - start_idx]

        # Clean up temp segment files
        os.remove(mp3_path)
        os.remove(wav_path)

    # Save assembled voiceover
    peak = np.max(np.abs(full_voice))
    if peak > 0:
        full_voice = full_voice / peak * 0.88
    wavfile.write("public/audio/voiceover.wav", sr, (full_voice * 32767).astype(np.int16))

    with open("src/data/captions.json", "w", encoding="utf-8") as f:
        json.dump(all_words, f, ensure_ascii=False, indent=2)
    print(f"Generated voiceover.wav and {len(all_words)} caption words.")


def lowpass(signal, cutoff, sr, order=4):
    b, a = butter(order, cutoff / (0.5 * sr), btype="low")
    return lfilter(b, a, signal)

def bandpass(signal, low, high, sr, order=3):
    b, a = butter(order, [low / (0.5 * sr), high / (0.5 * sr)], btype="band")
    return lfilter(b, a, signal)

def generate_sfx():
    sr = 44100
    rng = np.random.default_rng(1814)

    # 1. Heavy Blast + Cavernous Reverb (sfx_blast.wav) - 2.4s
    dur = 2.4
    t = np.linspace(0, dur, int(sr * dur), endpoint=False)
    sub_drop = np.sin(2 * np.pi * (110 * np.exp(-t * 4.5) + 28) * t) * np.exp(-t * 3.0)
    crack = bandpass(rng.standard_normal(len(t)), 400, 4200, sr) * np.exp(-t * 14.0)
    rumble = lowpass(rng.standard_normal(len(t)), 240, sr) * np.exp(-t * 1.6)
    # Add cave reverb reflections
    reverb = np.zeros_like(t)
    for delay_ms, gain in [(45, 0.5), (95, 0.35), (160, 0.25), (260, 0.18), (410, 0.11)]:
        d_samples = int(delay_ms * 0.001 * sr)
        reverb[d_samples:] += (crack[:-d_samples] + rumble[:-d_samples]) * gain
    blast = np.tanh((sub_drop * 1.4 + crack * 1.1 + rumble * 0.9 + reverb * 0.7) * 1.5) * 0.85
    wavfile.write("public/audio/sfx_blast.wav", sr, (blast * 32767).astype(np.int16))

    # 2. Wood Thud / Barrel Crash (sfx_thud.wav) - 0.9s
    dur = 0.9
    t = np.linspace(0, dur, int(sr * dur), endpoint=False)
    wood_body = (
        np.sin(2 * np.pi * 82 * t) * np.exp(-t * 14)
        + 0.6 * np.sin(2 * np.pi * 148 * t) * np.exp(-t * 22)
        + 0.35 * np.sin(2 * np.pi * 235 * t) * np.exp(-t * 30)
    )
    wood_knock = bandpass(rng.standard_normal(len(t)), 150, 1200, sr) * np.exp(-t * 26)
    thud = np.tanh((wood_body * 1.2 + wood_knock * 0.8) * 1.4) * 0.8
    wavfile.write("public/audio/sfx_thud.wav", sr, (thud * 32767).astype(np.int16))

    # 3. Metal Clink / Iron Hoop Snap (sfx_clink.wav) - 0.8s
    dur = 0.8
    t = np.linspace(0, dur, int(sr * dur), endpoint=False)
    freqs = [680, 1140, 1890, 2640, 3520]
    metal = sum(
        (0.5 / (i + 1)) * np.sin(2 * np.pi * f * t) * np.exp(-t * (8 + i * 4))
        for i, f in enumerate(freqs)
    )
    transient = bandpass(rng.standard_normal(len(t)), 1500, 6500, sr) * np.exp(-t * 45)
    clink = np.tanh((metal * 1.5 + transient * 0.7) * 1.6) * 0.75
    wavfile.write("public/audio/sfx_clink.wav", sr, (clink * 32767).astype(np.int16))

    # 4. Subtle Low-End Camera Transition Whoosh (sfx_whoosh.wav) - 0.55s
    dur = 0.55
    t = np.linspace(0, dur, int(sr * dur), endpoint=False)
    env = np.sin(np.pi * (t / dur)) ** 2
    sweep_low = np.sin(2 * np.pi * (65 + 90 * np.sin(np.pi * t / dur)) * t) * env * 0.5
    wind = bandpass(rng.standard_normal(len(t)), 120, 950, sr) * env * 0.65
    whoosh = np.tanh((sweep_low + wind) * 1.3) * 0.55
    wavfile.write("public/audio/sfx_whoosh.wav", sr, (whoosh * 32767).astype(np.int16))

    # 5. Foaming Tsunami Wave Rush (sfx_wave.wav) - 4.0s
    dur = 4.0
    t = np.linspace(0, dur, int(sr * dur), endpoint=False)
    env = np.minimum(1.0, t / 0.4) * np.exp(-np.maximum(0, t - 1.2) * 0.65)
    foam = bandpass(rng.standard_normal(len(t)), 250, 3200, sr) * env * 0.5
    deep_surge = lowpass(rng.standard_normal(len(t)), 190, sr) * env * 0.8
    wave = np.tanh((foam + deep_surge) * 1.2) * 0.65
    wavfile.write("public/audio/sfx_wave.wav", sr, (wave * 32767).astype(np.int16))

    # 6. 60-Second Dramatic Period Underscore (bgm.wav)
    dur = 60.0
    t = np.linspace(0, dur, int(sr * dur), endpoint=False)
    bgm = np.zeros_like(t)
    # 120 BPM minor ostinato in D minor (D2=73.42, F2=87.31, G2=98.00, A2=110.00, Bb2=116.54)
    prog = [73.42, 73.42, 116.54, 110.00, 73.42, 87.31, 98.00, 110.00]
    beat_dur = 0.5  # 120 BPM
    total_beats = int(dur / beat_dur)
    for b in range(total_beats):
        b_start = int(b * beat_dur * sr)
        b_end = min(len(t), int((b + 1) * beat_dur * sr))
        bt = np.linspace(0, beat_dur, b_end - b_start, endpoint=False)
        root = prog[(b // 4) % len(prog)]
        # Pizzicato / staccato cello pulse
        env_pizz = np.exp(-bt * 9.5)
        note = (
            np.sin(2 * np.pi * root * bt)
            + 0.45 * np.sin(2 * np.pi * root * 2 * bt)
            + 0.2 * np.sin(2 * np.pi * root * 3 * bt)
        ) * env_pizz * 0.22
        # Add tension harmonic on off-beats after 24s
        if b * beat_dur >= 24.0:
            note += 0.14 * np.sin(2 * np.pi * (root * 3.0) * bt) * np.exp(-bt * 6.0)
        bgm[b_start:b_end] += note

    wavfile.write("public/audio/bgm.wav", sr, (bgm * 32767).astype(np.int16))
    print("Generated all SFX and BGM WAV files in public/audio/.")

if __name__ == "__main__":
    asyncio.run(generate_voiceover())
    generate_sfx()
