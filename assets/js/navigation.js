/** Accessible mobile navigation; desktop navigation remains visible without JS. */
export function initNavigation(){
 const toggle=document.querySelector('.menu-toggle'),nav=document.querySelector('#main-nav');
 if(!toggle||!nav)return;
 const close=()=>{toggle.setAttribute('aria-expanded','false');nav.dataset.collapsed='true'};
 close();
 toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));nav.dataset.collapsed=String(!open)});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&toggle.getAttribute('aria-expanded')==='true'){close();toggle.focus()}});
 nav.addEventListener('click',e=>{if(e.target.closest('a'))close()});
 matchMedia('(min-width:801px)').addEventListener('change',close);
}
