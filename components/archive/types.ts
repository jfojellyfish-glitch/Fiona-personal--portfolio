export type Pearl={title:string;slug:string;file:string;date?:string;description?:string;category?:string};
export type Photo={title:string;file:string;alt?:string;year?:string;date?:string;location?:string;width?:number;height?:number};
export type Model={title:string;file?:string;alt?:string;year?:string;description?:string;sketchfabId?:string;sketchfabUrl?:string;url?:string};
export type Drawer='writing'|'objects'|'photography'|'none';
export const BASE_PATH=process.env.NEXT_PUBLIC_BASE_PATH??'/Fiona-personal--portfolio';
export function formatDate(s?:string):string{
 if(!s)return '';
 const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
 return match?match[3]+'.'+match[2]+'.'+match[1]:s;
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
