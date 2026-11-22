import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const out='artifacts/ui-regression';
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const result={time:new Date().toISOString(),screens:[],checks:[],errors:[],version:'v8'};
function check(name,ok,detail={}){result.checks.push({name,pass:!!ok,...detail});if(!ok)result.errors.push(name)}
async function snapshot(page,name){
 await page.screenshot({path:out+'/'+name+'.png',fullPage:false,animations:'disabled'});
 const dim=await page.evaluate(()=>{
  const app=document.querySelector('#app'),hud=document.querySelector('.bhud');
  const story=document.querySelector('#main-content'),nav=document.querySelector('.illustrated-nav');
  const rect=e=>e?Object.fromEntries(['top','bottom','height','left','right','width'].map(k=>[k,Math.round(e.getBoundingClientRect()[k])])):null;
  return {width:innerWidth,height:innerHeight,page:app?.dataset.page,documentWidth:document.documentElement.scrollWidth,
   titleBannerCount:document.querySelectorAll('.wuxia-masthead').length,
   hud:rect(hud),story:rect(story),footer:rect(nav),
   portrait:rect(document.querySelector('.hport')),
   nameRow:rect(document.querySelector('.hud-name-row')),
   stats:rect(document.querySelector('.hud-stats-mini')),
   heading:rect(document.querySelector('.story-heading')),
   storyProse:rect(document.querySelector('.story-prose')),
   firstStoryLine:rect(document.querySelector('.reader-line')),
   storyArt:rect(document.querySelector('.reader-media')),
   storyChoiceBlock:rect(document.querySelector('.story-choice-block')),
   styleHints:(()=>{const e=document.querySelector('.story-stage');const h=document.querySelector('.story-heading');return e&&h?{stageMinHeight:getComputedStyle(e).minHeight,stageJustify:getComputedStyle(e).justifyContent,headingMargin:getComputedStyle(h).margin,headingPadding:getComputedStyle(h).padding}:null})(),
   text:(story?.innerText||'').slice(0,250),choiceCount:document.querySelectorAll('.story-option').length,
   scrollHeight:story?.scrollHeight,clientHeight:story?.clientHeight};
 });
 result.screens.push({name,...dim});
 check(name+' title removed',dim.titleBannerCount===0);
 check(name+' no horizontal overflow',dim.documentWidth<=dim.width+1,{documentWidth:dim.documentWidth});
 check(name+' HUD visible',!!dim.hud);
 check(name+' footer visible',!!dim.footer&&dim.footer.bottom<=dim.height+3);
 check(name+' readable center',!!dim.story&&dim.story.height>80);
 return dim;
}
async function reveal(page){
 const button=page.locator('.reader-skip:visible');
 if(await button.count())await button.first().click();
}
const base=process.env.TEST_ORIGIN||'http://127.0.0.1:8765';
for(const dims of [[320,700],[390,844],[430,932]]){
 const width=dims[0],height=dims[1];
 const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,hasTouch:true,isMobile:true});
 const page=await ctx.newPage();
 page.on('pageerror',err=>result.errors.push(String(width)+' JS: '+err.message));
 await page.goto(base+'/',{waitUntil:'domcontentloaded'});
 await page.waitForSelector('#app .title-screen');
 check(String(width)+' title screen',await page.getByRole('heading',{name:'江湖歲月錄'}).count()>0);
 await page.getByRole('button',{name:/初入江湖/}).click();
 await page.locator('#nm').fill('沈孤雁');
 await page.getByRole('button',{name:'女',exact:true}).click();
 await page.getByRole('button',{name:/踏入江湖/}).click();
 await page.waitForSelector('#app[data-page="world"] .bhud',{timeout:15000});
 await reveal(page);
 const initial=await snapshot(page,'world_'+width+'x'+height);
 check(String(width)+' enlarged portrait',!!initial.portrait&&initial.portrait.height>=105,{portrait:initial.portrait});
 check(String(width)+' complete six stats',await page.locator('#app[data-page="world"] .mini-stat').count()===6);
 const fit=await page.evaluate(()=>{
  const root=document.querySelector('.hud-core').getBoundingClientRect();
  const children=['.hport','.hud-identity','.hud-stats-mini','.hgear'];
  return children.map(sel=>{const e=document.querySelector(sel)?.getBoundingClientRect();return{selector:sel,within:!!e&&e.left>=root.left-2&&e.right<=root.right+2}});
 });
 check(String(width)+' HUD columns fit',fit.every(x=>x.within),{fit});
 if(width===390){
   await page.evaluate(()=>showEvent({type:'奇遇',title:'溪邊問路',
    text:'書生問道：「前面的山路是否通往嘉興？」',
    choices:[{s:'g',t:'指明方向',go:()=> '你為書生指了路。'}]}));
   await reveal(page);
   check('390 speaker dialogue highlighted',await page.locator('.reader-line.reader-dialogue').count()===1);
   await page.screenshot({path:out+'/dialogue_390x844.png',fullPage:false,animations:'disabled'});
 }
 if(width===390){
   const art=await page.evaluate(async()=>{
     const paths=['assets/ui/v9/story-border.webp','assets/ui/v9/story-header.webp','assets/ui/v9/story-button.webp'];
     const fetched=await Promise.all(paths.map(async path=>{
       const r=await fetch(path,{cache:'no-store'});
       return {path,ok:r.ok,status:r.status,type:r.headers.get('content-type')};
     }));
     const option=document.querySelector('#main-content .story-option');
     const background=option?getComputedStyle(option).backgroundImage:'';
     const main=document.querySelector('#main-content');
     const panel=main?getComputedStyle(main).borderImageSource:'';
     return {fetched,background,panel};
   });
   check('390 all three ornate images loaded',art.fetched.every(x=>x.ok),{assets:art.fetched});
   check('390 real gilded option artwork enabled',art.background.includes('story-button.webp'));
   check('390 actual decorative border enabled',art.panel.includes('story-border.webp'));
 }
 await page.evaluate(()=>{
   showEvent({type:'江湖',title:'長篇故事的視覺驗收',
     text:Array.from({length:12},(_,i)=>'第'+(i+1)+'段：江湖風雨如晦，山野行人仍循著故人留下的線索前行。').join('\n'),
     choices:[{s:'g',t:'上前協助',go:()=> '你上前扶起了受傷的旅人。'},
              {s:'e',t:'索取報酬',go:()=> '你開口索要一筆酬金。'},
              {s:'n',t:'暫且觀望',go:()=> '你退到樹旁，靜觀事態。'}]});
 });
 await reveal(page);
 await page.locator('#main-content').evaluate(el=>{el.scrollTop=el.scrollHeight});
 const scroll=await page.evaluate(()=>{const el=document.querySelector('#main-content');return{top:el.scrollTop,max:el.scrollHeight-el.clientHeight}});
 check(String(width)+' long story scroll',scroll.max>35&&scroll.top>0,scroll);
 await snapshot(page,'long_'+width+'x'+height);
 await page.locator('#main-content .event-choice:not([disabled])').first().click();
 await reveal(page);
 check(String(width)+' choice retained',await page.locator('.reader-choice').count()===1);
 check(String(width)+' result appended',await page.locator('.reader-result').count()===1);
 await snapshot(page,'result_'+width+'x'+height);
 const cont=page.locator('#main-content .story-option').filter({hasText:'繼續'});
 if(await cont.count()){
  await cont.first().click();await reveal(page);
  check(String(width)+' continuation',await page.locator('#app[data-page="world"] .bhud').count()>0);
 }
 for(const tab of ['人物','武功','人脈','行囊']){
  await page.locator('.illustrated-nav button[aria-label="'+tab+'"]').click();
  check(String(width)+' nav '+tab,await page.locator('#main-content').count()===1);
  if(width===390&&(tab==='人物'||tab==='行囊'))
   await page.screenshot({path:out+'/tab_'+tab+'_'+width+'x'+height+'.png',fullPage:false,animations:'disabled'});
 }
 await page.locator('.illustrated-nav button[aria-label="江湖"]').click();
 await reveal(page);
 await page.locator('.illustrated-nav button[aria-label="設定"]').click();
 check(String(width)+' settings panel',await page.locator('.sheet').count()>0);
 await page.locator('.sheet-h button').filter({hasText:'關閉'}).click();
 check(String(width)+' settings closes',await page.locator('.sheet').count()===0);
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForSelector('#app .title-screen');
 const resume=page.getByRole('button',{name:/繼續前緣/});
 check(String(width)+' save retained',await resume.count()>0);
 if(await resume.count()){
  await resume.click();
  await page.waitForSelector('#app[data-page="world"] .bhud',{timeout:15000});
  await reveal(page);
  check(String(width)+' saved game resumed',await page.locator('.event-reader').count()>0);
 }
 // Each mobile viewport exercises the real, compact modal over its existing story.
 await page.evaluate(()=>{
   showEvent({type:'江湖',title:'山路試招',text:'前方有個山賊擋住去路。',choices:[
     {s:'g',t:'挺身應戰',go:()=>({title:'山路對決',intro:'山賊擺開架勢。',battle:foe('山賊',2,0.15,'thug')})}
   ]});
 });
 await reveal(page);
 await page.locator('.event-choice:not([disabled])').first().click();
 const dialog=page.getByRole('dialog',{name:'山路對決'});
 check(width+' compact battle modal',await dialog.count()===1);
 check(width+' original world remains visible',await page.locator('#app[data-page="world"] > .bhud').count()===1);
 check(width+' battle background story preserved',await page.locator('.battle-behind .reader-line').count()>0);
 check(width+' battle removes arena',await dialog.locator('.arena,.tray,.bnav,.bhud').count()===0);
 const geometry=await dialog.evaluate(el=>{
   const r=el.getBoundingClientRect();
   return {width:Math.round(r.width),height:Math.round(r.height),top:Math.round(r.top),
     left:Math.round(r.left),viewportWidth:innerWidth,viewportHeight:innerHeight};
 });
 check(width+' compact battle fits screen',
   geometry.width<=Math.min(geometry.viewportWidth-20,420) &&
   geometry.height<=geometry.viewportHeight*.82 &&
   geometry.left>=0&&geometry.top>=0,geometry);
 check(width+' battle has both HP bars',await dialog.locator('.battle-health').count()===2);
 check(width+' battle dice choices',
   await dialog.getByRole('button',{name:/擲骰子/}).count()===1 &&
   await dialog.getByRole('button',{name:/直接以 10 點開始/}).count()===1);
 if(width===390)
   await page.screenshot({path:out+'/battle_dialog_before_roll_390x844.png',fullPage:false,animations:'disabled'});
 await dialog.getByRole('button',{name:/直接以 10 點開始/}).click();
 check(width+' dice result 10',await dialog.locator('.battle-die-score').textContent()==='10');
 await page.waitForSelector('.battle-dialog-actions button', {timeout:4000});
 const speed=dialog.getByRole('button',{name:/速度 ×/});
 if(await speed.count()) {
   await speed.click();
   check(width+' battle speed toggle',await dialog.getByRole('button',{name:'速度 ×2'}).count()===1);
 }
 if(width===390)
   await page.screenshot({path:out+'/battle_dialog_fighting_390x844.png',fullPage:false,animations:'disabled'});
 const surrender=dialog.getByRole('button',{name:'投降'});
 if(await surrender.count()){
   await surrender.click();
   check(width+' surrender outcome',await dialog.getByRole('button',{name:'繼續故事'}).count()===1);
   await dialog.getByRole('button',{name:'繼續故事'}).click();
   check(width+' battle returns to story',await page.locator('.event-reader .reader-result').count()>=1);
 }
 // A separate low-HP opponent checks the real automatic victory path.
 if(width===390){
   await page.evaluate(()=>{
     showEvent({type:'江湖',title:'收招測試',text:'另一名對手攔路。',choices:[
       {s:'g',t:'應戰',go:()=>{const e=foe('路人',1,0,'thug');e.hp=1;e.mhp=1;
         return {title:'收招測試',intro:'對方攻勢已盡。',battle:e};}}
     ]});
   });
   await reveal(page);
   await page.locator('.event-choice:not([disabled])').first().click();
   const victory=page.getByRole('dialog',{name:'收招測試'});
   await victory.getByRole('button',{name:/直接以 10 點開始/}).click();
   await page.waitForSelector('.battle-dialog .battle-phase.complete',{timeout:9000});
   check('390 automatic win',await victory.locator('.battle-phase').textContent()==='勝利');
   await page.screenshot({path:out+'/battle_dialog_victory_390x844.png',fullPage:false,animations:'disabled'});
   await victory.getByRole('button',{name:'繼續故事'}).click();
   check('390 victory returns to story',await page.locator('.event-reader .reader-result').count()>0);
 }
 await ctx.close();
}
writeFileSync(out+'/report.json',JSON.stringify(result,null,2));
await browser.close();
if(result.errors.length){console.error(JSON.stringify(result.errors,null,2));process.exitCode=1}
else console.log(JSON.stringify({passed:result.checks.length,screens:result.screens.length}));
