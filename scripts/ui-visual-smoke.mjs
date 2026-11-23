import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const out='artifacts/ui-regression';
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const result={time:new Date().toISOString(),screens:[],checks:[],errors:[],version:'v12'};
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
 check(String(width)+' compact portrait',!!initial.portrait&&initial.portrait.height>=60&&initial.portrait.height<=90,{portrait:initial.portrait});
 check(String(width)+' complete six stats',await page.locator('#app[data-page="world"] .mini-stat').count()===6);
 check(String(width)+' correct female portrait',await page.locator('.hport img.hero-portrait[src*="hero_female.webp"]').count()===1);
 const imageCheck=await page.evaluate(async()=>{
   const image=document.querySelector('.hero-portrait');
   const portraits={loaded:!!image&&image.complete&&image.naturalWidth>=128,source:image?.getAttribute('src')};
   const icons=[...document.querySelectorAll('.hud-stats-mini .mini-stat-mark')];
   const paths=icons.map(e=>getComputedStyle(e).backgroundImage);
   const assets=await Promise.all(paths.map(async url=>{
     const found=url.match(/url\(["']?(.*?)["']?\)/);
     if(!found)return {ok:false,url};
     const response=await fetch(found[1],{cache:'no-store'});
     return {ok:response.ok,asset:found[1],status:response.status};
   }));
   const bold=getComputedStyle(document.querySelector('.reader-line')).fontWeight;
   return {portraits,icons:icons.length,paths,assets,bold};
 });
 check(String(width)+' portrait image loaded',imageCheck.portraits.loaded,imageCheck.portraits);
 check(String(width)+' new complete stat emblems',
  imageCheck.icons===6&&imageCheck.assets.every(x=>x.ok)&&
  imageCheck.paths.every(x=>x.includes('/v12/stat_')),{assets:imageCheck.assets});
 check(String(width)+' story font weight >= 600',+imageCheck.bold>=600,{weight:imageCheck.bold});
 if(width===390){
   await page.evaluate(()=>{S.gender='男';render();});
   const male=page.locator('.hport img.hero-portrait[src*="hero_male.webp"]');
   check('390 male portrait used',await male.count()===1);
   check('390 male image loaded',await male.evaluate(el=>el.complete&&el.naturalWidth>=128));
   await page.screenshot({path:out+'/world_male_390x844.png',fullPage:false,animations:'disabled'});
   await page.evaluate(()=>{S.gender='女';render();});
   await reveal(page);
 }
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
 const worldGeometry=await page.evaluate(()=>{
   const app=document.querySelector('#app').getBoundingClientRect();
   const hud=document.querySelector('.bhud').getBoundingClientRect();
   return {appLeft:app.left,appWidth:app.width,hudLeft:hud.left,hudWidth:hud.width};
 });
 for(const tab of ['人物','武功','人脈','行囊']){
  await page.locator('.illustrated-nav button[aria-label="'+tab+'"]').click();
  check(String(width)+' nav '+tab,await page.locator('#main-content').count()===1);
  const g=await page.evaluate(()=>{
    const app=document.querySelector('#app').getBoundingClientRect();
    const hud=document.querySelector('.bhud').getBoundingClientRect();
    return {appLeft:app.left,appWidth:app.width,hudLeft:hud.left,hudWidth:hud.width};
  });
  check(String(width)+' '+tab+' same page and HUD width',
    Math.abs(g.appWidth-worldGeometry.appWidth)<=1 &&
    Math.abs(g.hudWidth-worldGeometry.hudWidth)<=1 &&
    Math.abs(g.appLeft-worldGeometry.appLeft)<=1 &&
    Math.abs(g.hudLeft-worldGeometry.hudLeft)<=1,{worldGeometry,g});
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
 // Verify the original illustrated battle scene and actual drag-to-roll d20.
 await page.evaluate(()=>{
   showEvent({type:'江湖',title:'山路試招',text:'前方有個山賊擋住去路。',choices:[
     {s:'g',t:'挺身應戰',go:()=>{
       const e=foe('山賊',2,0.15,'thug');e.hp=9999;e.mhp=9999;
       return {title:'山路對決',intro:'山賊擺開架勢。',battle:e};
     }}
   ]});
 });
 await reveal(page);
 await page.locator('.event-choice:not([disabled])').first().click();
 const dialog=page.getByRole('dialog',{name:'江湖戰鬥'});
 check(width+' restored combat panel',await dialog.count()===1);
 check(width+' duel arena present',await dialog.locator('.arena').count()===1);
 check(width+' both animated fighters present',
   await dialog.locator('.arena .fgt.p').count()===1 &&
   await dialog.locator('.arena .fgt.e').count()===1);
 check(width+' combat equipment cards visible',
   await dialog.locator('.srow .sl').count()===1 &&
   await dialog.locator('.srow .sr').count()===1);
 const tray=dialog.locator('.tray');
 check(width+' original 3D dice tray restored',await tray.count()===1);
 check(width+' dice accepts pointer drag',
   await tray.evaluate(el=>getComputedStyle(el).touchAction)==='none');
 check(width+' dice renderer connected',
   await page.evaluate(()=>DIE3!==null&&document.querySelector('.tray')?.classList.contains('live3d')));
 const box=await dialog.boundingBox(),trayBox=await tray.boundingBox();
 check(width+' restored scene fits viewport',!!box&&box.width<=width&&box.height<=height&&box.x>=0&&box.y>=0,
   box?{width:box.width,height:box.height,x:box.x,y:box.y}:{box:null});
 if(width===390)
   await page.screenshot({path:out+'/battle_arena_with_drag_dice_390x844.png',fullPage:false,animations:'disabled'});
 await tray.scrollIntoViewIfNeeded();
 const b=await tray.boundingBox();
 if(width===390){
   // 真正的觸控事件，不是用滑鼠模擬點擊。通過 CDP 觸發
   // touchstart/move/end，驗證手機 PointerEvent 的拖曳流程。
   const cdp=await ctx.newCDPSession(page);
   const x=b.x+b.width/2,y=b.y+b.height/2;
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
   for(let step=1;step<=5;step++)
     await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',
       touchPoints:[{x:x+60*step/5,y:y-46*step/5,id:1}]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   await cdp.detach();
 }else{
   await page.mouse.move(b.x+b.width/2,b.y+b.height/2);
   await page.mouse.down();
   await page.mouse.move(b.x+b.width/2+60,b.y+b.height/2-46,{steps:5});
   await page.mouse.up();
 }
 const rolled=await page.evaluate(()=>({
   roll:UI.ov?.roll,phase:UI.ov?.phase,seq:UI.ov?.seq,
   hasWebGL:!!(DIE3&&document.querySelector('.tray')?.classList.contains('live3d'))
 }));
 check(width+' pull-back physically throws original d20',
   Number.isInteger(rolled.roll)&&rolled.roll>=1&&rolled.roll<=20&&rolled.seq>0,rolled);
 await page.waitForFunction(()=>UI.ov&&UI.ov.phase==='fight',{timeout:5000});
 const speed=dialog.locator('.spd');
 check(width+' original battle speed button exists',await speed.count()===1);
 if(await speed.count()){
   await speed.click();
   check(width+' battle speed toggles',await page.evaluate(()=>UI.ov?.speed===2));
 }
 if(width===390)
   await page.screenshot({path:out+'/battle_after_dice_drag_390x844.png',fullPage:false,animations:'disabled'});
 const surrender=dialog.locator('.bdock .surr button');
 if(await surrender.count()){
   await surrender.click();
   check(width+' surrender completes',await page.evaluate(()=>UI.ov?.over==='lose'));
   const done=dialog.locator('.bdock .side button').filter({hasText:/繼續/});
   await done.click();
   check(width+' surrender returns to narrative',
     await page.locator('.event-reader .reader-result').count()>0);
 }
 // Verify the other built-in control: skip the physical throw and use 10.
 if(width===390){
   await page.evaluate(()=>{
     showEvent({type:'江湖',title:'收招測試',text:'另一名對手攔路。',choices:[
       {s:'g',t:'應戰',go:()=>{const e=foe('路人',1,0,'thug');e.hp=1;e.mhp=1;
         return {title:'收招測試',intro:'對方攻勢已盡。',battle:e};}}
     ]});
   });
   await reveal(page);
   await page.locator('.event-choice:not([disabled])').first().click();
   const victory=page.getByRole('dialog',{name:'江湖戰鬥'});
   await victory.getByRole('button',{name:/跳過投擲/}).click();
   check('390 skip uses 10',await page.evaluate(()=>UI.ov?.roll===10));
   await page.waitForFunction(()=>UI.ov?.over==='win',{timeout:9000});
   check('390 restored arena automatic victory',await page.evaluate(()=>UI.ov?.over==='win'));
   await page.screenshot({path:out+'/battle_restored_victory_390x844.png',fullPage:false,animations:'disabled'});
   await victory.locator('.bdock .side button').filter({hasText:/收招/}).click();
   check('390 restored victory continues story',
      await page.locator('.event-reader .reader-result').count()>0);
 }
 await ctx.close();
}
writeFileSync(out+'/report.json',JSON.stringify(result,null,2));
await browser.close();
if(result.errors.length){console.error(JSON.stringify(result.errors,null,2));process.exitCode=1}
else console.log(JSON.stringify({passed:result.checks.length,screens:result.screens.length}));
