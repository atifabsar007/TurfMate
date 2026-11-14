/* TurfMate cloud adapter — Supabase browser client. RLS is the security boundary. */
(function(){
  'use strict';
  const cfg=window.TURFMATE_BACKEND_CONFIG||{};
  const configured=Boolean(String(cfg.supabaseUrl||'').trim()&&String(cfg.supabaseAnonKey||'').trim());
  let client=null,channel=null,activeUserId=null,refreshTimer=null;
  const collections=['turfmate:teams','turfmate:matches','turfmate:booking-requests'];
  const $store=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch(e){console.warn('TurfMate cache write failed',e)}};
  const $read=key=>{try{const v=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(v)?v:[]}catch{return[]}};
  function status(text,kind){const el=document.getElementById('backend-status');if(el){el.textContent=text;el.dataset.state=kind||'neutral';}}
  function ensure(){
    if(!configured)throw new Error('Cloud backend is not configured yet.');
    if(!client){
      if(!window.supabase?.createClient)throw new Error('Supabase client could not load. Refresh the page and try again.');
      client=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    }
    return client;
  }
  function profileMap(row,email){
    if(!row)return null;
    return {id:row.id,name:row.full_name||row.name||'TurfMate Player',email:email||'',username:row.username||'',phone:row.phone||'',position:row.position||'Midfielder',preferredFoot:row.preferred_foot||'Right',area:row.area||'Dhaka',skillLevel:row.skill_level||'Casual',bio:row.bio||'',avatarUrl:row.avatar_url||'',publicProfile:row.public_profile===true,availableForMatches:row.available_for_matches!==false,createdAt:row.created_at||''};
  }
  function profilePayload(p){return {id:p.id,username:p.username||null,full_name:p.name||p.full_name||'TurfMate Player',phone:p.phone||null,position:p.position||'Midfielder',preferred_foot:p.preferredFoot||p.preferred_foot||'Right',area:p.area||'Dhaka',skill_level:p.skillLevel||p.skill_level||'Casual',bio:p.bio||'',avatar_url:p.avatarUrl||p.avatar_url||null,public_profile:p.publicProfile===true||p.public_profile===true,available_for_matches:p.availableForMatches!==false&&p.available_for_matches!==false,updated_at:new Date().toISOString()};}
  function cacheRecord(collection,data){
    if(!data?.id)return;
    const rows=$read(collection),i=rows.findIndex(x=>x.id===data.id);
    if(i<0)rows.unshift(data);else rows[i]={...rows[i],...data};
    $store(collection,rows);
  }
  function announce(collection){window.dispatchEvent(new CustomEvent('turfmate:cloud-update',{detail:{collection}}));}
  async function getProfileRow(userId){
    const {data,error}=await ensure().from('profiles').select('*').eq('id',userId).maybeSingle();
    if(error)throw error;return data;
  }
  async function refreshProfiles(user){
    const api=ensure(),{data:publicRows,error}=await api.rpc('tm_public_profiles');
    if(error)throw error;
    const rows=Array.isArray(publicRows)?publicRows:[];
    let own=null;
    if(user){own=await getProfileRow(user.id);if(own)rows.push(own);}
    const map=new Map();
    rows.forEach(row=>{const p=profileMap(row,user?.id===row.id?user.email:'');if(p)map.set(p.id,p)});
    if(user&&!map.has(user.id))map.set(user.id,{id:user.id,name:user.user_metadata?.full_name||'TurfMate Player',email:user.email||'',username:user.user_metadata?.username||''});
    $store('turfmate:accounts',[...map.values()]);
    return user?map.get(user.id)||null:null;
  }
  async function refreshRecords(){
    const api=ensure(),{data,error}=await api.from('turfmate_records').select('collection,record_id,owner_id,data,created_at,updated_at').in('collection',collections);
    if(error)throw error;
    collections.forEach(key=>{
      const rows=(data||[]).filter(r=>r.collection===key).map(r=>({...r.data,id:r.record_id}));
      rows.sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
      $store(key,rows);
    });
    announce('records');
  }
  async function refreshInvites(){
    const api=ensure(),{data,error}=await api.from('team_invitations').select('*').order('created_at',{ascending:false});
    if(error)throw error;
    const teams=$read('turfmate:teams');
    const rows=(data||[]).map(x=>({id:x.id,teamId:x.team_id,teamName:teams.find(t=>t.id===x.team_id)?.name||x.team_name||'Team',fromUserId:x.inviter_id,fromName:x.inviter_name||'Team captain',toUserId:x.invitee_id,status:x.status,createdAt:x.created_at,respondedAt:x.responded_at||null}));
    $store('turfmate:team-invites',rows);
    announce('team-invites');
  }
  async function refreshNotifications(){
    if(!activeUserId)return;
    const {data,error}=await ensure().from('notifications').select('*').order('created_at',{ascending:false}).limit(100);
    if(error)throw error;
    $store('turfmate:notifications',(data||[]).map(n=>({id:n.id,type:n.type,title:n.title,body:n.body,data:n.data||{},readAt:n.read_at,createdAt:n.created_at})));
    announce('notifications');
  }
  async function currentSession(){const {data,error}=await ensure().auth.getSession();if(error)throw error;return data.session||null;}
  async function currentUser(){
    const session=await currentSession();if(!session)return null;
    const row=await getProfileRow(session.user.id);
    return profileMap(row,session.user.email)||{id:session.user.id,name:session.user.user_metadata?.full_name||'TurfMate Player',email:session.user.email||''};
  }
  async function subscribe(userId){
    if(channel)await ensure().removeChannel(channel);
    activeUserId=userId||null;
    channel=ensure().channel('turfmate-live-network')
      .on('postgres_changes',{event:'*',schema:'public',table:'turfmate_records'},()=>scheduleRefresh())
      .on('postgres_changes',{event:'*',schema:'public',table:'team_invitations'},()=>scheduleRefresh())
      .on('postgres_changes',{event:'*',schema:'public',table:'notifications',filter:userId?'recipient_id=eq.'+userId:'id=eq.00000000-0000-0000-0000-000000000000'},()=>refreshNotifications().catch(console.warn))
      .subscribe();
  }
  function scheduleRefresh(){
    clearTimeout(refreshTimer);
    refreshTimer=setTimeout(()=>Promise.all([refreshRecords(),refreshInvites(),refreshNotifications()]).catch(e=>console.warn('Cloud refresh failed',e)),180);
  }
  async function bootstrap(){
    if(!configured){status('LOCAL DEMO MODE','local');return {configured:false,user:null};}
    ensure();status('CONNECTING TO CLOUD','loading');
    const session=await currentSession(),user=session?.user||null;
    if(user)localStorage.setItem('turfmate:session',user.id);else localStorage.removeItem('turfmate:session');
    const profile=await refreshProfiles(user);
    await refreshRecords();
    if(user){await refreshInvites();await refreshNotifications();}
    await subscribe(user?.id||null);
    status('CLOUD CONNECTED','online');
    return {configured:true,user:profile};
  }
  async function signUp({email,password,name,username,phone}){
    const {data,error}=await ensure().auth.signUp({email,password,options:{data:{full_name:name,username,phone}}});
    if(error)throw error;
    if(!data.session)return {session:null,user:data.user,profile:null};
    const profile={id:data.user.id,name,email:data.user.email,username,phone};
    await updateProfile(profile);
    return {session:data.session,user:data.user,profile};
  }
  async function signIn(email,password){
    const {data,error}=await ensure().auth.signInWithPassword({email,password});
    if(error)throw error;
    const row=await getProfileRow(data.user.id);
    return {session:data.session,user:data.user,profile:profileMap(row,data.user.email)};
  }
  async function signOut(){
    if(!configured)return;
    const {error}=await ensure().auth.signOut();
    if(error)throw error;
    activeUserId=null;
    if(channel){await client.removeChannel(channel);channel=null;}
  }
  async function updateProfile(patch){
    const session=await currentSession();if(!session)throw new Error('Please log in again to update your profile.');
    const payload=profilePayload({...patch,id:session.user.id});
    const {data,error}=await ensure().from('profiles').upsert(payload,{onConflict:'id'}).select('*').single();
    if(error)throw error;
    const mapped=profileMap(data,session.user.email),accounts=$read('turfmate:accounts'),i=accounts.findIndex(x=>x.id===mapped.id);
    if(i<0)accounts.push(mapped);else accounts[i]={...accounts[i],...mapped};
    $store('turfmate:accounts',accounts);
    return mapped;
  }
  async function uploadAvatar(file){
    if(!file||!file.type?.startsWith('image/'))throw new Error('Choose an image file.');
    if(file.size>5*1024*1024)throw new Error('Profile photos must be 5 MB or smaller.');
    const session=await currentSession();if(!session)throw new Error('Please log in again to upload a photo.');
    const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg';
    const path=session.user.id+'/'+crypto.randomUUID()+'.'+ext;
    const {error}=await ensure().storage.from('player-avatars').upload(path,file,{upsert:true,contentType:file.type,cacheControl:'3600'});
    if(error)throw error;
    return ensure().storage.from('player-avatars').getPublicUrl(path).data.publicUrl;
  }
  function ownerFor(record){
    return record.ownerId||record.creatorId||record.userId||null;
  }
  async function saveRecord(collection,record){
    if(!configured||!collections.includes(collection))return null;
    const session=await currentSession();if(!session)return null;
    const owner=ownerFor(record);
    if(owner!==session.user.id)throw new Error('This record does not belong to the signed-in account.');
    const clean={...record};
    if(collection==='turfmate:teams')clean.members=(clean.members||[]).map(m=>{const x={...m};delete x.email;return x});
    const {error}=await ensure().from('turfmate_records').upsert({collection,record_id:String(record.id),owner_id:session.user.id,data:clean,updated_at:new Date().toISOString()},{onConflict:'collection,record_id'});
    if(error)throw error;
    return record;
  }
  async function updateRecord(collection,id,patch,updated){
    if(!configured)return null;
    if(collection==='turfmate:matches'){
      if(Object.keys(patch||{}).length===1&&patch.lineups)return updateMatchLineups(id,patch.lineups);
      return null;
    }
    if(!collections.includes(collection)||!updated)return null;
    const session=await currentSession();if(!session)return null;
    const owner=ownerFor(updated);
    if(owner!==session.user.id)return null;
    return saveRecord(collection,updated);
  }
  async function rpc(name,args){
    const {data,error}=await ensure().rpc(name,args);
    if(error)throw error;
    return data;
  }
  async function updateMatchLineups(id,lineups){return rpc('tm_update_match_lineups',{p_record_id:id,p_lineups:lineups});}
  async function joinMatch(id,side){return rpc('tm_join_match',{p_record_id:id,p_side:side});}
  async function leaveMatch(id){return rpc('tm_leave_match',{p_record_id:id});}
  async function startMatch(id){return rpc('tm_start_match',{p_record_id:id});}
  async function recordGoal(id,side,goal){return rpc('tm_record_goal',{p_record_id:id,p_side:side,p_scorer_id:goal.scorerId,p_assist_id:goal.assistId||null,p_minute:goal.minute});}
  async function finishMatch(id){return rpc('tm_finish_match',{p_record_id:id});}
  async function voteMotm(id,playerId){return rpc('tm_vote_motm',{p_record_id:id,p_player_id:playerId});}
  async function invitePlayer(teamId,playerId){const result=await rpc('tm_invite_player',{p_team_id:teamId,p_invitee_id:playerId});await refreshInvites();await refreshNotifications();return result;}
  async function respondInvite(inviteId,accept){const result=await rpc('tm_respond_team_invite',{p_invite_id:inviteId,p_accept:accept});await Promise.all([refreshRecords(),refreshInvites(),refreshNotifications()]);return result;}
  async function markNotificationRead(id){
    const {error}=await ensure().from('notifications').update({read_at:new Date().toISOString()}).eq('id',id).eq('recipient_id',activeUserId);
    if(error)throw error;
    const rows=$read('turfmate:notifications');$store('turfmate:notifications',rows.map(n=>n.id===id?{...n,readAt:new Date().toISOString()}:n));announce('notifications');
  }
  async function markAllNotificationsRead(){
    const {error}=await ensure().from('notifications').update({read_at:new Date().toISOString()}).eq('recipient_id',activeUserId).is('read_at',null);
    if(error)throw error;
    await refreshNotifications();
  }
  window.TurfMateCloud={
    get configured(){return configured;},bootstrap,currentUser,signUp,signIn,signOut,updateProfile,uploadAvatar,saveRecord,updateRecord,
    updateMatchLineups,joinMatch,leaveMatch,startMatch,recordGoal,finishMatch,voteMotm,invitePlayer,respondInvite,markNotificationRead,markAllNotificationsRead,
    refreshNotifications
  };
})();
