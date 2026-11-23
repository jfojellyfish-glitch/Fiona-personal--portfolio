import type { ReactNode } from 'react';

/** Minimal Markdown subset rendered as React elements: no raw HTML or injection. */
const rx=/(\[[^\]\n]+\]\(https?:\/\/[^\s)]+\)|\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g;
const isChineseOnly=(value:string)=>/[\u3400-\u9fff]/.test(value)&&!/[A-Za-z]/.test(value);
/** Attach language spans so mixed English/Chinese paragraphs can stay genuinely light
 * in Chinese, without changing the article's original text. */
function languageRuns(value:string):ReactNode[]{
 return value.split(/([\u3400-\u9fff]+(?:[，。！？、；：（）]*[\u3400-\u9fff]+)*)/g)
  .filter(Boolean).map((part,i)=>/[\u3400-\u9fff]/.test(part)
   ? <span key={i} lang="zh-Hant" className="pearl-han-inline">{part}</span>:part);
}

function inline(text:string):ReactNode[]{
 const parts=text.split(rx);
 return parts.filter(Boolean).map((part,i)=>{
   const link=/^\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)$/.exec(part);
   if(link){
     let href='';try{const u=new URL(link[2]);if(u.protocol==='https:'||u.protocol==='http:')href=u.href;}catch{}
     return href?<a key={i} href={href} target="_blank" rel="noopener noreferrer">{link[1]}</a>:<span key={i}>{link[1]}</span>;
   }
   if(part.startsWith('**')&&part.endsWith('**'))return <strong key={i}>{part.slice(2,-2)}</strong>;
   if(part.startsWith('*')&&part.endsWith('*'))return <em key={i}>{part.slice(1,-1)}</em>;
   return languageRuns(part);
 });
}
export function Markdown({text}:{text:string}){
 const lines=text.replace(/\r\n/g,'\n').split('\n');
 const out:ReactNode[]=[];let i=0;
 while(i<lines.length){
   const line=lines[i].trim();
   if(!line){i++;continue;}
   if(/^---+$/.test(line)){out.push(<hr key={i}/>);i++;continue;}
   const heading=/^(#{1,3})\s+(.+)$/.exec(line);
   if(heading){
     const tag=heading[1].length===1?'h2':'h3';
     out.push(tag==='h2'?<h2 key={i}>{inline(heading[2])}</h2>:<h3 key={i}>{inline(heading[2])}</h3>);i++;continue;
   }
   if(/^>\s/.test(line)){const start=i;const quote:string[]=[];
     while(i<lines.length&&/^>\s/.test(lines[i].trim()))quote.push(lines[i++].trim().slice(2));
     const quoteText=quote.join('\n');
     out.push(<blockquote key={start} lang={isChineseOnly(quoteText)?'zh-Hant':undefined}><p>{inline(quoteText)}</p></blockquote>);continue;
   }
   const unordered=/^[-*]\s+/.test(line),ordered=/^\d+\.\s+/.test(line);
   if(unordered||ordered){const start=i;const items:ReactNode[]=[];const pattern=unordered?/^[-*]\s+(.+)$/:/^\d+\.\s+(.+)$/;
     while(i<lines.length){const match=pattern.exec(lines[i].trim());if(!match)break;items.push(<li key={i}>{inline(match[1])}</li>);i++;}
     out.push(unordered?<ul key={start}>{items}</ul>:<ol key={start}>{items}</ol>);continue;
   }
   const start=i,paragraph:string[]=[];
   while(i<lines.length){const t=lines[i].trim();if(!t||/^(#{1,3})\s|^>\s|^[-*]\s|^\d+\.\s|^---+$/.test(t))break;paragraph.push(t);i++;}
   if(paragraph.length){
     const paragraphText=paragraph.join(' '),isHan=isChineseOnly(paragraphText);
     out.push(<p key={start} lang={isHan?'zh-Hant':undefined} className={isHan&&[...paragraphText].length<=30?'pearl-interlude':undefined}>{inline(paragraphText)}</p>);
   }
 }
 return <>{out}</>;
}
