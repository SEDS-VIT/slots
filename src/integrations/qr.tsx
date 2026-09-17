import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

export function OmniQRScanner() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationFrameId = useRef<number | null>(null);
    const isProcessing = useRef<boolean>(false);

    const [error, setError] = useState<string | null>(null);
    const [scannedUrl, setScannedUrl] = useState<string | null>(null);

    useEffect(() => {
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' }
                });

                streamRef.current = stream;

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.setAttribute('playsinline', 'true');
                    await videoRef.current.play();
                    animationFrameId.current = requestAnimationFrame(scanFrame);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : String(err));
            }
        };

        const scanFrame = () => {
            if (isProcessing.current) return;

            const video = videoRef.current;
            const canvas = canvasRef.current;

            if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                const ctx = canvas.getContext('2d', { willReadFrequently: true });

                if (ctx) {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

                    // attemptBoth natively scans for normal and inverted color matrices concurrently
                    const code = jsQR(imageData.data, imageData.width, imageData.height, {
                        inversionAttempts: 'attemptBoth'
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

        startCamera();

        return () => {
            stopCamera();
        };
    }, []);

    const stopCamera = () => {
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
    };

    const handleDetection = async (url: string) => {
        setScannedUrl(url);
        stopCamera();

        try {

            const cleanUrl = url.split('%20')[0];

            window.location.href = cleanUrl;

        } catch (e) {
            console.error("Cleanup failed before redirect:", e);
            window.location.href = url;
        }
    };

    if (error) {
        return (
            <div className="p-4 bg-red-950 border border-red-500 rounded-lg flex items-center justify-center w-full max-w-md mx-auto">
                <p className="text-red-400 font-medium">Camera access denied: {error}</p>
            </div>
        );
    }

    return (
        <div className="relative w-full max-w-md mx-auto overflow-hidden rounded-xl bg-gray-900 shadow-2xl border-2 border-indigo-500/30">
            <video
                ref={videoRef}
                className={`w-full h-auto block object-cover transition-opacity duration-300 ${scannedUrl ? 'opacity-30' : 'opacity-100'}`}
                muted
            />

            <canvas
                ref={canvasRef}
                className="hidden"
            />

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
