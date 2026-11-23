export type Pearl={title:string;slug:string;file:string;date?:string;description?:string;category?:string};
export type Photo={title:string;file:string;alt?:string;year?:string;date?:string;location?:string;width?:number;height?:number;displaySize?:'small'|'medium'|'large'};
export type Model={title:string;file?:string;alt?:string;year?:string;description?:string;sketchfabId?:string;sketchfabUrl?:string;url?:string};
export type Drawer='writing'|'objects'|'photography'|'none';
export const BASE_PATH=process.env.NEXT_PUBLIC_BASE_PATH??'/Fiona-personal--portfolio';
export function formatDate(s?:string):string{
 if(!s)return '';
 const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
 if(match)return match[3]+'.'+match[2]+'.'+match[1];
 const month=/^(\d{4})-(\d{2})$/.exec(s);
 if(month){
  const names=['January','February','March','April','May','June','July','August','September','October','November','December'];
  const n=Number(month[2]);
  return n>=1&&n<=12?names[n-1]+' '+month[1]:s;
 }
 return s;
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
