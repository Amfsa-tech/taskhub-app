import Svg, { Path, type SvgProps } from 'react-native-svg';

// Phosphor "Check" — used inside the consent checkbox when ticked.
export function Check({ size = 14, color = '#ffffff', ...props }: SvgProps & { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 256 256" fill="none" {...props}>
      <Path
        d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"
        fill={color}
      />
    </Svg>
  );
}
