import type { IndicatorZone } from "../../engine/types";
import { Tooltip } from "../help/Tooltip";

interface GaugeProps {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  /** Определяет зону (norm/warning/danger) для цвета шкалы и пульсации. */
  zoneFn?: (value: number) => IndicatorZone;
  /** Сколько знаков после запятой показывать в центре. */
  precision?: number;
  /** Короткая подсказка (1-2 предложения) при наведении/нажатии на индикатор. */
  tooltip?: string;
  /** Что считается нормой для этого показателя, например «норма: до 350 °C». */
  rangeHint?: string;
}

const SIZE = 148;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CENTER = SIZE / 2;
/** Дуга на 270° с разрывом снизу, как на приборной панели. */
const ARC_FRACTION = 0.75;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const ARC_LENGTH = CIRCUMFERENCE * ARC_FRACTION;
/** Поворот, чтобы разрыв дуги оказался внизу по центру. */
const ROTATION_DEG = 135;

const ZONE_COLOR: Record<IndicatorZone, string> = {
  normal: "#22d3ee", // cyan-400
  warning: "#fbbf24", // amber-400
  danger: "#fb7185", // rose-400
};

const ZONE_GLOW: Record<IndicatorZone, string> = {
  normal: "",
  warning: "drop-shadow(0 0 6px rgba(251,191,36,0.55))",
  danger: "drop-shadow(0 0 8px rgba(251,113,133,0.75))",
};

/** Небуквенный (не только цветовой) знак зоны — важно для людей с
 *  дальтонизмом, для которых жёлтый и красный могут выглядеть похоже. */
const ZONE_BADGE: Partial<Record<IndicatorZone, string>> = {
  warning: "!",
  danger: "✕",
};

/** Цвет текста статуса под шкалой (совпадает с цветом дуги). */
const ZONE_TEXT_CLASS: Record<IndicatorZone, string> = {
  normal: "text-cyan-300",
  warning: "text-amber-300",
  danger: "text-rose-300",
};

const ZONE_DESCRIPTION: Record<IndicatorZone, string> = {
  normal: "в норме",
  warning: "предупреждение",
  danger: "опасная зона",
};

export function Gauge({
  label,
  value,
  min,
  max,
  unit,
  zoneFn,
  precision = 0,
  tooltip,
  rangeHint,
}: GaugeProps) {
  const fraction = Math.min(1, Math.max(0, (value - min) / (max - min)));
  const zone: IndicatorZone = zoneFn ? zoneFn(value) : "normal";
  const color = ZONE_COLOR[zone];

  const valueLength = ARC_LENGTH * fraction;
  const dashArray = `${ARC_LENGTH} ${CIRCUMFERENCE}`;
  const accessibleLabel = `${label}: ${value.toFixed(precision)} ${unit}, ${ZONE_DESCRIPTION[zone]}`;

  const card = (
    <div className="relative flex flex-col items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-lg shadow-black/20 transition-transform duration-200 hover:-translate-y-0.5">
      {ZONE_BADGE[zone] && (
        <span
          aria-hidden="true"
          className={`absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
            zone === "danger"
              ? "bg-rose-500/20 text-rose-300"
              : "bg-amber-500/20 text-amber-300"
          }`}
        >
          {ZONE_BADGE[zone]}
        </span>
      )}
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label={accessibleLabel}
        className={zone === "danger" ? "animate-pulse motion-reduce:animate-none" : undefined}
      >
        <g transform={`rotate(${ROTATION_DEG} ${CENTER} ${CENTER})`}>
          {/* фоновая дорожка на всю длину дуги, чтобы был виден полный диапазон */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke="#3f3f46" // zinc-700
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={dashArray}
          />
          {/* значение */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={`${valueLength} ${CIRCUMFERENCE}`}
            style={{
              transition: "stroke-dasharray 400ms ease, stroke 400ms ease",
              filter: ZONE_GLOW[zone] || undefined,
            }}
          />
        </g>
        <text
          x={CENTER}
          y={CENTER - 4}
          textAnchor="middle"
          className="fill-zinc-50"
          style={{ fontSize: 26, fontWeight: 600, fontFamily: "ui-monospace, monospace" }}
        >
          {value.toFixed(precision)}
        </text>
        <text
          x={CENTER}
          y={CENTER + 18}
          textAnchor="middle"
          className="fill-zinc-500"
          style={{ fontSize: 13 }}
        >
          {unit}
        </text>
      </svg>
      <span className="text-sm font-medium tracking-wide text-zinc-300 uppercase">
        {label}
      </span>
      {zoneFn && (
        <span className={`text-sm font-semibold ${ZONE_TEXT_CLASS[zone]}`}>
          {ZONE_DESCRIPTION[zone]}
        </span>
      )}
      {rangeHint && (
        <span className="text-center text-xs leading-snug text-zinc-400">
          {rangeHint}
        </span>
      )}
    </div>
  );

  return tooltip ? (
    <Tooltip text={tooltip} ariaLabel={accessibleLabel}>
      {card}
    </Tooltip>
  ) : (
    card
  );
}
