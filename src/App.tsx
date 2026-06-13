import { useState, useEffect, useRef } from 'react';
import { CheckSquare, Plus, Trash2, Clock, Play, Square, BarChart2, X, Star, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface Task { id:string; title:string; priority:'high'|'medium'|'low'; done:boolean; timeSpent:number; timing:boolean; timerStart:number|null; dueDate:string; starred:boolean; createdAt:number; }
const SAVE='tf_tasks_v1';
const loadT=():Task[]=>{try{return JSON.parse(localStorage.getItem(SAVE)||'[]')}catch{return[]}};
const saveT=(t:Task[])=>localStorage.setItem(SAVE,JSON.stringify(t));
const fmtTime=(s:number)=>`${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m`;
const PRIORITY_COLORS:{[k:string]:string}={high:'#ef4444',medium:'#f59e0b',low:'#3b82f6'};

export default function App() {
  const [tasks,setTasks]=useState<Task[]>(loadT);
  const [filter,setFilter]=useState<'all'|'active'|'done'|'starred'>('all');
  const [showAdd,setShowAdd]=useState(false);
  const [tab,setTab]=useState<'tasks'|'stats'>('tasks');
  const [tick,setTick]=useState(0);
  
  useEffect(()=>{
    const interval=setInterval(()=>setTick(t=>t+1),1000);
    return ()=>clearInterval(interval);
  },[]);

  const persist=(items:Task[])=>{setTasks(items);saveT(items)};

  const toggleTimer=(id:string)=>{
    const now=Date.now();
    persist(tasks.map(t=>{
      if(t.id!==id)return t;
      if(t.timing){
        const extra=Math.floor((now-(t.timerStart||now))/1000);
        return{...t,timing:false,timerStart:null,timeSpent:t.timeSpent+extra};
      }
      return{...t,timing:true,timerStart:now};
    }));
  };

  const getTaskTime=(t:Task)=>t.timing?t.timeSpent+Math.floor((Date.now()-(t.timerStart||Date.now()))/1000):t.timeSpent;

  const filtered=tasks.filter(t=>{
    if(filter==='active')return!t.done;
    if(filter==='done')return t.done;
    if(filter==='starred')return t.starred;
    return true;
  }).sort((a,b)=>{
    if(a.done!==b.done)return a.done?1:-1;
    const po:{[k:string]:number}={high:0,medium:1,low:2};
    return po[a.priority]-po[b.priority];
  });

  const totalTime=tasks.reduce((s,t)=>s+getTaskTime(t),0);
  const done=tasks.filter(t=>t.done).length;
  const pct=tasks.length?Math.round(done/tasks.length*100):0;

  return (
    <div style={{minHeight:'100vh',background:'#080810',display:'flex',flexDirection:'column'}}>
      <header style={{padding:'16px 20px',borderBottom:'1px solid #1e1b4b',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <div style={{width:'36px',height:'36px',borderRadius:'10px',background:'linear-gradient(135deg,#3b82f6,#1d4ed8)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 14px #3b82f630'}}><CheckSquare size={16} color="white"/></div>
          <div><div style={{fontWeight:'700',fontSize:'16px',color:'white',lineHeight:1}}>TaskFlow Pro</div>
          <div style={{fontSize:'11px',color:'#1e40af',marginTop:'2px'}}>{done}/{tasks.length} done · {fmtTime(totalTime)} logged</div></div>
        </div>
        <div style={{display:'flex',gap:'4px'}}>
          {(['tasks','stats'] as const).map(t=><button key={t} onClick={()=>setTab(t)} style={{padding:'6px 12px',borderRadius:'7px',background:tab===t?'#3b82f620':'none',border:`1px solid ${tab===t?'#3b82f6':'transparent'}`,color:tab===t?'#93c5fd':'#1e40af',fontSize:'12px',cursor:'pointer',fontFamily:'Inter',textTransform:'capitalize'}}>{t}</button>)}
        </div>
      </header>

      {tab==='tasks'&&<>
        <div style={{display:'flex',overflowX:'auto',padding:'10px 20px',borderBottom:'1px solid #1e1b4b',gap:'6px'}}>
          {(['all','active','starred','done'] as const).map(f=><button key={f} onClick={()=>setFilter(f)} style={{flexShrink:0,padding:'5px 14px',borderRadius:'20px',border:`1px solid ${filter===f?'#3b82f6':'#1e1b4b'}`,background:filter===f?'#3b82f615':'transparent',color:filter===f?'#93c5fd':'#1e40af',fontSize:'12px',cursor:'pointer',fontFamily:'Inter',textTransform:'capitalize',whiteSpace:'nowrap'}}>{f}</button>)}
          <button onClick={()=>setShowAdd(true)} style={{flexShrink:0,display:'flex',alignItems:'center',gap:'5px',padding:'5px 14px',borderRadius:'20px',background:'#3b82f1',border:'none',color:'white',fontSize:'12px',fontWeight:'600',cursor:'pointer',fontFamily:'Inter',marginLeft:'auto'}}><Plus size={12}/>New task</button>
        </div>
        <div style={{flex:1,overflow:'auto',padding:'12px 20px',display:'flex',flexDirection:'column',gap:'6px'}}>
          {filtered.length===0?(
            <div style={{textAlign:'center',padding:'60px 20px'}}>
              <div style={{fontSize:'52px',marginBottom:'16px'}}>✅</div>
              <h3 style={{fontSize:'20px',fontWeight:'700',color:'white',marginBottom:'8px'}}>{tasks.length===0?'Add your first task':'Nothing here'}</h3>
              <p style={{color:'#1e40af',fontSize:'14px',marginBottom:'24px',maxWidth:'240px',margin:'0 auto 24px',lineHeight:'1.6'}}>{tasks.length===0?'Create tasks and start tracking your time.':'Try a different filter.'}</p>
              {tasks.length===0&&<button onClick={()=>setShowAdd(true)} style={{padding:'12px 24px',borderRadius:'10px',background:'#3b82f6',border:'none',color:'white',fontSize:'14px',fontWeight:'600',cursor:'pointer',fontFamily:'Inter',boxShadow:'0 4px 16px #3b82f630'}}>Add first task</button>}
            </div>
          ):filtered.map(task=>{
            const time=getTaskTime(task);
            const pc=PRIORITY_COLORS[task.priority];
            return <div key={task.id} style={{background:'#0e0c1f',border:`1px solid ${task.done?'#1e1b4b':'#1e1b4b'}`,borderLeft:`3px solid ${pc}`,borderRadius:'10px',padding:'12px 14px',display:'flex',alignItems:'center',gap:'10px',transition:'all 0.2s',opacity:task.done?0.6:1}}>
              <button onClick={()=>persist(tasks.map(t=>t.id===task.id?{...t,done:!t.done}:t))} style={{width:'20px',height:'20px',borderRadius:'50%',border:`2px solid ${task.done?'#3b82f6':'#1e40af'}`,background:task.done?'#3b82f6':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,cursor:'pointer',transition:'all 0.2s'}}>
                {task.done&&<div style={{width:'8px',height:'8px',borderRadius:'50%',background:'white'}}/>}
              </button>
              <div style={{flex:1,minWidth:0}}>
                <div style={{color:task.done?'#4c4891':'white',fontSize:'13px',fontWeight:'500',textDecoration:task.done?'line-through':'none',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{task.title}</div>
                <div style={{display:'flex',gap:'8px',marginTop:'3px',flexWrap:'wrap'}}>
                  <span style={{fontSize:'10px',color:pc,background:pc+'15',padding:'1px 6px',borderRadius:'4px',textTransform:'capitalize'}}>{task.priority}</span>
                  {time>0&&<span style={{fontSize:'10px',color:'#1e40af'}}>⏱ {fmtTime(time)}</span>}
                  {task.dueDate&&<span style={{fontSize:'10px',color:'#1e40af'}}>📅 {task.dueDate}</span>}
                </div>
              </div>
              <div style={{display:'flex',gap:'4px',flexShrink:0}}>
                <button onClick={()=>persist(tasks.map(t=>t.id===task.id?{...t,starred:!t.starred}:t))} style={{padding:'4px',background:'none',border:'none',cursor:'pointer',color:task.starred?'#f59e0b':'#1e40af'}}><Star size={12} fill={task.starred?'#f59e0b':'none'}/></button>
                <button onClick={()=>toggleTimer(task.id)} style={{padding:'4px',background:task.timing?'#3b82f615':'none',borderRadius:'5px',border:'none',cursor:'pointer',color:task.timing?'#93c5fd':'#1e40af',transition:'all 0.2s'}}>
                  {task.timing?<Square size={12}/>:<Play size={12}/>}
                </button>
                <button onClick={()=>persist(tasks.filter(t=>t.id!==task.id))} style={{padding:'4px',background:'none',border:'none',cursor:'pointer',color:'#1e40af'}}><Trash2 size={12}/></button>
              </div>
            </div>;
          })}
        </div>
      </>}

      {tab==='stats'&&(
        <div style={{flex:1,overflow:'auto',padding:'16px 20px'}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'16px'}}>
            {[{l:'Total Tasks',v:String(tasks.length),c:'#3b82f6'},{l:'Completed',v:`${done} (${pct}%)`,c:'#10b981'},{l:'Time Logged',v:fmtTime(totalTime),c:'#6366f1'},{l:'Active',v:String(tasks.filter(t=>!t.done).length),c:'#f59e0b'}].map(s=>(
              <div key={s.l} style={{background:'#0e0c1f',border:'1px solid #1e1b4b',borderRadius:'12px',padding:'14px',textAlign:'center'}}>
                <div style={{fontSize:'20px',fontWeight:'700',color:s.c}}>{s.v}</div>
                <div style={{fontSize:'11px',color:'#1e40af',marginTop:'4px'}}>{s.l}</div>
              </div>
            ))}
          </div>
          <div style={{background:'#0e0c1f',border:'1px solid #1e1b4b',borderRadius:'12px',padding:'16px'}}>
            <div style={{fontSize:'12px',color:'#1e40af',fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'12px'}}>Progress</div>
            <div style={{height:'8px',background:'#1e1b4b',borderRadius:'4px',overflow:'hidden',marginBottom:'8px'}}>
              <div style={{width:`${pct}%`,height:'100%',background:'#3b82f6',borderRadius:'4px',transition:'width 0.5s ease'}}/>
            </div>
            <div style={{fontSize:'13px',color:'#93c5fd',textAlign:'right'}}>{pct}% complete</div>
          </div>
          {tasks.filter(t=>t.timeSpent>0||t.timing).sort((a,b)=>getTaskTime(b)-getTaskTime(a)).slice(0,5).map(t=>(
            <div key={t.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',background:'#0e0c1f',border:'1px solid #1e1b4b',borderRadius:'10px',marginTop:'8px'}}>
              <span style={{fontSize:'13px',color:'white',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>{t.title}</span>
              <span style={{fontSize:'12px',fontWeight:'600',color:'#3b82f6',flexShrink:0,marginLeft:'8px'}}>{fmtTime(getTaskTime(t))}</span>
            </div>
          ))}
        </div>
      )}

      {showAdd&&(
        <div style={{position:'fixed',inset:0,background:'#00000080',zIndex:50,display:'flex',alignItems:'flex-end'}} onClick={e=>e.target===e.currentTarget&&setShowAdd(false)}>
          <AddTaskForm onAdd={task=>{persist([task,...tasks]);setShowAdd(false);}} onClose={()=>setShowAdd(false)}/>
        </div>
      )}
    </div>
  );
}

function AddTaskForm({onAdd,onClose}:{onAdd:(t:Task)=>void;onClose:()=>void}) {
  const [title,setTitle]=useState('');
  const [priority,setPrio]=useState<Task['priority']>('medium');
  const [due,setDue]=useState('');
  const inp={width:'100%',background:'#080810',border:'1px solid #1e1b4b',borderRadius:'10px',padding:'11px 14px',color:'white',fontSize:'14px',outline:'none',fontFamily:'Inter'};
  return (
    <div style={{width:'100%',background:'#0e0c1f',borderRadius:'20px 20px 0 0',border:'1px solid #1e1b4b',padding:'24px',maxHeight:'80vh',overflowY:'auto'}}>
      <div style={{width:'36px',height:'3px',background:'#1e1b4b',borderRadius:'2px',margin:'0 auto 20px'}}/>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:'18px'}}>
        <h3 style={{color:'white',fontSize:'16px',fontWeight:'700',fontFamily:'Inter'}}>New Task</h3>
        <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#1e40af'}}><X size={16}/></button>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Task title *" style={inp} autoFocus onFocus={e=>e.target.style.borderColor='#3b82f6'} onBlur={e=>e.target.style.borderColor='#1e1b4b'}/>
        <div style={{display:'flex',gap:'6px'}}>
          {(['high','medium','low'] as const).map(p=><button key={p} onClick={()=>setPrio(p)} style={{flex:1,padding:'8px',borderRadius:'8px',border:`1px solid ${priority===p?PRIORITY_COLORS[p]:'#1e1b4b'}`,background:priority===p?PRIORITY_COLORS[p]+'20':'transparent',color:priority===p?PRIORITY_COLORS[p]:'#1e40af',fontSize:'12px',fontWeight:'600',cursor:'pointer',fontFamily:'Inter',textTransform:'capitalize'}}>{p}</button>)}
        </div>
        <input type="date" value={due} onChange={e=>setDue(e.target.value)} style={inp} onFocus={e=>e.target.style.borderColor='#3b82f6'} onBlur={e=>e.target.style.borderColor='#1e1b4b'}/>
        <button onClick={()=>{if(!title.trim())return;onAdd({id:crypto.randomUUID(),title:title.trim(),priority,done:false,timeSpent:0,timing:false,timerStart:null,dueDate:due,starred:false,createdAt:Date.now()});}} disabled={!title.trim()} style={{padding:'14px',borderRadius:'12px',background:!title.trim()?'#1e1b4b':'#3b82f6',border:'none',color:'white',fontSize:'15px',fontWeight:'700',cursor:!title.trim()?'not-allowed':'pointer',fontFamily:'Inter',opacity:!title.trim()?0.5:1}}>Add Task</button>
      </div>
    </div>
  );
}

