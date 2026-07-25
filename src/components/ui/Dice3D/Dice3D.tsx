import { useEffect, useRef } from 'react';
import './Dice3D.css';

interface Dice3DProps {
  /** The face value (1-6) this die should land on. */
  targetValue: number;
  /** When true, start the spin -> settle animation. */
  rolling: boolean;
  /** Milliseconds after rolling becomes true before this die settles. */
  settleDelay: number;
  /** Fired once the settle CSS transition completes. */
  onSettled?: () => void;
}

/** Target net rotations to bring each face to the front.
 *  Face layout: 1=front, 2=back, 3=left, 4=top, 5=bottom, 6=right */
const TARGETS: Record<number, [number, number]> = {
  1: [0, 0],
  2: [0, 180],
  3: [0, 90],
  4: [-90, 0],
  5: [90, 0],
  6: [0, -90],
};

/** Pip-dot layouts as [top%, left%] pairs. */
const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[22, 22], [78, 78]],
  3: [[22, 22], [50, 50], [78, 78]],
  4: [[22, 22], [22, 78], [78, 22], [78, 78]],
  5: [[22, 22], [22, 78], [50, 50], [78, 22], [78, 78]],
  6: [[22, 22], [22, 78], [50, 22], [50, 78], [78, 22], [78, 78]],
};

/** Nearest forward angle from `current` whose mod-360 equals `targetNet`.
 *  Ensures at least a 1/4 turn so the settle animation is visible. */
function forwardSettle(current: number, targetNet: number): number {
  const mod = ((current % 360) + 360) % 360;
  let delta = (((targetNet - mod) % 360) + 360) % 360;
  if (delta < 90) delta += 360;
  return current + delta;
}

const FACES = [1, 2, 3, 4, 5, 6] as const;

export function Dice3D({
  targetValue,
  rolling,
  settleDelay,
  onSettled,
}: Dice3DProps) {
  const diceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rolling || !diceRef.current) return;

    const el = diceRef.current;
    let rotX = Math.random() * 360;
    let rotY = Math.random() * 360;
    const speedX = 400 + Math.random() * 300; // deg/s
    const speedY = 300 + Math.random() * 300;

    let rafId: number;
    let lastTime = performance.now();
    let stopped = false;

    // Remove any transition from a previous run
    el.style.transition = 'none';
    el.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;

    function spin(now: number) {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      rotX += speedX * dt;
      rotY += speedY * dt;
      el.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
      if (!stopped) rafId = requestAnimationFrame(spin);
    }

    rafId = requestAnimationFrame(spin);

    // Schedule the settle phase
    const settleId = window.setTimeout(() => {
      stopped = true;
      cancelAnimationFrame(rafId);

      const [tx, ty] = TARGETS[targetValue];
      const fx = forwardSettle(rotX, tx);
      const fy = forwardSettle(rotY, ty);

      el.style.transition = 'transform 0.6s cubic-bezier(0.2, 0.8, 0.3, 1)';
      // Force reflow so transition recognises the new starting point
      el.getBoundingClientRect();
      el.style.transform = `rotateX(${fx}deg) rotateY(${fy}deg)`;

      // Fire callback when the transition finishes
      const fallbackId = setTimeout(() => {
        el.removeEventListener('transitionend', onEnd);
        onSettled?.();
      }, 750);

      function onEnd() {
        clearTimeout(fallbackId);
        el.removeEventListener('transitionend', onEnd);
        onSettled?.();
      }

      el.addEventListener('transitionend', onEnd);
    }, settleDelay);

    return () => {
      stopped = true;
      cancelAnimationFrame(rafId);
      clearTimeout(settleId);
    };
  }, [rolling, targetValue, settleDelay, onSettled]);

  return (
    <div className="dice3d-scene">
      <div className="dice3d" ref={diceRef}>
        {FACES.map((face) => (
          <div key={face} className={`dice3d__face dice3d__face--${face}`}>
            {PIPS[face].map(([top, left], i) => (
              <span
                key={i}
                className="dice3d__pip"
                style={{ top: `${top}%`, left: `${left}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
