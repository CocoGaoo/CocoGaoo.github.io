function ensurePersistentReviewSwitch(active){
 ['learn','mistakes'].forEach(id=>{
  const head=document.querySelector(`#${id} .page-head`);if(!head)return;
  head.querySelectorAll('.review-mode-switch').forEach(x=>x.remove());
  const switcher=document.createElement('div');switcher.className='mode-switch review-mode-switch persistent-review-switch';
  switcher.innerHTML=`<button data-review-view="learn" class="${active==='learn'?'on':''}">单词复习</button><button data-review-view="mistakes" class="${active==='mistakes'?'on':''}">错题修复</button>`;
  switcher.querySelectorAll('[data-review-view]').forEach(button=>button.onclick=()=>showView(button.dataset.reviewView));head.append(switcher);
 });
}
const previousShowViewV16=showView;
showView=id=>{previousShowViewV16(id);if(id==='learn'||id==='mistakes')ensurePersistentReviewSwitch(id)};
const previousRenderV16=render;
render=()=>{previousRenderV16();const active=document.querySelector('.view.active')?.id;if(active==='learn'||active==='mistakes')ensurePersistentReviewSwitch(active)};
ensurePersistentReviewSwitch(document.querySelector('.view.active')?.id);

