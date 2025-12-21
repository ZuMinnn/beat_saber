import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            const isWebGLError = this.state.error?.message.includes('WebGL') ||
                this.state.error?.message.includes('Context');

            return (
                <div className="flex flex-col items-center justify-center w-full h-full bg-[#1a0b2e] text-white p-8 pointer-events-auto z-50">
                    <div className="bg-white text-black border-4 border-black p-8 max-w-lg w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                        <h1 className="text-4xl font-black italic mb-4 uppercase">CRITICAL FAILURE</h1>

                        {isWebGLError ? (
                            <>
                                <div className="bg-[#FF0099] text-white p-4 font-bold border-2 border-black mb-4">
                                    GRAPHICS ACCELERATION UNAVAILABLE
                                </div>
                                <p className="font-bold mb-4">
                                    The game engine could not start because WebGL is disabled or not supported by your device.
                                </p>
                                <ul className="list-disc list-inside space-y-2 font-mono text-sm bg-gray-100 p-4 border-2 border-black mb-6">
                                    <li>Check "Use hardware acceleration" in browser settings</li>
                                    <li>Update your graphics drivers</li>
                                    <li>Try a different browser (Chrome/Edge recommended)</li>
                                </ul>
                            </>
                        ) : (
                            <>
                                <div className="bg-[#FFA500] text-black p-4 font-bold border-2 border-black mb-4">
                                    APPLICATION CRASHED
                                </div>
                                <p className="font-bold mb-2">Something went wrong:</p>
                                <code className="block bg-black text-[#00F0FF] p-4 font-mono text-xs overflow-auto mb-6 max-h-32">
                                    {this.state.error?.message || 'Unknown Error'}
                                </code>
                            </>
                        )}

                        <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-[#00F0FF] hover:bg-[#00D0DF] text-black font-black uppercase py-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                        >
                            System Reboot (Reload)
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
