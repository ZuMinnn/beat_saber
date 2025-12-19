
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader, useProgress } from '@react-three/drei';
import { GameStatus, NoteData, Song, SaberConfig, COLORS } from './types';
import { SONGS, generateChartForSong, generateChartFromAudio } from './constants';
import { useMediaPipe } from './hooks/useMediaPipe';
import GameScene from './components/GameScene';
import WebcamPreview from './components/WebcamPreview';
import { Play, RefreshCw, VideoOff, Hand, Sparkles, Music, BarChart, Upload, FileAudio, Settings, Pause, Home, Zap, X, Activity, Clock, Tag, Trophy, LogIn, UserPlus } from 'lucide-react';
import { useUser } from './src/context/UserContext';
import { LoginModal } from './src/components/auth/LoginModal';
import { RegisterModal } from './src/components/auth/RegisterModal';
import { Leaderboard } from './src/components/Leaderboard';
import { ProfileMenu } from './src/components/ProfileMenu';
import { preferencesService } from './src/services/preferences.service';
import { scoreService } from './src/services/score.service';

const App: React.FC = () => {
    // User authentication
    const { user, isAuthenticated } = useUser();

    const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.LOADING);
    const [score, setScore] = useState(0);
    const [combo, setCombo] = useState(0);
    const [multiplier, setMultiplier] = useState(1);
    const [health, setHealth] = useState(100);

    // Saber Configuration State
    const [saberConfig, setSaberConfig] = useState<SaberConfig>({
        leftColor: COLORS.left,
        rightColor: COLORS.right,
        length: 1.2,
        thickness: 1.0
    });
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Auth & Leaderboard Modals
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);
    const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

    // Song Selection State
    const [selectedSong, setSelectedSong] = useState<Song>(SONGS[0]);
    const [activeChart, setActiveChart] = useState<NoteData[]>([]);

    // Custom Song State
    const [customSong, setCustomSong] = useState<Song | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize audio with the first song
    const audioRef = useRef<HTMLAudioElement>(new Audio(SONGS[0].url));
    const videoRef = useRef<HTMLVideoElement>(null);

    // Audio Context for SFX and Analysis
    const sfxContext = useRef<AudioContext | null>(null);

    const { isCameraReady, handPositionsRef, lastResultsRef, error: cameraError } = useMediaPipe(videoRef);
    const { progress } = useProgress();

    // Initialize SFX Context
    useEffect(() => {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
            sfxContext.current = new AudioContextClass();
        }
        return () => {
            sfxContext.current?.close();
        };
    }, []);

    const playHitSound = useCallback((good: boolean) => {
        if (!sfxContext.current) return;
        const ctx = sfxContext.current;
        if (ctx.state === 'suspended') ctx.resume().catch(() => { });

        const t = ctx.currentTime;
        const gain = ctx.createGain();
        gain.connect(ctx.destination);

        const osc = ctx.createOscillator();

        if (good) {
            // Pop sound: SINE wave with rapid pitch drop
            gain.gain.setValueAtTime(0.2, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, t);
            osc.frequency.exponentialRampToValueAtTime(100, t + 0.1);
        } else {
            // Miss: Noise-like low frequency
            gain.gain.setValueAtTime(0.15, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, t);
            osc.frequency.linearRampToValueAtTime(50, t + 0.1);
        }

        osc.connect(gain);
        osc.start(t);
        osc.stop(t + 0.1);
    }, []);

    // Update audio source when song changes
    useEffect(() => {
        if (audioRef.current) {
            // Pause if playing (though unlikely in IDLE state)
            audioRef.current.pause();
            audioRef.current.src = selectedSong.url;
            audioRef.current.load();
        }
    }, [selectedSong]);

    // Handle Pause/Resume Audio Effect
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (gameStatus === GameStatus.PAUSED) {
            audio.pause();
        } else if (gameStatus === GameStatus.PLAYING && audio.paused) {
            audio.play().catch(e => console.error("Resume failed", e));
        }
    }, [gameStatus]);

    // Load user preferences when authenticated
    useEffect(() => {
        if (isAuthenticated && user) {
            preferencesService.getPreferences()
                .then(prefs => {
                    setSaberConfig(prefs.saberConfig);
                })
                .catch(err => console.error('Failed to load preferences:', err));
        }
    }, [isAuthenticated, user]);

    // Save saber config to backend (debounced)
    useEffect(() => {
        if (!isAuthenticated) return;

        const timer = setTimeout(() => {
            preferencesService.updatePreferences({ saberConfig })
                .catch(err => console.error('Failed to save preferences:', err));
        }, 1000);

        return () => clearTimeout(timer);
    }, [saberConfig, isAuthenticated]);

    // Helper: Format Seconds to MM:SS
    const formatDuration = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // Handle Custom File Upload & Analysis
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsAnalyzing(true);

        try {
            const objectUrl = URL.createObjectURL(file);

            // 1. Decode Audio for Analysis
            const arrayBuffer = await file.arrayBuffer();
            if (!sfxContext.current) sfxContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();

            const audioBuffer = await sfxContext.current.decodeAudioData(arrayBuffer);

            // 2. Default BPM (can be adjusted by user)
            const detectedBpm = 120; // Auto-BPM detection is very complex, defaulting to 120 and letting user adjust

            // 3. Generate Chart based on Waveform
            const generatedChart = generateChartFromAudio(audioBuffer, detectedBpm, 'Medium');

            const newCustomSong: Song = {
                id: 'custom-track',
                title: file.name.replace(/\.[^/.]+$/, "").substring(0, 20),
                artist: 'YOU',
                bpm: detectedBpm,
                url: objectUrl,
                duration: audioBuffer.duration,
                difficulty: 'Medium',
                color: '#FAFF00',
                genre: 'Custom'
            };

            setCustomSong(newCustomSong);
            setSelectedSong(newCustomSong);
            setActiveChart(generatedChart);

            // Store the buffer/context for re-generation if BPM changes
            // For simplicity in this demo, we regenerator only on upload or major changes
        } catch (err) {
            console.error("Error analyzing audio:", err);
            alert("Could not analyze audio file.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const regenerateCustomChart = async (bpm: number, difficulty: 'Easy' | 'Medium' | 'Hard') => {
        if (!customSong || !fileInputRef.current?.files?.[0]) return;

        setIsAnalyzing(true);
        try {
            // Re-read file to get buffer (in a real app, we'd cache the buffer)
            const file = fileInputRef.current.files[0];
            const arrayBuffer = await file.arrayBuffer();
            if (!sfxContext.current) sfxContext.current = new AudioContext();
            const audioBuffer = await sfxContext.current.decodeAudioData(arrayBuffer);

            const newChart = generateChartFromAudio(audioBuffer, bpm, difficulty);
            setActiveChart(newChart);

            const updated = { ...customSong, bpm, difficulty };
            setCustomSong(updated);
            setSelectedSong(updated);
        } catch (e) {
            console.error(e);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Game Logic Handlers
    const handleNoteHit = useCallback((note: NoteData, goodCut: boolean) => {
        let points = 100;
        if (goodCut) points += 50;

        // Haptic feedback for impact
        if (navigator.vibrate) {
            navigator.vibrate(goodCut ? 40 : 20);
        }

        // Play SFX
        playHitSound(goodCut);

        setCombo(c => {
            const newCombo = c + 1;
            if (newCombo > 30) setMultiplier(8);
            else if (newCombo > 20) setMultiplier(4);
            else if (newCombo > 10) setMultiplier(2);
            else setMultiplier(1);
            return newCombo;
        });

        setScore(s => s + (points * multiplier));
        setHealth(h => Math.min(100, h + 2));
    }, [multiplier, playHitSound]);

    const handleNoteMiss = useCallback((note: NoteData) => {
        setCombo(0);
        setMultiplier(1);
        setHealth(h => {
            const newHealth = h - 15;
            if (newHealth <= 0) {
                setTimeout(() => endGame(false), 0);
                return 0;
            }
            return newHealth;
        });
    }, []);

    const startGame = async () => {
        if (!isCameraReady) return;

        // Ensure SFX context is running on user interaction
        if (sfxContext.current && sfxContext.current.state === 'suspended') {
            sfxContext.current.resume();
        }

        // If it's a built-in song, generate chart now. If custom, we already have activeChart.
        if (selectedSong.id !== 'custom-track') {
            const newChart = generateChartForSong(selectedSong);
            setActiveChart(newChart);
        }

        setScore(0);
        setCombo(0);
        setMultiplier(1);
        setHealth(100);

        try {
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                // We set status to PLAYING, the effect above will trigger audio.play()
                setGameStatus(GameStatus.PLAYING);
            }
        } catch (e) {
            console.error("Audio play failed", e);
            alert("Could not start audio. Please interact with the page first.");
        }
    };

    const togglePause = () => {
        if (gameStatus === GameStatus.PLAYING) {
            setGameStatus(GameStatus.PAUSED);
        } else if (gameStatus === GameStatus.PAUSED) {
            setGameStatus(GameStatus.PLAYING);
        }
    };

    const endGame = async (victory: boolean) => {
        setGameStatus(victory ? GameStatus.VICTORY : GameStatus.GAME_OVER);
        if (audioRef.current) {
            audioRef.current.pause();
        }

        // Save score to backend if authenticated
        if (isAuthenticated && user && activeChart.length > 0) {
            const totalNotes = activeChart.length;
            const notesHit = Math.floor(totalNotes * (health / 100)); // Estimate based on health
            const notesMissed = totalNotes - notesHit;
            const accuracy = (notesHit / totalNotes) * 100;
            const rank = score > 50000 ? 'S' : score > 20000 ? 'A' : score > 5000 ? 'B' : score > 1000 ? 'C' : 'D';

            try {
                await scoreService.saveScore({
                    songId: selectedSong.id,
                    songTitle: selectedSong.title,
                    songArtist: selectedSong.artist,
                    songDifficulty: selectedSong.difficulty,
                    score,
                    maxCombo: combo,
                    multiplier,
                    accuracy,
                    notesHit,
                    notesMissed,
                    totalNotes,
                    rank: rank as 'S' | 'A' | 'B' | 'C' | 'D',
                    gameEndedSuccessfully: victory
                });
                console.log('Score saved successfully!');
            } catch (error) {
                console.error('Failed to save score:', error);
            }
        }
    };

    const returnToMenu = () => {
        setGameStatus(GameStatus.IDLE);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    };

    useEffect(() => {
        if (gameStatus === GameStatus.LOADING && isCameraReady) {
            setGameStatus(GameStatus.IDLE);
        }
    }, [isCameraReady, gameStatus]);

    // Neo-Brutalist Component Styles
    const boxStyle = "bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-black";
    const btnStyle = "bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none uppercase font-bold tracking-tight text-black";

    // Explicit colors for difficulty to ensure visibility against white/yellow backgrounds
    const getDifficultyBadgeStyle = (diff: string) => {
        const base = "border-2 border-black px-2 py-0.5 text-xs font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black ml-auto";
        if (diff === 'Easy') return `${base} bg-[#00F0FF]`; // Cyan
        if (diff === 'Medium') return `${base} bg-[#FFA500]`; // Orange
        return `${base} bg-[#FF0099] text-white`; // Hot Pink
    };

    return (
        <div className="relative w-full h-screen bg-[#1a0b2e] overflow-hidden font-sans select-none text-black">
            {/* Hidden Video for Processing */}
            <video
                ref={videoRef}
                className="absolute opacity-0 pointer-events-none"
                playsInline
                muted
                autoPlay
                style={{ width: '640px', height: '480px' }}
            />

            {/* Hidden File Input */}
            <input
                type="file"
                accept="audio/*"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
            />

            {/* 3D Canvas */}
            <Canvas shadows dpr={[1, 2]}>
                {gameStatus !== GameStatus.LOADING && (
                    <GameScene
                        gameStatus={gameStatus}
                        audioRef={audioRef}
                        handPositionsRef={handPositionsRef}
                        chart={activeChart}
                        song={selectedSong}
                        onNoteHit={handleNoteHit}
                        onNoteMiss={handleNoteMiss}
                        onSongEnd={() => endGame(true)}
                        saberConfig={saberConfig}
                    />
                )}
            </Canvas>

            {/* Webcam Mini-Map Preview */}
            <WebcamPreview
                videoRef={videoRef}
                resultsRef={lastResultsRef}
                isCameraReady={isCameraReady}
                leftColor={saberConfig.leftColor}
                rightColor={saberConfig.rightColor}
            />

            {/* Settings Modal - Redesigned for readability */}
            {isSettingsOpen && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className={`${boxStyle} p-0 max-w-lg w-full bg-white relative text-black`}>
                        {/* Header */}
                        <div className="bg-[#FAFF00] p-6 border-b-4 border-black flex justify-between items-center">
                            <h2 className="text-4xl font-black italic text-black tracking-tight">CUSTOMIZE</h2>
                            <button
                                onClick={() => setIsSettingsOpen(false)}
                                className="p-2 border-2 border-black bg-white hover:bg-black hover:text-white transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Controls */}
                        <div className="p-8 space-y-8 bg-white">
                            {/* Colors */}
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="font-bold block mb-2 uppercase text-sm text-black border-l-4 border-[#FF0099] pl-2">Left Color</label>
                                    <div className="relative border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] h-12 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                                        <input
                                            type="color"
                                            value={saberConfig.leftColor}
                                            onChange={e => setSaberConfig({ ...saberConfig, leftColor: e.target.value })}
                                            className="w-full h-full opacity-0 cursor-pointer absolute z-10"
                                        />
                                        <div className="absolute inset-0" style={{ backgroundColor: saberConfig.leftColor }}></div>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <label className="font-bold block mb-2 uppercase text-sm text-black border-l-4 border-[#00F0FF] pl-2">Right Color</label>
                                    <div className="relative border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] h-12 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                                        <input
                                            type="color"
                                            value={saberConfig.rightColor}
                                            onChange={e => setSaberConfig({ ...saberConfig, rightColor: e.target.value })}
                                            className="w-full h-full opacity-0 cursor-pointer absolute z-10"
                                        />
                                        <div className="absolute inset-0" style={{ backgroundColor: saberConfig.rightColor }}></div>
                                    </div>
                                </div>
                            </div>

                            {/* Length */}
                            <div className="bg-gray-50 p-4 border-2 border-black">
                                <label className="font-bold mb-2 flex justify-between uppercase text-sm text-black">
                                    <span>Blade Length</span>
                                    <span className="font-mono bg-black text-white px-2 py-0.5 text-xs">{saberConfig.length.toFixed(1)}</span>
                                </label>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="2.0"
                                    step="0.1"
                                    value={saberConfig.length}
                                    onChange={e => setSaberConfig({ ...saberConfig, length: parseFloat(e.target.value) })}
                                    className="w-full h-4 bg-white border-2 border-black appearance-none accent-black cursor-pointer"
                                />
                            </div>

                            {/* Thickness */}
                            <div className="bg-gray-50 p-4 border-2 border-black">
                                <label className="font-bold mb-2 flex justify-between uppercase text-sm text-black">
                                    <span>Thickness</span>
                                    <span className="font-mono bg-black text-white px-2 py-0.5 text-xs">{saberConfig.thickness.toFixed(1)}x</span>
                                </label>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="2.0"
                                    step="0.1"
                                    value={saberConfig.thickness}
                                    onChange={e => setSaberConfig({ ...saberConfig, thickness: parseFloat(e.target.value) })}
                                    className="w-full h-4 bg-white border-2 border-black appearance-none accent-black cursor-pointer"
                                />
                            </div>

                            <button onClick={() => setIsSettingsOpen(false)} className={`${btnStyle} w-full py-4 bg-gray text-black hover:bg-white-800 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]`}>
                                SAVE CHANGES
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* UI Overlay */}
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10">

                {/* HUD (Top) */}
                <div className="flex justify-between items-start w-full">
                    {/* Health & Song Info */}
                    <div className={`transition-all duration-300 transform ${gameStatus === GameStatus.IDLE ? '-translate-y-40' : 'translate-y-0'}`}>
                        <div className={`${boxStyle} p-4 max-w-xs rotate-1`}>
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-bold text-lg uppercase leading-none text-black truncate max-w-[150px]">{selectedSong.title}</span>
                                <span className={`${getDifficultyBadgeStyle(selectedSong.difficulty)} animate-pulse ml-2`}>LIVE</span>
                            </div>
                            <div className="w-full h-6 border-2 border-black bg-gray-200 relative">
                                <div
                                    className="h-full transition-all duration-300"
                                    style={{ width: `${health}%`, backgroundColor: saberConfig.leftColor }}
                                />
                                {/* Stripe pattern overlay */}
                                <div className="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzjwqonyABJwcXFhDNABGAYAYi4IA6u25X4AAAAASUVORK5CYII=')] opacity-20"></div>
                            </div>
                            <div className="flex justify-between text-xs font-bold mt-1 text-black">
                                <span>CRITICAL</span>
                                <span>STABLE</span>
                            </div>
                        </div>
                    </div>

                    {/* Score & Combo */}
                    <div className={`transition-all duration-300 transform flex flex-col items-end ${gameStatus === GameStatus.IDLE ? '-translate-y-40' : 'translate-y-0'}`}>
                        <div className={`${boxStyle} p-4 -rotate-1 text-center min-w-[200px]`}>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-[-5px]">Score</p>
                            <h1 className="text-6xl font-black tracking-tighter text-black leading-none">
                                {score.toLocaleString()}
                            </h1>
                        </div>

                        {(combo > 0) && (
                            <div className="mt-4 mr-2">
                                <div className={`bg-[#00F0FF] border-4 border-black p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-2 animate-bounce`}>
                                    <p className="text-3xl font-black italic text-black">{combo}x COMBO</p>
                                </div>
                                {multiplier > 1 && (
                                    <div className="mt-1 flex justify-end">
                                        <span className="bg-black text-white text-xs px-2 py-1 font-mono">{multiplier}X MULTIPLIER</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Auth / Profile Menu */}
                    <div className={`pointer-events-auto absolute top-6 right-6 transition-opacity duration-300 ${gameStatus === GameStatus.IDLE ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        {isAuthenticated ? (
                            <ProfileMenu />
                        ) : (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsLoginOpen(true)}
                                    className="flex items-center gap-2 bg-cyan-400 hover:bg-cyan-300 text-black font-bold py-2 px-4 border-4 border-black transition-colors"
                                >
                                    <LogIn size={20} />
                                    <span className="hidden sm:inline">Login</span>
                                </button>
                                <button
                                    onClick={() => setIsRegisterOpen(true)}
                                    className="flex items-center gap-2 bg-pink-400 hover:bg-pink-300 text-black font-bold py-2 px-4 border-4 border-black transition-colors"
                                >
                                    <UserPlus size={20} />
                                    <span className="hidden sm:inline">Register</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Pause Button */}
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-auto">
                        {(gameStatus === GameStatus.PLAYING || gameStatus === GameStatus.PAUSED) && (
                            <button
                                onClick={togglePause}
                                className={`${btnStyle} rounded-full p-4 bg-white`}
                            >
                                {gameStatus === GameStatus.PAUSED ? <Play fill="black" /> : <Pause fill="black" />}
                            </button>
                        )}
                    </div>
                </div>

                {/* Menus (Centered) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">

                    {/* Loading Screen */}
                    {gameStatus === GameStatus.LOADING && (
                        <div className={`${boxStyle} p-12 flex flex-col items-center bg-[#FAFF00] pointer-events-auto`}>
                            <div className="animate-spin h-16 w-16 border-8 border-black border-t-transparent rounded-full mb-6"></div>
                            <h2 className="text-4xl font-black mb-2 uppercase italic text-black">Loading...</h2>
                            <p className="font-mono bg-black text-white px-2 py-1">{!isCameraReady ? "WAITING FOR CAMERA" : "PREPARING ASSETS"}</p>
                            {cameraError && <p className="mt-4 bg-red-500 border-2 border-black text-white px-4 py-2 font-bold">{cameraError}</p>}
                        </div>
                    )}

                    {/* Pause Menu */}
                    {gameStatus === GameStatus.PAUSED && (
                        <div className={`${boxStyle} p-8 flex flex-col gap-4 min-w-[300px] pointer-events-auto bg-white`}>
                            <h2 className="text-5xl font-black italic text-center text-black mb-4">PAUSED</h2>

                            <button onClick={togglePause} className={`${btnStyle} py-4 text-xl flex items-center justify-center gap-2 bg-[#00F0FF] text-black`}>
                                <Play className="w-6 h-6" fill="currentColor" /> RESUME
                            </button>

                            <button onClick={startGame} className={`${btnStyle} py-4 text-xl flex items-center justify-center gap-2 text-black hover:bg-gray-100`}>
                                <RefreshCw className="w-6 h-6" /> RESTART
                            </button>

                            <button onClick={returnToMenu} className={`${btnStyle} py-4 text-xl flex items-center justify-center gap-2 bg-[#FF0099] text-white`}>
                                <Home className="w-6 h-6" /> QUIT
                            </button>
                        </div>
                    )}

                    {/* Main Menu */}
                    {gameStatus === GameStatus.IDLE && !isSettingsOpen && (
                        <div className="flex flex-col w-full max-w-6xl h-full p-8 pt-16 pointer-events-auto">

                            {/* Logo Section */}
                            <div className="mb-12 relative">
                                <div className="absolute -top-10 -left-10 w-32 h-32 bg-[#FAFF00] rounded-full mix-blend-multiply opacity-50 blur-2xl"></div>
                                <h1 className="text-8xl md:text-9xl font-black text-white tracking-tighter italic drop-shadow-[8px_8px_0px_#000]">
                                    RHYTHM
                                    <br />
                                    <span className="text-[#00F0FF] drop-shadow-[8px_8px_0px_#000] text-stroke-3">SLASHER</span>
                                </h1>
                                <div className="bg-white border-2 border-black px-4 py-1 absolute top-0 left-86 rotate-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hidden md:block">
                                    <p className="font-bold text-sm text-black">VER 2.0</p>
                                </div>
                            </div>

                            {/* Content Grid */}
                            <div className="flex flex-col md:flex-row gap-8 flex-1 min-h-0">

                                {/* Song List (Scrollable) */}
                                <div className="flex-1 overflow-y-auto pr-4 space-y-4 pb-4">
                                    <div className="sticky top-0 z-20 pb-4">
                                        <h3 className="text-white font-bold text-2xl flex items-center gap-2 bg-black w-fit px-4 py-1 border-l-4 border-[#FF0099] shadow-[4px_4px_0px_0px_#FFF]">
                                            <Music className="w-5 h-5" /> SELECT TRACK
                                        </h3>
                                    </div>

                                    {SONGS.map(song => (
                                        <button
                                            key={song.id}
                                            onClick={() => setSelectedSong(song)}
                                            className={`w-full text-left group transition-all duration-200 border-4 border-black relative
                                        ${selectedSong.id === song.id
                                                    ? 'bg-[#FAFF00] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] translate-x-[-4px] translate-y-[-4px]'
                                                    : 'bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'}
                                      `}
                                        >
                                            <div className="p-4 flex justify-between items-center relative overflow-hidden">
                                                {/* Decorative corner */}
                                                <div className={`absolute top-0 right-0 w-8 h-8 rotate-45 translate-x-4 -translate-y-4 border-2 border-black ${selectedSong.id === song.id ? 'bg-black' : 'bg-[#FF0099]'}`}></div>

                                                <div>
                                                    <h3 className="font-black text-2xl uppercase italic text-black leading-none mb-1">{song.title}</h3>
                                                    <p className="font-bold text-sm text-black opacity-80">{song.artist}</p>
                                                </div>
                                                <div className="text-right z-10 flex flex-col items-end gap-1">
                                                    <span className="block font-mono text-xs font-bold bg-black text-white px-1 py-0.5">{song.bpm} BPM</span>
                                                    <span className={getDifficultyBadgeStyle(song.difficulty)}>
                                                        {song.difficulty}
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    ))}

                                    {/* Custom Song Upload */}
                                    <div
                                        className={`w-full p-4 border-4 border-black cursor-pointer transition-all flex flex-col items-center justify-center gap-2 min-h-[100px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px]
                                    ${selectedSong.id === 'custom-track' ? 'bg-[#FAFF00]' : 'bg-white'}
                                 `}
                                        onClick={() => !customSong ? fileInputRef.current?.click() : setSelectedSong(customSong)}
                                    >
                                        {!customSong ? (
                                            <>
                                                {isAnalyzing ? (
                                                    <div className="flex flex-col items-center">
                                                        <Activity className="w-8 h-8 text-[#FF0099] animate-bounce" />
                                                        <span className="font-bold uppercase text-black text-sm mt-1">ANALYZING WAVEFORM...</span>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <Upload className="w-8 h-8 text-black" />
                                                        <span className="font-bold uppercase text-black">Upload MP3</span>
                                                        <span className="text-[10px] font-mono text-gray-500 uppercase">AI Level Gen</span>
                                                    </>
                                                )}
                                            </>
                                        ) : (
                                            <div className="w-full text-black">
                                                <div className="flex justify-between items-center mb-2 border-b-2 border-black pb-1">
                                                    <span className="font-bold truncate uppercase max-w-[150px]">{customSong.title}</span>
                                                    <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }} className="bg-black text-white p-1 hover:bg-gray-800"><RefreshCw size={14} /></button>
                                                </div>

                                                {/* Song Info & Editor */}
                                                {selectedSong.id === 'custom-track' && (
                                                    <div className="space-y-2 mt-2" onClick={e => e.stopPropagation()}>
                                                        {/* Row 1: BPM & Diff */}
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <label className="text-[10px] font-bold block mb-1">BPM</label>
                                                                <input
                                                                    type="number"
                                                                    className="w-full p-1 text-black font-mono text-sm border-2 border-black bg-white focus:bg-gray-50 outline-none"
                                                                    value={customSong.bpm}
                                                                    onChange={(e) => regenerateCustomChart(Number(e.target.value), customSong.difficulty)}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-bold block mb-1">DIFFICULTY</label>
                                                                <select
                                                                    className="w-full p-1 text-black font-bold text-sm border-2 border-black bg-white outline-none cursor-pointer"
                                                                    value={customSong.difficulty}
                                                                    onChange={(e) => regenerateCustomChart(customSong.bpm, e.target.value as any)}
                                                                >
                                                                    <option value="Easy">EASY</option>
                                                                    <option value="Medium">MED</option>
                                                                    <option value="Hard">HARD</option>
                                                                </select>
                                                            </div>
                                                        </div>

                                                        {/* Row 2: Genre */}
                                                        <div>
                                                            <label className="text-[10px] font-bold block mb-1">GENRE</label>
                                                            <input
                                                                type="text"
                                                                placeholder="GENRE"
                                                                className="w-full p-1 text-black font-bold text-sm border-2 border-black bg-white focus:bg-gray-50 outline-none uppercase placeholder:text-gray-400"
                                                                value={customSong.genre || ''}
                                                                onChange={(e) => {
                                                                    const updated = { ...customSong, genre: e.target.value };
                                                                    setCustomSong(updated);
                                                                    setSelectedSong(updated);
                                                                }}
                                                            />
                                                        </div>

                                                        {/* Row 3: Duration */}
                                                        <div className="flex items-center gap-1 text-[10px] font-mono bg-black text-white px-2 py-1 w-fit">
                                                            <Clock size={10} /> {formatDuration(customSong.duration)}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="mt-2 text-[10px] font-mono uppercase text-[#00F0FF] bg-black px-1 w-fit">
                                                    WAVEFORM SYNCED
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                </div>

                                {/* Right Panel: Start & Status */}
                                <div className="flex-1 flex flex-col justify-end gap-6 items-center md:items-end p-2 pointer-events-none">

                                    <div className={`${boxStyle} p-6 w-full max-w-md bg-[#00F0FF] rotate-1 text-black pointer-events-auto`}>
                                        <h4 className="font-bold text-sm mb-2 uppercase border-b-4 border-black pb-1 text-black">Current Selection</h4>
                                        <div className="flex items-end justify-between">
                                            <div className="text-4xl font-black italic text-black leading-tight break-words">{selectedSong.title}</div>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-4">
                                            <div className="bg-black text-white px-3 py-1 font-bold text-sm border-2 border-black">
                                                {selectedSong.bpm} BPM
                                            </div>
                                            <div className={`px-3 py-1 font-bold text-sm border-2 border-black bg-white text-black uppercase`}>
                                                {selectedSong.difficulty}
                                            </div>
                                            {/* Display Genre if Available */}
                                            <div className="bg-white text-black px-3 py-1 font-bold text-sm border-2 border-black uppercase flex items-center gap-1">
                                                <Tag size={12} />
                                                {selectedSong.genre || 'ELECTRONIC'}
                                            </div>
                                            {/* Display Duration */}
                                            <div className="bg-white text-black px-3 py-1 font-bold text-sm border-2 border-black uppercase flex items-center gap-1">
                                                <Clock size={12} />
                                                {formatDuration(selectedSong.duration)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-full flex gap-4 justify-end max-w-md pointer-events-auto">
                                        <button
                                            onClick={() => setIsLeaderboardOpen(true)}
                                            className="flex-1 max-w-[120px] bg-yellow-300 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all flex flex-col items-center justify-center font-bold p-2 text-black"
                                        >
                                            <Trophy className="w-8 h-8 mb-1" />
                                            <span className="text-xs uppercase">Scores</span>
                                        </button>

                                        <button
                                            onClick={() => setIsSettingsOpen(true)}
                                            className="flex-1 max-w-[120px] bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all flex flex-col items-center justify-center font-bold p-2 text-black"
                                        >
                                            <Settings className="w-8 h-8 mb-1" />
                                            <span className="text-xs uppercase">Settings</span>
                                        </button>

                                        {!isCameraReady ? (
                                            <div className="flex-1 bg-black text-red-500 font-mono p-4 border-4 border-red-500 animate-pulse flex items-center justify-center text-center font-bold">
                                                {'>> WAITING FOR VIDEO...'}
                                            </div>
                                        ) : (
                                            <button
                                                onClick={startGame}
                                                disabled={isAnalyzing}
                                                className={`flex-1 group bg-[#FF0099] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-white text-4xl font-black italic py-6 px-8 hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[12px_12px_0px_0px_#FFF] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all flex items-center justify-between ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                <span>{isAnalyzing ? '...' : 'START'}</span>
                                                <Play className="w-12 h-12 fill-current" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 text-white/40 font-mono text-xs">
                                FLEX BY @ZUMINN // POWERED BY REACT + THREE.JS
                            </div>
                        </div>
                    )}

                    {/* End Game Screens */}
                    {(gameStatus === GameStatus.GAME_OVER || gameStatus === GameStatus.VICTORY) && (
                        <div className={`${boxStyle} p-0 max-w-lg w-full overflow-hidden flex flex-col pointer-events-auto`}>
                            <div className={`p-8 text-center border-b-4 border-black ${gameStatus === GameStatus.VICTORY ? 'bg-[#FAFF00] text-black' : 'bg-red-500 text-white'}`}>
                                <h2 className="text-7xl font-black italic uppercase tracking-tighter">
                                    {gameStatus === GameStatus.VICTORY ? "CLEARED!" : "WIPEOUT"}
                                </h2>
                            </div>

                            <div className="p-8 bg-white flex flex-col gap-6 text-black">
                                <div className="flex justify-between items-end border-b-2 border-gray-200 pb-2">
                                    <span className="font-bold text-gray-400 uppercase">Final Score</span>
                                    <span className="text-5xl font-black">{score.toLocaleString()}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-100 p-4 border-2 border-black">
                                        <span className="block text-xs font-bold text-gray-500 uppercase">Max Combo</span>
                                        <span className="text-2xl font-black text-[#00F0FF]">{combo}</span>
                                    </div>
                                    <div className="bg-gray-100 p-4 border-2 border-black">
                                        <span className="block text-xs font-bold text-gray-500 uppercase">Rank</span>
                                        <span className="text-2xl font-black text-[#FF0099]">
                                            {score > 50000 ? 'S' : score > 20000 ? 'A' : score > 5000 ? 'B' : 'C'}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={returnToMenu}
                                    className={`${btnStyle} bg-black text-white w-full py-4 text-xl flex items-center justify-center gap-2 hover:bg-gray-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]`}
                                >
                                    <RefreshCw /> PLAY AGAIN
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <LoginModal
                isOpen={isLoginOpen}
                onClose={() => setIsLoginOpen(false)}
                onSwitchToRegister={() => {
                    setIsLoginOpen(false);
                    setIsRegisterOpen(true);
                }}
            />

            <RegisterModal
                isOpen={isRegisterOpen}
                onClose={() => setIsRegisterOpen(false)}
                onSwitchToLogin={() => {
                    setIsRegisterOpen(false);
                    setIsLoginOpen(true);
                }}
            />

            <Leaderboard
                isOpen={isLeaderboardOpen}
                onClose={() => setIsLeaderboardOpen(false)}
                song={selectedSong}
            />
        </div>
    );
};

export default App;
