import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { base64ToBytes, decodeAudioData, createPcmBlob } from '../services/audio';

interface UseLiveAPIProps {
  onTranscript?: (text: string, isUser: boolean) => void;
}

export const useLiveAPI = ({ onTranscript }: UseLiveAPIProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);

  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourceNodesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const connect = useCallback(async () => {
    if (isConnected) return;

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Initialize Audio Contexts
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const outputNode = outputAudioContextRef.current!.createGain();
      outputNode.connect(outputAudioContextRef.current!.destination);

      // Get Microphone Stream
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log('Gemini Live Connection Opened');
            setIsConnected(true);

            // Setup Input Streaming
            if (inputAudioContextRef.current && streamRef.current) {
              inputSourceRef.current = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
              processorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
              
              processorRef.current.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                
                // Calculate volume for visualization
                let sum = 0;
                for(let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
                const rms = Math.sqrt(sum / inputData.length);
                setVolumeLevel(Math.min(rms * 5, 1)); // Scale up a bit

                const pcmBlob = createPcmBlob(inputData);
                sessionPromise.then(session => {
                  session.sendRealtimeInput({ media: pcmBlob });
                });
              };

              inputSourceRef.current.connect(processorRef.current);
              processorRef.current.connect(inputAudioContextRef.current.destination);
            }
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
              setIsSpeaking(true);
              const base64Audio = message.serverContent.modelTurn.parts[0].inlineData.data;
              
              if (outputAudioContextRef.current) {
                 // Update playback cursor
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
                
                const audioBuffer = await decodeAudioData(
                  base64ToBytes(base64Audio),
                  outputAudioContextRef.current,
                  24000,
                  1
                );

                const source = outputAudioContextRef.current.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputNode);
                source.start(nextStartTimeRef.current);
                
                nextStartTimeRef.current += audioBuffer.duration;
                sourceNodesRef.current.add(source);
                
                source.onended = () => {
                  sourceNodesRef.current.delete(source);
                  if (sourceNodesRef.current.size === 0) setIsSpeaking(false);
                };
              }
            }

            // Handle Transcripts
            if (message.serverContent?.outputTranscription?.text) {
               onTranscript?.(message.serverContent.outputTranscription.text, false);
            }
            if (message.serverContent?.inputTranscription?.text) {
               onTranscript?.(message.serverContent.inputTranscription.text, true);
            }

            // Handle Interruptions
            if (message.serverContent?.interrupted) {
              console.log('Interrupted');
              sourceNodesRef.current.forEach(node => {
                try { node.stop(); } catch(e) {}
              });
              sourceNodesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsSpeaking(false);
            }
          },
          onclose: () => {
            console.log('Gemini Live Connection Closed');
            setIsConnected(false);
            setIsSpeaking(false);
          },
          onerror: (err) => {
            console.error('Gemini Live Error:', err);
            setIsConnected(false);
            setIsSpeaking(false);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: "You are NEXUS, an advanced AI operating system interface. You are efficient, helpful, and speak with a professional yet conversational tone. Keep responses concise suitable for voice interaction.",
        }
      });

      sessionPromiseRef.current = sessionPromise;

    } catch (error) {
      console.error("Failed to connect:", error);
      setIsConnected(false);
    }
  }, [isConnected, onTranscript]);

  const disconnect = useCallback(() => {
    if (sessionPromiseRef.current) {
        // There is no explicit .close() on the session object from `ai.live.connect` result directly in the types 
        // provided, but the doc says "use session.close()". 
        // The sessionPromise resolves to the session.
        sessionPromiseRef.current.then(session => {
             // Use type assertion if close is missing in definition but present in runtime, or check docs.
             // Docs says: session.close().
             if (typeof (session as any).close === 'function') {
                (session as any).close();
             }
        });
    }
    
    // Cleanup Audio
    streamRef.current?.getTracks().forEach(t => t.stop());
    processorRef.current?.disconnect();
    inputSourceRef.current?.disconnect();
    inputAudioContextRef.current?.close();
    outputAudioContextRef.current?.close();
    sourceNodesRef.current.forEach(n => n.stop());
    sourceNodesRef.current.clear();

    setIsConnected(false);
    setIsSpeaking(false);
    setVolumeLevel(0);
  }, []);

  return { connect, disconnect, isConnected, isSpeaking, volumeLevel };
};
