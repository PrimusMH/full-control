import React, { useRef, useState, useCallback } from 'react';
import { Camera, RefreshCw, Aperture, Scan, X, Box, Type, Frame } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

type PresetType = 'OBJECTS' | 'TEXT' | 'SCENE';

const PRESETS: Record<PresetType, { label: string, icon: any, prompt: string }> = {
  OBJECTS: { 
    label: 'OBJ SCAN', 
    icon: Box, 
    prompt: "Analyze this image and identify all distinct objects. List them clearly with a brief description for each." 
  },
  TEXT: { 
    label: 'TXT READ', 
    icon: Type, 
    prompt: "Extract all visible text from this image. Maintain the original structure and formatting where possible. If no text is found, state 'NO DATA'." 
  },
  SCENE: { 
    label: 'SCENE OPS', 
    icon: Frame, 
    prompt: "Provide a detailed tactical analysis of the scene. Describe the environment, lighting, key focal points, and potential context." 
  }
};

export const Vision: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<PresetType>('SCENE');

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setStreaming(true);
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      setAnalysis("Error: Camera access denied. Check permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setStreaming(false);
    }
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const context = canvasRef.current.getContext('2d');
    if (!context) return;

    // Capture frame
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0);
    
    const base64Image = canvasRef.current.toDataURL('image/jpeg');
    setCapturedImage(base64Image);
    stopCamera(); // Stop stream to freeze frame

    setAnalyzing(true);
    setAnalysis(`Initializing ${PRESETS[selectedPreset].label} protocol...`);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // Remove data:image/jpeg;base64, prefix
      const base64Data = base64Image.split(',')[1];
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
                { text: PRESETS[selectedPreset].prompt }
            ]
        }
      });
      
      setAnalysis(response.text || "No analysis data returned.");
    } catch (e) {
      setAnalysis(`Visual analysis failed: ${e}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => {
    setCapturedImage(null);
    setAnalysis('');
    startCamera();
  };

  // Start camera on mount
  React.useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  return (
    <div className="h-full flex flex-col bg-black rounded-lg overflow-hidden relative border border-nexus-800">
      <div className="relative flex-1 bg-nexus-900/50 flex items-center justify-center overflow-hidden">
        {!capturedImage && (
            <video 
                ref={videoRef} 
                className="absolute inset-0 w-full h-full object-cover opacity-80"
                playsInline
                muted
            />
        )}
        
        {capturedImage && (
            <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
        )}

        <canvas ref={canvasRef} className="hidden" />

        {/* HUD Overlay */}
        <div className="absolute inset-0 pointer-events-none border-[1px] border-nexus-500/20 m-4 rounded-lg">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-nexus-accent"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-nexus-accent"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-nexus-accent"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-nexus-accent"></div>
            
            {/* Center Reticle */}
            {!capturedImage && (
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 border border-nexus-accent/50 rounded-full flex items-center justify-center">
                    <div className="w-1 h-1 bg-nexus-accent rounded-full"></div>
                 </div>
            )}
           
           {analyzing && (
               <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                   <div className="flex flex-col items-center">
                       <Scan className="w-12 h-12 text-nexus-accent animate-pulse" />
                       <span className="mt-2 text-nexus-accent font-mono text-sm tracking-widest">SCANNING...</span>
                   </div>
               </div>
           )}
        </div>
      </div>

      {/* Analysis Output Panel */}
      {analysis && (
          <div className="bg-nexus-900 border-t border-nexus-700 p-4 max-h-[40%] overflow-y-auto">
              <h4 className="text-nexus-400 text-xs font-bold mb-2 uppercase tracking-wider flex items-center">
                  <Aperture className="w-3 h-3 mr-2" /> Analysis Result: <span className="text-nexus-accent ml-2">{PRESETS[selectedPreset].label}</span>
              </h4>
              <p className="text-gray-300 text-sm font-mono leading-relaxed whitespace-pre-wrap">
                  {analysis}
              </p>
          </div>
      )}

      {/* Controls */}
      <div className="bg-nexus-900 border-t border-nexus-800 p-4 flex flex-col items-center gap-4">
        
        {/* Presets - Only show when not captured for cleaner look */}
        {!capturedImage && (
            <div className="flex w-full justify-center gap-2">
                {(Object.keys(PRESETS) as PresetType[]).map((key) => {
                    const preset = PRESETS[key];
                    const Icon = preset.icon;
                    const isActive = selectedPreset === key;
                    return (
                        <button
                            key={key}
                            onClick={() => setSelectedPreset(key)}
                            className={`
                                flex items-center gap-2 px-3 py-2 rounded border transition-all duration-300
                                text-[10px] font-mono tracking-wider uppercase
                                ${isActive 
                                    ? 'bg-nexus-accent/20 border-nexus-accent text-nexus-accent shadow-[0_0_10px_rgba(0,240,255,0.2)]' 
                                    : 'bg-nexus-900/50 border-nexus-700 text-nexus-400 hover:border-nexus-500 hover:text-gray-200'}
                            `}
                        >
                            <Icon className="w-3 h-3" />
                            <span className="hidden sm:inline">{preset.label}</span>
                        </button>
                    )
                })}
            </div>
        )}

        <div className="flex justify-center gap-6">
            {capturedImage ? (
                <button onClick={reset} className="flex flex-col items-center text-nexus-400 hover:text-white transition">
                    <div className="w-12 h-12 rounded-full border border-nexus-500 flex items-center justify-center mb-1 bg-nexus-800 hover:bg-nexus-700">
                        <RefreshCw className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] uppercase">Reset</span>
                </button>
            ) : (
                <button onClick={captureAndAnalyze} className="flex flex-col items-center group">
                    <div className="w-16 h-16 rounded-full border-2 border-nexus-accent flex items-center justify-center mb-1 bg-nexus-accent/10 group-hover:bg-nexus-accent/20 transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)] cursor-pointer">
                        <div className="w-12 h-12 rounded-full bg-nexus-accent group-hover:scale-90 transition-transform"></div>
                    </div>
                    <span className="text-[10px] uppercase text-nexus-accent font-bold tracking-widest">Analyze</span>
                </button>
            )}
        </div>
      </div>
    </div>
  );
};