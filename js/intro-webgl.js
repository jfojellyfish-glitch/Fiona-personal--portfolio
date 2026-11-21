const intro=document.getElementById('intro-screen');
const enter=document.getElementById('intro-enter');
const canvas=document.getElementById('intro-webgl');
const fallback=document.getElementById('intro-fallback');
const status=document.getElementById('intro-status');
let active=true, renderLoop=0, gl=null;
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');

function openPortfolio(){
  if(!active)return;
  active=false;
  if(renderLoop)cancelAnimationFrame(renderLoop);
  intro.classList.add('is-leaving');
  document.body.classList.remove('intro-locked');
  document.documentElement.classList.remove('intro-locked');
  document.querySelector('body > .site')?.removeAttribute('inert');
  const finish=()=>{intro.hidden=true;document.getElementById('top')?.focus?.({preventScroll:true});};
  if(reducedMotion.matches)finish();else window.setTimeout(finish,900);
}
enter.addEventListener('click',openPortfolio);

function compile(g,kind,source){
  const s=g.createShader(kind);g.shaderSource(s,source);g.compileShader(s);
  if(!g.getShaderParameter(s,g.COMPILE_STATUS))throw new Error('Shader: '+g.getShaderInfoLog(s));
  return s;
}
async function loadModel(){
  // Original Nomad Sculpt 3D logo, loaded from the site's own assets folder.
  const response=await fetch(new URL('../assets/fiona-logo.glb',import.meta.url));
  if(!response.ok)throw new Error('Unable to load logo 3D model: '+response.status);
  const bytes=new Uint8Array(await response.arrayBuffer());
  const reader=new DataView(bytes.buffer);
  if(reader.getUint32(0,true)!==0x46546c67)throw new Error('Unexpected 3D file');
  const jsonLength=reader.getUint32(12,true);
  const gltf=JSON.parse(new TextDecoder().decode(bytes.subarray(20,20+jsonLength)));
  const binOffset=20+jsonLength+8;
  function accessor(index){
    const a=gltf.accessors[index],v=gltf.bufferViews[a.bufferView];
    const offset=binOffset+v.byteOffset+(a.byteOffset||0);
    const components={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type];
    const len=a.count*components;
    if(a.componentType===5126)return new Float32Array(bytes.buffer,offset,len);
    if(a.componentType===5125)return new Uint32Array(bytes.buffer,offset,len);
    if(a.componentType===5121)return new Uint8Array(bytes.buffer,offset,len);
    throw new Error('Unsupported model component type');
  }
  const primitive=gltf.meshes[0].primitives[0];
  return {
    positions:accessor(primitive.attributes.POSITION),
    colors:accessor(primitive.attributes.COLOR_0),
    indices:accessor(primitive.indices),
    bounds:gltf.accessors[primitive.attributes.POSITION]
  };
}

try{
  gl=canvas.getContext('webgl2',{alpha:true,antialias:true,powerPreference:'low-power',premultipliedAlpha:false});
  if(!gl)throw new Error('WebGL2 unavailable');
  const vs=compile(gl,gl.VERTEX_SHADER,`#version 300 es
  precision highp float;
  in vec3 aPosition;
  in vec4 aColor;
  uniform vec3 uCenter;
  uniform float uAngle;
  uniform float uHalfWidth;
  uniform float uHalfHeight;
  uniform float uBob;
  uniform float uTilt;
  out vec4 vColor;
  out vec3 vPosition;
  void main(){
    vec3 p=aPosition-uCenter;
    float sy=sin(uAngle), cy=cos(uAngle);
    vec3 yawed=vec3(cy*p.x+sy*p.z,p.y,-sy*p.x+cy*p.z);
    float sx=sin(uTilt), cx=cos(uTilt);
    vec3 rotated=vec3(yawed.x,cx*yawed.y-sx*yawed.z+uBob,sx*yawed.y+cx*yawed.z);
    vPosition=rotated;
    vColor=aColor;
    gl_Position=vec4(rotated.x/uHalfWidth,rotated.y/uHalfHeight,-rotated.z/3.8,1.0);
  }`);
  const fs=compile(gl,gl.FRAGMENT_SHADER,`#version 300 es
  precision highp float;
  in vec4 vColor;
  in vec3 vPosition;
  out vec4 fragColor;
  void main(){
    vec3 n=normalize(cross(dFdx(vPosition),dFdy(vPosition)));
    float lit=max(dot(n,normalize(vec3(-.35,.9,1.1))),0.0);
    float shade=.96+.28*lit;
    float highlight=pow(lit,8.0)*.16;
    vec3 color=min(vColor.rgb*shade+vec3(highlight)+vec3(.045),vec3(1.0));
    fragColor=vec4(color,1.0);
  }`);
  const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Program: '+gl.getProgramInfoLog(program));
  gl.useProgram(program);
  const data=await loadModel();
  const vao=gl.createVertexArray();gl.bindVertexArray(vao);
  const posLoc=gl.getAttribLocation(program,'aPosition');
  const colorLoc=gl.getAttribLocation(program,'aColor');
  const posBuf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,posBuf);gl.bufferData(gl.ARRAY_BUFFER,data.positions,gl.STATIC_DRAW);
  gl.enableVertexAttribArray(posLoc);gl.vertexAttribPointer(posLoc,3,gl.FLOAT,false,0,0);
  const colBuf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,colBuf);gl.bufferData(gl.ARRAY_BUFFER,data.colors,gl.STATIC_DRAW);
  gl.enableVertexAttribArray(colorLoc);gl.vertexAttribPointer(colorLoc,4,gl.UNSIGNED_BYTE,true,0,0);
  const ibo=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ibo);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,data.indices,gl.STATIC_DRAW);
  const uniforms={};for(const n of ['uCenter','uAngle','uHalfWidth','uHalfHeight','uBob','uTilt'])uniforms[n]=gl.getUniformLocation(program,n);
  const lower=data.bounds.min,upper=data.bounds.max;
  gl.uniform3f(uniforms.uCenter,(lower[0]+upper[0])/2,(lower[1]+upper[1])/2,(lower[2]+upper[2])/2);
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);
  gl.clearColor(0,0,0,0);
  const began=performance.now();
  function frame(now){
    if(!active || document.hidden)return;
    const rect=canvas.getBoundingClientRect();
    const ratio=Math.min(window.devicePixelRatio||1,1.6);
    const w=Math.max(1,Math.round(rect.width*ratio));const h=Math.max(1,Math.round(rect.height*ratio));
    if(w!==canvas.width||h!==canvas.height){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h)}
    const t=(now-began)/1000;
    gl.uniform1f(uniforms.uAngle,reducedMotion.matches?0:Math.sin(t*.62)*.34);
    gl.uniform1f(uniforms.uBob,reducedMotion.matches?0:Math.sin(t*.95)*.04);
    gl.uniform1f(uniforms.uTilt,reducedMotion.matches?0:Math.cos(t*.74)*.12);
    const halfWidth=1.72;
    gl.uniform1f(uniforms.uHalfWidth,halfWidth);
    gl.uniform1f(uniforms.uHalfHeight,halfWidth*h/w);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.bindVertexArray(vao);
    gl.drawElements(gl.TRIANGLES,data.indices.length,gl.UNSIGNED_INT,0);
    renderLoop=requestAnimationFrame(frame);
  }
  canvas.classList.add('is-ready');
  fallback.classList.add('is-replaced');
  status.textContent='3D logo ready. Click it to enter.';
  renderLoop=requestAnimationFrame(frame);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&active)renderLoop=requestAnimationFrame(frame)},{passive:true});
}catch(error){
  // The real model's still image remains visible even without GPU/WebGL support.
  canvas.style.display='none';
  fallback.classList.remove('is-replaced');
  status.textContent='Logo preview shown. Click it to enter.';
  console.warn('3D preview unavailable; static rendering supplied:',error);
}
