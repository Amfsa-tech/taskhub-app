import Svg, { Path, type SvgProps } from 'react-native-svg';

// Phosphor "CaretDown" — used for select/dropdown fields.
export function CaretDown({ size = 18, color = '#78788c', ...props }: SvgProps & { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 256 256" fill="none" {...props}>
      <Path
        d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"
        fill={color}
      />
    </Svg>
  );
}
