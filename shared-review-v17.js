function installSharedReviewNav(active){
 document.querySelectorAll('#learn .review-mode-switch,#mistakes .review-mode-switch').forEach(x=>x.remove());
 let shared=document.querySelector('#sharedReviewNav');
 if(!shared){shared=document.createElement('nav');shared.id='sharedReviewNav';shared.className='shared-review-nav';shared.setAttribute('aria-label','复习模式切换');document.querySelector('main').prepend(shared)}
 const visible=active==='learn'||active==='mistakes';shared.hidden=!visible;
 shared.innerHTML=`<button data-shared-review="learn" class="${active==='learn'?'on':''}">单词复习</button><button data-shared-review="mistakes" class="${active==='mistakes'?'on':''}">错题修复</button>`;
 shared.querySelectorAll('[data-shared-review]').forEach(button=>button.onclick=()=>showView(button.dataset.sharedReview));
}
const showViewBeforeSharedReview=showView;
showView=id=>{showViewBeforeSharedReview(id);installSharedReviewNav(id)};
const renderBeforeSharedReview=render;
render=()=>{renderBeforeSharedReview();installSharedReviewNav(document.querySelector('.view.active')?.id)};
installSharedReviewNav(document.querySelector('.view.active')?.id);

