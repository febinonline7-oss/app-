import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, {
  Circle,
  G,
  Line,
  Path,
  Text as SvgText,
} from 'react-native-svg';

import { CONSTELLATION_LINES, SkyObject, norm360 } from '../astro';
import { colors } from '../theme';

type Props = {
  objects: SkyObject[];
  size: number;
  /** Chart is drawn with this compass bearing at the top. */
  rotation?: number;
  limitingMagnitude?: number;
  showConstellations?: boolean;
  highlightId?: string | null;
  onSelectObject?: (object: SkyObject) => void;
};

type Projected = { x: number; y: number; visible: boolean };

/**
 * Stereographic projection of the visible hemisphere onto a disc: the zenith
 * is at the centre, the horizon is the rim. Stereographic keeps
 * constellations the right shape, which matters more here than equal area —
 * you are trying to match a pattern against the real sky.
 */
export function projectToDisc(
  altitude: number,
  azimuth: number,
  radius: number,
  rotation: number
): Projected {
  const zenithAngle = 90 - altitude;
  const scale = Math.tan((zenithAngle / 2) * (Math.PI / 180));
  const bearing = norm360(azimuth - rotation) * (Math.PI / 180);
  return {
    x: radius * scale * Math.sin(bearing),
    y: -radius * scale * Math.cos(bearing),
    visible: altitude > 0,
  };
}

/** Bright stars get bigger dots; the scale is compressed compared to reality. */
function markerRadius(magnitude: number): number {
  if (magnitude <= -3) return 6;
  if (magnitude < 0) return 4.4;
  if (magnitude < 1) return 3.6;
  if (magnitude < 2) return 2.9;
  if (magnitude < 3) return 2.3;
  if (magnitude < 4) return 1.8;
  return 1.4;
}

const CARDINALS: { label: string; azimuth: number }[] = [
  { label: 'N', azimuth: 0 },
  { label: 'E', azimuth: 90 },
  { label: 'S', azimuth: 180 },
  { label: 'W', azimuth: 270 },
];

export function SkyChart({
  objects,
  size,
  rotation = 0,
  limitingMagnitude = 6,
  showConstellations = true,
  highlightId = null,
  onSelectObject,
}: Props) {
  const radius = size / 2 - 18;
  const centre = size / 2;

  const byId = useMemo(() => {
    const map = new Map<string, SkyObject>();
    for (const object of objects) map.set(object.id, object);
    return map;
  }, [objects]);

  const visible = useMemo(
    () =>
      objects.filter(
        (object) =>
          object.horizontal.altitude > 0 && object.magnitude <= limitingMagnitude
      ),
    [objects, limitingMagnitude]
  );

  // Constellation figures, clipped to segments with both ends above the horizon.
  const figures = useMemo(() => {
    if (!showConstellations) return [];
    const paths: string[] = [];
    for (const constellation of CONSTELLATION_LINES) {
      for (const line of constellation.lines) {
        for (let i = 0; i < line.length - 1; i++) {
          const a = byId.get(`star:${line[i]}`);
          const b = byId.get(`star:${line[i + 1]}`);
          if (!a || !b) continue;
          if (a.horizontal.altitude <= 0 || b.horizontal.altitude <= 0) continue;
          const pa = projectToDisc(a.horizontal.altitude, a.horizontal.azimuth, radius, rotation);
          const pb = projectToDisc(b.horizontal.altitude, b.horizontal.azimuth, radius, rotation);
          paths.push(
            `M ${centre + pa.x} ${centre + pa.y} L ${centre + pb.x} ${centre + pb.y}`
          );
        }
      }
    }
    return paths;
  }, [byId, showConstellations, radius, rotation, centre]);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* Horizon disc */}
        <Circle cx={centre} cy={centre} r={radius} fill="#070b16" stroke={colors.horizon} strokeWidth={1.5} />
        {/* Altitude rings at 30 and 60 degrees */}
        {[30, 60].map((altitude) => {
          const r = radius * Math.tan(((90 - altitude) / 2) * (Math.PI / 180));
          return (
            <Circle
              key={altitude}
              cx={centre}
              cy={centre}
              r={r}
              fill="none"
              stroke={colors.horizon}
              strokeWidth={0.7}
              strokeDasharray="3 5"
            />
          );
        })}
        {/* Meridian and prime vertical */}
        <Line x1={centre} y1={centre - radius} x2={centre} y2={centre + radius} stroke={colors.horizon} strokeWidth={0.6} strokeDasharray="2 6" />
        <Line x1={centre - radius} y1={centre} x2={centre + radius} y2={centre} stroke={colors.horizon} strokeWidth={0.6} strokeDasharray="2 6" />

        {figures.length > 0 && (
          <G>
            {figures.map((d, index) => (
              <Path key={index} d={d} stroke={colors.accent} strokeOpacity={0.34} strokeWidth={1} fill="none" />
            ))}
          </G>
        )}

        {visible.map((object) => {
          const point = projectToDisc(
            object.horizontal.altitude,
            object.horizontal.azimuth,
            radius,
            rotation
          );
          const isHighlighted = object.id === highlightId;
          const r = markerRadius(object.magnitude);
          const labelWorthy =
            isHighlighted ||
            object.kind === 'planet' ||
            object.kind === 'moon' ||
            object.kind === 'sun' ||
            object.magnitude < 1.5;

          return (
            <G key={object.id} onPress={onSelectObject ? () => onSelectObject(object) : undefined}>
              {isHighlighted && (
                <Circle
                  cx={centre + point.x}
                  cy={centre + point.y}
                  r={r + 7}
                  fill="none"
                  stroke={colors.nightSafe}
                  strokeWidth={1.6}
                />
              )}
              <Circle
                cx={centre + point.x}
                cy={centre + point.y}
                r={r}
                fill={object.color}
                opacity={object.kind === 'deepsky' ? 0.75 : 1}
              />
              {labelWorthy && (
                <SvgText
                  x={centre + point.x + r + 4}
                  y={centre + point.y + 4}
                  fill={isHighlighted ? colors.nightSafe : colors.textMuted}
                  fontSize={isHighlighted ? 12 : 10}
                >
                  {object.name}
                </SvgText>
              )}
            </G>
          );
        })}

        {CARDINALS.map(({ label, azimuth }) => {
          const bearing = norm360(azimuth - rotation) * (Math.PI / 180);
          const r = radius + 12;
          return (
            <SvgText
              key={label}
              x={centre + r * Math.sin(bearing)}
              y={centre - r * Math.cos(bearing) + 4}
              fill={colors.textMuted}
              fontSize={12}
              fontWeight="600"
              textAnchor="middle"
            >
              {label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}
