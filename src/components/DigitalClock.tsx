import { createSignal, onCleanup, type Component } from "solid-js";

interface DigitalClockProps {
  variant?: "corner" | "center";
}

const STYLES = {
  corner: {
    root: "items-start",
    row: "gap-2",
    time: "text-6xl md:text-8xl font-black text-white tracking-tighter drop-shadow-lg opacity-90",
    seconds: "text-2xl md:text-3xl font-bold text-white/80 w-10",
    date: "text-lg md:text-xl text-white/80 font-bold uppercase tracking-[0.2em] ml-1 mt-[-10px] drop-shadow-md",
  },
  center: {
    root: "items-center",
    row: "gap-[0.6vw]",
    time: "text-[length:min(24vw,42vh)] leading-none font-black text-white/70 tracking-tighter tabular-nums",
    seconds: "text-[length:min(5vw,9vh)] leading-none font-bold text-white/35 tabular-nums",
    date: "text-[length:min(2.4vw,4.5vh)] text-white/40 font-bold uppercase tracking-[0.3em] mt-[1vh]",
  },
} as const;

const DigitalClock: Component<DigitalClockProps> = (props) => {
  const [time, setTime] = createSignal(new Date());

  const timer = setInterval(() => setTime(new Date()), 1000);
  onCleanup(() => clearInterval(timer));

  const format = (num: number) => num.toString().padStart(2, "0");
  const styles = () => STYLES[props.variant ?? "corner"];

  const dateString = () => {
    return time().toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div class={`flex flex-col pointer-events-none select-none ${styles().root}`}>
      <div class={`flex items-baseline ${styles().row}`}>
        <span class={styles().time}>
          {format(time().getHours())}:{format(time().getMinutes())}
        </span>
        <span class={styles().seconds}>{format(time().getSeconds())}</span>
      </div>
      <div class={styles().date}>{dateString()}</div>
    </div>
  );
};

export default DigitalClock;
