import { createSignal, createEffect, Show, onMount, onCleanup, type Component } from 'solid-js';
import { playerState, toggleMute, setVolume, setPlayerState, playRandomChannel, playRandomStation, playFullyRandom } from './stores/playerStore';
import YouTubePlayer from './components/YouTubePlayer';
import ControlPanel from './components/ControlPanel';
import WidgetPanel from './components/WidgetPanel';
import DigitalClock from './components/DigitalClock';
import WelcomeScreen from './components/WelcomeScreen';
import Sidebar from './components/Sidebar';
import InfoPanel from './components/InfoPanel';
import Header from './components/Header';

const App: Component = () => {
  const [activePanel, setActivePanel] = createSignal<'station' | 'ambient' | 'theme' | 'info' | null>(null);
  const [isWidgetsOpen, setIsWidgetsOpen] = createSignal(false);
  const [isIdle, setIsIdle] = createSignal(false);
  const [isImmersiveEnabled, setIsImmersiveEnabled] = createSignal(false);

  const savedTheme = localStorage.getItem('lofi_theme') || 'luxury';
  const [activeTheme, setActiveTheme] = createSignal(savedTheme);
  const [hasStarted, setHasStarted] = createSignal(false);

  interface HUDState {
    visible: boolean;
    icon: string;
    text: string;
    progress?: number;
  }
  const [hud, setHud] = createSignal<HUDState>({ visible: false, icon: "", text: "" });
  let hudTimer: ReturnType<typeof setTimeout>;

  const showHUD = (icon: string, text: string, progress?: number) => {
    clearTimeout(hudTimer);
    setHud({ visible: true, icon, text, progress });
    hudTimer = setTimeout(() => {
      setHud(prev => ({ ...prev, visible: false }));
    }, 1200);
  };

  const handleStart = () => {
    setHasStarted(true);
    setPlayerState('isMuted', false);
    playFullyRandom();
    setActivePanel('info');
  };

  const togglePanel = (panel: 'station' | 'ambient' | 'theme' | 'info') => {
    setActivePanel(prev => prev === panel ? null : panel);
  };

  const toggleWidgets = () => setIsWidgetsOpen(prev => !prev);

  const handleThemeChange = (theme: string) => {
    setActiveTheme(theme);
    localStorage.setItem('lofi_theme', theme);
  };

  onMount(() => {
    let idleTimer: ReturnType<typeof setTimeout>;

    const resetIdleTimer = () => {
      setIsIdle(false);
      clearTimeout(idleTimer);

      if (isImmersiveEnabled()) {
        idleTimer = setTimeout(() => {
          setIsIdle(true);
        }, 3000);
      }
    };

    createEffect(() => {
      if (isImmersiveEnabled()) {
        resetIdleTimer();
      } else {
        setIsIdle(false);
        clearTimeout(idleTimer);
      }
    });

    resetIdleTimer();

    const handleInput = () => {
      resetIdleTimer();
    };

    window.addEventListener('mousemove', handleInput);
    window.addEventListener('click', handleInput);
    const handleKeyDownWithShortcuts = (e: KeyboardEvent) => {
      handleInput();

      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (!hasStarted()) {
        if (e.code === 'Space') {
          e.preventDefault();
          handleStart();
        }
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          toggleMute();
          setTimeout(() => {
            if (playerState.isMuted) {
              showHUD("🔇", "Muted");
            } else {
              showHUD("🔊", `Volume: ${playerState.volume}%`, playerState.volume);
            }
          }, 0);
          break;
        case 'ArrowUp':
          e.preventDefault();
          const nextVolUp = Math.min(100, playerState.volume + 5);
          setVolume(nextVolUp);
          showHUD("🔊", `Volume: ${nextVolUp}%`, nextVolUp);
          break;
        case 'ArrowDown':
          e.preventDefault();
          const nextVolDown = Math.max(0, playerState.volume - 5);
          setVolume(nextVolDown);
          showHUD("🔊", `Volume: ${nextVolDown}%`, nextVolDown);
          break;
        case 'KeyM':
          playRandomStation();
          showHUD("📻", "Shuffling Station...");
          break;
        case 'KeyN':
          playRandomChannel(playerState.currentCategoryId);
          showHUD("🎵", "Next Channel...");
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDownWithShortcuts);

    onCleanup(() => {
      window.removeEventListener('mousemove', handleInput);
      window.removeEventListener('click', handleInput);
      window.removeEventListener('keydown', handleKeyDownWithShortcuts);
      clearTimeout(idleTimer);
    });
  });

  return (
    <div class="w-full h-full relative" data-theme={activeTheme()}>
      <Show when={!hasStarted()}>
        <WelcomeScreen onStart={handleStart} />
      </Show>
      <div class={`transition-opacity duration-1000 ${isIdle() ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <WidgetPanel
          isOpen={isWidgetsOpen()}
          onClose={() => setIsWidgetsOpen(false)}
        />
        <InfoPanel
          isOpen={activePanel() === 'info'}
          onClose={() => setActivePanel(null)}
        />
      </div>
      <div class={`transition-opacity duration-1000 ${isIdle() ? 'opacity-0 pointer-events-none' : 'opacity-100 z-[60] relative'}`}>
        <Sidebar />
      </div>
      <YouTubePlayer />
      <div class="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_center,transparent_55%,rgba(0,0,0,0.8)_100%)]"></div>
      <div class={`absolute top-6 left-6 md:top-10 md:left-10 z-10 transition-opacity duration-1000 ${isIdle() ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <Header />
      </div>
      <div class={`absolute bottom-64 left-6 md:bottom-64 md:left-10 lg:bottom-32 z-10 transition-opacity duration-1000 ${isIdle() ? 'opacity-0' : 'opacity-80'}`}>
        <DigitalClock />
      </div>
      <div class={`transition-opacity duration-1000 ${isIdle() ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <ControlPanel
          onToggleAmbient={() => togglePanel('ambient')}
          isAmbientOpen={activePanel() === 'ambient'}
          onCloseAmbient={() => setActivePanel(null)}

          isImmersive={isImmersiveEnabled()}
          onToggleImmersive={() => setIsImmersiveEnabled(!isImmersiveEnabled())}

          onToggleStationSelector={() => togglePanel('station')}
          isStationSelectorOpen={activePanel() === 'station'}
          onCloseStationSelector={() => setActivePanel(null)}

          onToggleWidgets={toggleWidgets}
          isWidgetsOpen={isWidgetsOpen()}
          onCloseWidgets={() => setIsWidgetsOpen(false)}

          onToggleInfo={() => togglePanel('info')}
          isInfoOpen={activePanel() === 'info'}
          onCloseInfo={() => setActivePanel(null)}

          onToggleTheme={() => togglePanel('theme')}
          isThemeOpen={activePanel() === 'theme'}
          onCloseTheme={() => setActivePanel(null)}
          activeTheme={activeTheme()}
          onSelectTheme={handleThemeChange}
        />
      </div>

      {/* Keyboard Shortcuts HUD */}
      <div 
        class={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] pointer-events-none transition-all duration-300 transform ${hud().visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95'}`}
      >
        <div class="bg-black/60 backdrop-blur-xl border border-white/10 px-5 py-2.5 rounded-full flex items-center gap-3 shadow-2xl">
          <span class="text-lg">{hud().icon}</span>
          <div class="flex flex-col">
            <span class="text-xs font-bold tracking-wider uppercase text-white font-mono">{hud().text}</span>
            <Show when={hud().progress !== undefined}>
              <div class="w-24 h-1 bg-white/20 rounded-full mt-1.5 overflow-hidden">
                <div class="h-full bg-primary transition-all duration-100" style={{ width: `${hud().progress}%` }}></div>
              </div>
            </Show>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
