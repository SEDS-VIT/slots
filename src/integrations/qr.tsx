import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

export function OmniQRScanner() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationFrameId = useRef<number | null>(null);
    const isProcessing = useRef<boolean>(false);
    const lastScanTimestamp = useRef<number>(0);

    const [error, setError] = useState<string | null>(null);
    const [scannedUrl, setScannedUrl] = useState<string | null>(null);

    useEffect(() => {
        let isActive = true;

        const stopCamera = () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
                animationFrameId.current = null;
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
            }
        };

        const handleDetection = (url: string) => {
            stopCamera();
            setScannedUrl(url);

            try {
                const parsed = new URL(url.trim());
                // Enforce safe protocols to block javascript: and data: exploits
                if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
                    throw new Error(`Unsafe protocol rejected: ${parsed.protocol}`);
                }
                // console.log(parsed.href)
                window.location.href = parsed.href;
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Invalid QR URL scanned');
                isProcessing.current = false;
            }
        };

        const scanFrame = (timestamp: number) => {
            if (!isActive || isProcessing.current) return;

            const video = videoRef.current;
            const canvas = canvasRef.current;

            // Throttle scanning to every 150ms instead of every RAF tick (60 FPS)
            if (
                video &&
                canvas &&
                video.readyState >= video.HAVE_CURRENT_DATA &&
                timestamp - lastScanTimestamp.current > 150
            ) {
                lastScanTimestamp.current = timestamp;

                // Cache 2D context instead of fetching it on every frame
                if (!contextRef.current) {
                    contextRef.current = canvas.getContext('2d', { willReadFrequently: true });
                }
                const ctx = contextRef.current;

                if (ctx) {
                    // Downscale the analysis canvas to avoid parsing multi-megapixel frames
                    const scale = Math.min(1, 640 / video.videoWidth);
                    const targetWidth = Math.floor(video.videoWidth * scale);
                    const targetHeight = Math.floor(video.videoHeight * scale);

                    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
                        canvas.width = targetWidth;
                        canvas.height = targetHeight;
                    }

                    ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
                    const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);

                    const code = jsQR(imageData.data, imageData.width, imageData.height, {
                        inversionAttempts: 'attemptBoth',
                    });

                    if (code && code.data) {
                        isProcessing.current = true;
                        handleDetection(code.data);
                        return;
                    }
                }
            }

            animationFrameId.current = requestAnimationFrame(scanFrame);
        };

        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' },
                });

                // Abort cleanup if effect unmounted before getUserMedia returned
                if (!isActive) {
                    stream.getTracks().forEach((track) => track.stop());
                    return;
                }

                streamRef.current = stream;

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.setAttribute('playsinline', 'true');

                    try {
                        await videoRef.current.play();
                    } catch (err: unknown) {
                        // Ignore benign abort errors caused by navigation or fast unmounting
                        if (err instanceof DOMException && err.name === 'AbortError') {
                            return;
                        }
                        throw err;
                    }

                    if (isActive) {
                        animationFrameId.current = requestAnimationFrame(scanFrame);
                    }
                }
            } catch (err: unknown) {
                if (!isActive) return;
                if (err instanceof DOMException && err.name === 'NotAllowedError') {
                    setError('Camera permission was denied.');
                } else {
                    setError(err instanceof Error ? err.message : String(err));
                }
            }
        };

        startCamera();

        return () => {
            isActive = false;
            stopCamera();
        };
    }, []);

    if (error) {
        return (
            <div className="p-4 bg-red-950 border border-red-500 rounded-lg flex items-center justify-center w-full max-w-md mx-auto">
                <p className="text-red-400 font-medium">{error}</p>
            </div>
        );
    }

    return (
        <div className="relative w-full max-w-md mx-auto overflow-hidden rounded-xl bg-gray-900 shadow-2xl border-2 border-indigo-500/30">
            <video
                ref={videoRef}
                className={`w-full h-auto block object-cover transition-opacity duration-300 ${scannedUrl ? 'opacity-30' : 'opacity-100'
                    }`}
                muted
                playsInline
            />
            <canvas ref={canvasRef} className="hidden" />

            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {scannedUrl ? (
                    <div className="bg-indigo-600/80 backdrop-blur-sm px-6 py-3 rounded-lg border border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.5)]">
                        <span className="text-white font-bold tracking-wider animate-pulse">
                            LOCK ACQUIRED
                        </span>
                    </div>
                ) : (
                    <div className="w-56 h-56 border-2 border-indigo-400/80 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.4)] relative">
                        <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-indigo-400 rounded-tl-xl"></div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-indigo-400 rounded-tr-xl"></div>
                        <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-indigo-400 rounded-bl-xl"></div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-indigo-400 rounded-br-xl"></div>
                    </div>
                )}
            </div>
        </div>
    );
}
