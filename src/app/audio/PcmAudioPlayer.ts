type AudioFormat = {
    sampleRate: number;
    channels: number;
};

/**
 * Minimal PCM Int16LE player over WebAudio.
 *
 * Expects packets:
 * - kind=0 header: [1 byte kind][int32BE sampleRate][int32BE channels]
 * - kind=1 data:   [1 byte kind][...pcm int16le interleaved...]
 */
export class PcmAudioPlayer {
    private enabled = false;
    private audioContext?: AudioContext;
    private processor?: ScriptProcessorNode;
    private format?: AudioFormat;
    private queue: Float32Array[] = [];
    private started = false;

    public setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        if (!enabled) {
            this.stop();
        } else {
            this.ensureStarted();
        }
    }

    public pushPacket(payload: ArrayBuffer): void {
        const u8 = new Uint8Array(payload);
        if (!u8.byteLength) {
            return;
        }
        const kind = u8[0];
        if (kind === 0) {
            if (u8.byteLength < 1 + 4 + 4) {
                return;
            }
            const dv = new DataView(payload, 1);
            const sampleRate = dv.getInt32(0, false);
            const channels = dv.getInt32(4, false);
            if (sampleRate > 0 && channels > 0 && channels <= 2) {
                this.format = { sampleRate, channels };
                // restart pipeline to reflect new format
                if (this.enabled) {
                    this.stop();
                    this.ensureStarted();
                }
            }
            return;
        }
        if (kind !== 1) {
            return;
        }
        if (!this.enabled) {
            return;
        }
        if (!this.format) {
            return;
        }
        this.ensureStarted();
        const pcmBytes = u8.subarray(1);
        if (!pcmBytes.byteLength) {
            return;
        }
        const float = this.int16leToFloat32(pcmBytes);
        this.queue.push(float);
    }

    private ensureStarted(): void {
        if (this.started) {
            return;
        }
        if (!this.enabled) {
            return;
        }
        if (!this.format) {
            return;
        }
        const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextCtor) {
            return;
        }
        try {
            // Some browsers ignore provided sampleRate; we'll handle mismatch by letting WebAudio resample.
            this.audioContext = new AudioContextCtor({ sampleRate: this.format.sampleRate });
        } catch {
            this.audioContext = new AudioContextCtor();
        }
        const ctx = this.audioContext;
        const channels = this.format.channels;
        const bufferSize = 4096;
        const proc = ctx.createScriptProcessor(bufferSize, 0, channels);
        proc.onaudioprocess = (e: AudioProcessingEvent) => {
            for (let ch = 0; ch < channels; ch++) {
                const out = e.outputBuffer.getChannelData(ch);
                out.fill(0);
            }
            if (!this.enabled || !this.format) {
                return;
            }
            this.fillOutput(e.outputBuffer);
        };
        proc.connect(ctx.destination);

        // Auto-resume on user gesture (autoplay policy)
        const tryResume = () => {
            if (!this.audioContext) return;
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume().catch(() => void 0);
            }
            window.removeEventListener('pointerdown', tryResume);
            window.removeEventListener('keydown', tryResume);
        };
        window.addEventListener('pointerdown', tryResume, { once: true });
        window.addEventListener('keydown', tryResume, { once: true });

        this.processor = proc;
        this.started = true;
    }

    private fillOutput(output: AudioBuffer): void {
        if (!this.format) {
            return;
        }
        const channels = this.format.channels;
        const framesNeeded = output.length;
        let frameOffset = 0;

        while (frameOffset < framesNeeded && this.queue.length) {
            const chunk = this.queue[0];
            const chunkFrames = chunk.length / channels;
            const framesToCopy = Math.min(framesNeeded - frameOffset, chunkFrames);

            for (let ch = 0; ch < channels; ch++) {
                const out = output.getChannelData(ch);
                for (let i = 0; i < framesToCopy; i++) {
                    out[frameOffset + i] = chunk[(i * channels) + ch];
                }
            }

            if (framesToCopy === chunkFrames) {
                this.queue.shift();
            } else {
                const remain = chunk.subarray(framesToCopy * channels);
                this.queue[0] = remain;
            }

            frameOffset += framesToCopy;
        }
    }

    private int16leToFloat32(pcm: Uint8Array): Float32Array {
        const samples = (pcm.byteLength / 2) | 0;
        const out = new Float32Array(samples);
        const dv = new DataView(pcm.buffer, pcm.byteOffset, pcm.byteLength);
        for (let i = 0; i < samples; i++) {
            const s = dv.getInt16(i * 2, true);
            out[i] = s / 0x8000;
        }
        return out;
    }

    private stop(): void {
        this.queue.length = 0;
        this.started = false;
        if (this.processor) {
            try {
                this.processor.disconnect();
            } catch {
                // ignore
            }
            this.processor.onaudioprocess = null;
            this.processor = undefined;
        }
        if (this.audioContext) {
            const ctx = this.audioContext;
            this.audioContext = undefined;
            ctx.close().catch(() => void 0);
        }
    }
}

