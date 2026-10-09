from pathlib import Path

from supertonic import TTS

tts = TTS(auto_download=True)
style = tts.get_voice_style(voice_name="M1")

texts = [
    "Most AI website builders",
    "build for you...",
    "until you want to change",
    "one small detail",
    "and the whole thing breaks.",
]

output_dir = Path(__file__).parent / "output"
output_dir.mkdir(parents=True, exist_ok=True)

for i, text in enumerate(texts):
    wav, duration = tts.synthesize(text, voice_style=style, lang="en")
    # duration can be float or np.ndarray depending on supertonic version
    try:
        seconds = float(duration)
    except (TypeError, ValueError):
        seconds = float(duration[0])

    out_path = output_dir / f"{i:03d}.wav"
    tts.save_audio(wav, str(out_path))
    print(f"[{i + 1}/{len(texts)}] {seconds:.2f}s -> {out_path} | {text!r}")

