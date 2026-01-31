import { createSignal, onMount, onCleanup, type Component } from "solid-js";

type InfoTab = 'community' | 'shortcuts';

interface InfoPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

const InfoPanel: Component<InfoPanelProps> = (props) => {
    const [activeTab, setActiveTab] = createSignal<InfoTab>('community');
    const [position, setPosition] = createSignal({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = createSignal(false);
    const [dragOffset, setDragOffset] = createSignal({ x: 0, y: 0 });

    onMount(() => {
        const panelWidth = 320;
        const panelHeight = 380;
        const x = (window.innerWidth - panelWidth) / 2;
        const y = (window.innerHeight - panelHeight) / 2;
        setPosition({ x: Math.max(0, x), y: Math.max(0, y) });
    });

    const startDrag = (e: MouseEvent) => {
        setIsDragging(true);
        setDragOffset({ x: e.clientX - position().x, y: e.clientY - position().y });
    };

    const onDrag = (e: MouseEvent) => {
        if (isDragging()) {
            const panelWidth = 320;
            const panelHeight = 400;
            const maxX = window.innerWidth - panelWidth;
            const maxY = window.innerHeight - panelHeight;

            let newX = e.clientX - dragOffset().x;
            let newY = e.clientY - dragOffset().y;

            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max(0, Math.min(newY, maxY));

            setPosition({ x: newX, y: newY });
        }
    };

    const stopDrag = () => {
        setIsDragging(false);
    };

    onMount(() => {
        window.addEventListener('mousemove', onDrag);
        window.addEventListener('mouseup', stopDrag);
    });

    onCleanup(() => {
        window.removeEventListener('mousemove', onDrag);
        window.removeEventListener('mouseup', stopDrag);
    });

    return (
        <div
            class={`fixed z-50 transition-opacity duration-300 ${props.isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            style={{ left: `${position().x}px`, top: `${position().y}px` }}
        >
            <div class="bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden w-[320px] shadow-2xl">
                <div
                    class="flex items-center p-2 bg-white/5 border-b border-white/5 pr-3 cursor-move select-none"
                    onMouseDown={startDrag}
                >
                    <div class="flex-1 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white/40 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div class="flex-1 flex items-center justify-center">
                        <button
                            class={`btn btn-xs rounded-full px-3 mx-1 border-0 ${activeTab() === 'community' ? 'bg-primary text-primary-content' : 'btn-ghost text-white/50 hover:text-white'}`}
                            onClick={(e) => { e.stopPropagation(); setActiveTab('community'); }}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <span class="text-[10px] font-bold uppercase tracking-wider">Notice</span>
                        </button>
                        <button
                            class={`btn btn-xs rounded-full px-3 mx-1 border-0 ${activeTab() === 'shortcuts' ? 'bg-primary text-primary-content' : 'btn-ghost text-white/50 hover:text-white'}`}
                            onClick={(e) => { e.stopPropagation(); setActiveTab('shortcuts'); }}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <span class="text-[10px] font-bold uppercase tracking-wider">Keys</span>
                        </button>
                    </div>
                    <div class="flex-1 flex justify-end">
                        <button
                            class="btn btn-xs btn-ghost btn-circle text-white/40 hover:text-white"
                            onClick={(e) => { e.stopPropagation(); props.onClose(); }}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            ✕
                        </button>
                    </div>
                </div>

                <div class="relative h-[340px] overflow-hidden">
                    <div class={`h-full transition-opacity duration-300 ${activeTab() === 'community' ? 'block' : 'hidden'}`}>
                        <div class="p-6 h-full flex flex-col justify-between overflow-y-auto custom-scrollbar">
                            <div class="space-y-4">
                                <h3 class="text-xl font-bold text-white tracking-wide text-center">Community Notice</h3>
                                <div class="text-white/70 text-sm leading-relaxed space-y-4">
                                    <p>
                                        Welcome to <strong>Lofi Station</strong>! This project is open for community contributions.
                                    </p>
                                    <ul class="list-disc pl-5 space-y-2">
                                        <li>Feel free to <strong>submit PRs</strong> to add your favorite channels or new features.</li>
                                        <li>Let me know if you spot any <strong>broken channels</strong> or bugs.</li>
                                    </ul>
                                </div>
                            </div>
                            <div class="mt-4 pt-4 border-t border-white/10 text-center">
                                <p class="text-white/50 text-xs">
                                    Let's build the best chill space together.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div class={`h-full transition-opacity duration-300 ${activeTab() === 'shortcuts' ? 'block' : 'hidden'}`}>
                        <div class="p-6 h-full overflow-y-auto custom-scrollbar">
                            <h3 class="text-xl font-bold text-white tracking-wide text-center mb-6">Keyboard Shortcuts</h3>
                            <div class="space-y-3">
                                <div class="flex items-center justify-between">
                                    <span class="text-white/70 text-sm">Mute / Unmute</span>
                                    <kbd class="kbd kbd-sm text-xs">Space</kbd>
                                </div>
                                <div class="flex items-center justify-between">
                                    <span class="text-white/70 text-sm">Volume Up</span>
                                    <kbd class="kbd kbd-sm text-xs">↑</kbd>
                                </div>
                                <div class="flex items-center justify-between">
                                    <span class="text-white/70 text-sm">Volume Down</span>
                                    <kbd class="kbd kbd-sm text-xs">↓</kbd>
                                </div>
                                <div class="flex items-center justify-between">
                                    <span class="text-white/70 text-sm">Random Channel</span>
                                    <kbd class="kbd kbd-sm text-xs">N</kbd>
                                </div>
                                <div class="flex items-center justify-between">
                                    <span class="text-white/70 text-sm">Random Station</span>
                                    <kbd class="kbd kbd-sm text-xs">M</kbd>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InfoPanel;
