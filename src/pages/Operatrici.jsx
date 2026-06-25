// ── OPERATRICI ────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient' 
import { Users, Plus, Pencil, Trash2, Check, X, Search } from 'lucide-react'

export default function Operatrici() {
  const [staff,   setStaff]   = useState([])
  const [filter,  setFilter]  = useState('')
  const [editId,  setEditId]  = useState(null)
  const [editVal, setEditVal] = useState('')
  const [newName, setNewName] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [err,     setErr]     = useState('')

// 2. NUOVO METODO PER LEGGERE I DATI (GET)
  const load = async () => {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .order('nome') // Li ordina automaticamente per nome!

    if (error) console.error("Errore lettura staff:", error)
    else setStaff(data)
  }
  
  useEffect(()=>{ load() },[])

  const filtered = staff.filter(s=>s.nome.toLowerCase().includes(filter.toLowerCase()))

 // 3. NUOVO METODO PER AGGIUNGERE (POST)
  const add = async () => {
    if (!newName.trim()) { setErr('Nome obbligatorio'); return }
    
    const { error } = await supabase
      .from('staff')
      .insert([{ nome: newName.trim() }])

    if (error) {
      setErr(error.message)
    } else {
      setNewName(''); setShowAdd(false); setErr(''); load()
    }
  }

  // 4. NUOVO METODO PER MODIFICARE (PUT)
  const save = async id => {
    if (!editVal.trim()) { setErr('Nome obbligatorio'); return }
    
    const { error } = await supabase
      .from('staff')
      .update({ nome: editVal.trim() })
      .eq('id', id) // Significa: "Aggiorna dove l'id è uguale a questo id"

    if (error) {
      setErr(error.message)
    } else {
      setEditId(null); setErr(''); load()
    }
  }

  // 5. NUOVO METODO PER ELIMINARE (DELETE)
  const del = async (id,nome) => {
    if (!confirm(`Eliminare "${nome}"?`)) return
    
    const { error } = await supabase
      .from('staff')
      .delete()
      .eq('id', id)

    if (error) alert("Errore durante l'eliminazione: " + error.message)
    else load()
  }

  return (
    <div style={{ maxWidth:600, margin:'0 auto', display:'flex', flexDirection:'column', gap:14 }}>
      <div className="card" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <Users size={22} color="#D4AF37"/>
          <div><p style={{ fontWeight:700, margin:0 }}>Operatrici</p><p style={{ fontSize:12, color:'#6b7280', margin:0 }}>{filtered.length} di {staff.length}</p></div>
        </div>
        <button className="btn-gold" onClick={()=>{setShowAdd(true);setErr('')}} style={{ display:'flex', alignItems:'center', gap:6 }}><Plus size={16}/>Aggiungi</button>
      </div>

      <div style={{ position:'relative' }}>
        <Search size={15} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#9ca3af' }}/>
        <input className="input-base" style={{ paddingLeft:32 }} placeholder="Cerca operatrice..." value={filter} onChange={e=>setFilter(e.target.value)}/>
        {filter&&<button onClick={()=>setFilter('')} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#9ca3af' }}><X size={13}/></button>}
      </div>

      {err && <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', color:'#dc2626', padding:'8px 12px', borderRadius:8, fontSize:13 }}>{err}</div>}

      {showAdd && (
        <div className="card" style={{ display:'flex', alignItems:'center', gap:10, border:'2px solid #D4AF37' }}>
          <input autoFocus className="input-base" style={{ flex:1 }} placeholder="Nome operatrice..." value={newName}
            onChange={e=>setNewName(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter')add(); if(e.key==='Escape')setShowAdd(false) }}/>
          <button className="btn-success" style={{ display:'flex', gap:4 }} onClick={add}><Check size={15}/>Salva</button>
          <button className="btn-ghost" style={{ padding:'8px' }} onClick={()=>{setShowAdd(false);setNewName('');setErr('')}}><X size={15}/></button>
        </div>
      )}

      {filtered.length===0 ? (
        <div className="card" style={{ textAlign:'center', padding:'40px 0', color:'#9ca3af' }}><Users size={44} strokeWidth={1} style={{ margin:'0 auto 8px' }}/><p style={{ fontSize:13 }}>{filter?'Nessun risultato.':'Nessuna operatrice. Aggiungine una!'}</p></div>
      ) : filtered.map((s,i)=>(
        <div key={s.id} className="card" style={{ display:'flex', alignItems:'center', gap:12, borderLeft:'3px solid #D4AF37' }}>
          <div style={{ width:38, height:38, borderRadius:'50%', background:`hsl(${i*67+20},60%,45%)`, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:700, fontSize:14, flexShrink:0 }}>{s.nome.trim().charAt(0).toUpperCase()}</div>
          {editId===s.id ? (
            <input autoFocus className="input-base" style={{ flex:1 }} value={editVal} onChange={e=>setEditVal(e.target.value)}
              onKeyDown={e=>{ if(e.key==='Enter')save(s.id); if(e.key==='Escape')setEditId(null) }}/>
          ) : (
            <div style={{ flex:1 }}><p style={{ fontWeight:600, margin:0 }}>{s.nome}</p><p style={{ fontSize:11, color:'#9ca3af', margin:0 }}>ID #{s.id}</p></div>
          )}
          <div style={{ display:'flex', gap:6 }}>
            {editId===s.id ? (
              <><button className="btn-success" style={{ display:'flex', gap:4 }} onClick={()=>save(s.id)}><Check size={14}/>Salva</button><button className="btn-ghost" style={{ padding:'7px' }} onClick={()=>setEditId(null)}><X size={14}/></button></>
            ) : (
              <><button className="btn-ghost" style={{ padding:'7px' }} onClick={()=>{setEditId(s.id);setEditVal(s.nome)}}><Pencil size={14}/></button><button onClick={()=>del(s.id,s.nome)} style={{ padding:'7px', background:'none', border:'none', cursor:'pointer', color:'#f87171', borderRadius:8 }} onMouseEnter={e=>e.currentTarget.style.background='#fef2f2'} onMouseLeave={e=>e.currentTarget.style.background='none'}><Trash2 size={14}/></button></>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
