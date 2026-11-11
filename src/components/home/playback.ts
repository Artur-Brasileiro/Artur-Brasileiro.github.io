/**
 * O relógio das folhas animadas da home (CNC e pêndulo): uma linha do tempo
 * que anda em velocidade constante, como um vídeo. A rolagem da página só dá a
 * partida; quem manda no instante é o relógio.
 *
 * `onFrame(u)` recebe o progresso (0 a 1) a cada quadro tocando e a cada salto
 * da linha do tempo; é onde a cena 3D vai para aquele instante.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type Playback = {
  /** progresso de 0 a 1 */
  u: number;
  /** segundos de vídeo já tocados e o total (a animação dividida pela velocidade) */
  t: number;
  duration: number;
  /** quantas vezes mais rápido que o aparelho de verdade */
  speed: number;
  playing: boolean;
  /** já tocou alguma vez (antes disso a folha mostra a máquina parada) */
  started: boolean;
  ended: boolean;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (u: number) => void;
  restart: () => void;
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * @param animSeconds duração da animação no tempo do aparelho
 * @param speed      velocidade de reprodução (1 = tempo real)
 */
export function usePlayback(animSeconds: number, speed: number, onFrame: (u: number) => void): Playback {
  const duration = animSeconds / speed;
  const st = useRef({ t: 0, playing: false, started: false });
  const [snap, setSnap] = useState(() => ({ ...st.current }));
  const frame = useRef(onFrame);
  frame.current = onFrame;
  const raf = useRef(0);
  const last = useRef(-1);

  const publish = useCallback(() => setSnap({ ...st.current }), []);

  const loop = useCallback(
    (now: number) => {
      const s = st.current;
      raf.current = 0;
      if (!s.playing) return;
      // um quadro longo (aba escondida, travada) não vira um salto na animação
      const dt = last.current < 0 ? 0 : Math.min(0.1, (now - last.current) / 1000);
      last.current = now;
      s.t = Math.min(duration, s.t + dt);
      if (s.t >= duration) s.playing = false;
      frame.current(s.t / duration);
      publish();
      if (s.playing) raf.current = requestAnimationFrame(loop);
    },
    [duration, publish],
  );

  const play = useCallback(() => {
    const s = st.current;
    if (s.playing) return;
    if (s.t >= duration) s.t = 0;
    s.playing = true;
    s.started = true;
    last.current = -1;
    frame.current(s.t / duration);
    publish();
    if (!raf.current) raf.current = requestAnimationFrame(loop);
  }, [duration, loop, publish]);

  const pause = useCallback(() => {
    const s = st.current;
    if (!s.playing) return;
    s.playing = false;
    cancelAnimationFrame(raf.current);
    raf.current = 0;
    publish();
  }, [publish]);

  const seek = useCallback(
    (u: number) => {
      const s = st.current;
      s.t = clamp01(u) * duration;
      s.started = true;
      last.current = -1;
      frame.current(s.t / duration);
      publish();
    },
    [duration, publish],
  );

  const toggle = useCallback(() => (st.current.playing ? pause() : play()), [pause, play]);
  const restart = useCallback(() => {
    seek(0);
    play();
  }, [seek, play]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  return useMemo(
    () => ({
      u: duration > 0 ? snap.t / duration : 0,
      t: snap.t,
      duration,
      speed,
      playing: snap.playing,
      started: snap.started,
      ended: !snap.playing && snap.t >= duration,
      play,
      pause,
      toggle,
      seek,
      restart,
    }),
    [snap, duration, speed, play, pause, toggle, seek, restart],
  );
}

/** Quem prefere menos movimento não recebe animação tocando sozinha: aperta o play. */
export const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Rolagem → layout. A trilha das folhas animadas é curta: os primeiros 40 % da
 * altura da tela de rolagem tiram o título e levam a máquina para o meio. O
 * valor sai na mesma escala do `q` das outras folhas (o HUD termina essa
 * transição em q = 0,16), então o hero trata todas igual.
 */
export const LAYOUT_END = 0.16;
export const layoutFromScroll = (scrolledPx: number) => LAYOUT_END * clamp01(scrolledPx / (0.4 * window.innerHeight));
