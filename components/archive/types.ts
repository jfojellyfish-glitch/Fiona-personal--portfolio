export type Pearl={title:string;slug:string;file:string;date?:string;description?:string;category?:string};
export type Photo={title:string;file:string;alt?:string;year?:string;date?:string;location?:string;width?:number;height?:number;displaySize?:'small'|'medium'|'large'};
export type Model={title:string;file?:string;alt?:string;year?:string;description?:string;sketchfabId?:string;sketchfabUrl?:string;url?:string};
export type Drawer='writing'|'objects'|'photography'|'none';
export const BASE_PATH=process.env.NEXT_PUBLIC_BASE_PATH??'/Fiona-personal--portfolio';
/** Display archive dates as EnglishMonth/YYYY with no day. */
export function formatDate(s?:string):string{
 if(!s)return '';
 const match=/^(\d{4})-(\d{2})(?:-\d{2})?$/.exec(s);
 if(!match)return s;
 const monthNames=['January','February','March','April','May','June','July','August','September','October','November','December'];
 const month=Number(match[2]);
 return month>=1&&month<=12?monthNames[month-1]+'/'+match[1]:s;
}
export function isSafeAsset(s?:string):s is string{
 return !!s&&/^[a-zA-Z0-9_./-]+$/.test(s)&&!s.startsWith('/')&&!s.includes('..');
}
export function assetUrl(path:string):string{
 return isSafeAsset(path)?BASE_PATH+'/'+path:'';
}
export function validExternal(s?:string):string{
 if(!s)return '';
 try{const url=new URL(s);return url.protocol==='https:'?url.href:'';}catch{return '';}
}
