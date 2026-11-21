import type {SVGProps} from 'react';
type Direction='up-right'|'left'|'right'|'up';
const strokes: Record<Direction,string>={
 'up-right':'M4 20 20 4 M9 4H20V15',
 'left':'M20 12H4 M11 5 4 12 11 19',
 'right':'M4 12H20 M13 5 20 12 13 19',
 'up':'M12 20V4 M5 11 12 4 19 11'
};
/** Always an ordinary thin-line arrow, never a platform emoji. */
export function PlainArrow({direction='up-right',...props}:{direction?:Direction}&SVGProps<SVGSVGElement>){
 return <svg className="plain-arrow" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
   <path d={strokes[direction]} stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"/>
 </svg>;
}
