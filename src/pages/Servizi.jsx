import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { Scissors, Plus, Pencil, Trash2, Check, X, Clock, Search } from 'lucide-react'

function SvcForm({ init, onSave, onCancel, label }) {
  const [nome,   setNome]   = useState(init?.nome||'')
  const [dur,    setDur]    = useState(init?.durata_minuti??30)
  const [prezzo, setPrezzo] = useState(init?.prezzo??'')
  const [err,    setErr]    = useState('')
  const ref = useRef(null)
  useEffect(()=>ref.current?.focus(),[])

  const submit = () => {
    if (!nome.trim()) { setErr('Nome obbligatorio'); return }
    onSave({ nome: nome.trim(), durata_minuti: parseInt(dur)||30, prezzo: parseFloat(prezzo)||0 })
  }

 return (
    <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:8, padding:'10px 12px', background:'#fefce8', borderBottom:'2px solid #D4AF37' }}>
      <input ref={ref} value={nome} onChange={e=>{setNome(e.target.value);setErr('')}}
        onKeyDown={e=>{ if(e.key==='Enter')submit(); if(e.key==='Escape')onCancel() }}
        placeholder="Nome servizio *" className="input-base" style={{ flex:'1 1 160px', borderColor:err?'#ef4444':'' }}/>
      <div style={{ display:'flex', alignItems:'center', gap:4 }}>
        <Clock size={12} color="#9ca3af"/>
        <input type="number" min={5} step={5} value={dur} onChange={e=>setDur(e.target.value)} placeholder="Min" className="input-base" style={{ width:72 }}/>
      </div>
      <input type="number" min={0} step={0.5} value={prezzo} onChange={e=>setPrezzo(e.target.value)} placeholder="€ Prezzo" className="input-base" style={{ width:88 }}/>
      {err&&<span style={{ color:'#ef4444', fontSize:11, width:'100%' }}>{err}</span>}
      <button className="btn-success" style={{ display:'flex', gap:4 }} onClick={submit}><Check size={13}/>{label}</button>
      <button className="btn-ghost" style={{ padding:'8px' }} onClick={onCancel}><X size={13}/></button>
    </div>
  )
}

export default function Servizi() {
  const [services, setServices] = useState([])
  const [filter,   setFilter]   = useState('')
  const [editId,   setEditId]   = useState(null)
  const [showAdd,  setShowAdd]  = useState(false)
  const [err,      setErr]      = useState('')

  // 2. NUOVO METODO PER LEGGERE I DATI (GET)
  const load = async () => {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('nome') // Li ordiniamo alfabeticamente

    if (error) console.error("Errore lettura servizi:", error)
    else setServices(data)
  }
  
  useEffect(()=>{ load() },[])

  const filtered = services.filter(s=>s.nome.toLowerCase().includes(filter.toLowerCase()))
  const total    = filtered.reduce((s,x)=>s+(parseFloat(x.prezzo)||0),0)

  // 3. NUOVO METODO PER AGGIUNGERE (POST)
  const add = async data => {
    const { error } = await supabase.from('services').insert([data])
    if (error) {
      setErr(error.message)
    } else {
      setShowAdd(false); setErr(''); load()
    }
  }

  // 4. NUOVO METODO PER MODIFICARE (PUT)
  const edit = async (id, data) => {
    const { error } = await supabase.from('services').update(data).eq('id', id)
    if (error) {
      setErr(error.message)
    } else {
      setEditId(null); setErr(''); load()
    }
  }

  // 5. NUOVO METODO PER ELIMINARE (DELETE)
  const del = async (id, nome) => {
    if (!confirm(`Eliminare "${nome}"?`)) return
    const { error } = await supabase.from('services').delete().eq('id', id)
    if (error) alert("Errore durante l'eliminazione: " + error.message)
    else load()
  }

  return (
    <div style={{ maxWidth:740, margin:'0 auto', display:'flex', flexDirection:'column', gap:14 }}>
      <div className="card" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <Scissors size={22} color="#D4AF37"/>
          <div><p style={{ fontWeight:700, margin:0 }}>Listino Servizi</p><p style={{ fontSize:12, color:'#6b7280', margin:0 }}>{filtered.length} servizi · € {total.toFixed(2)}</p></div>
        </div>
        <button className="btn-gold" onClick={()=>{setShowAdd(true);setEditId(null);setErr('')}} style={{ display:'flex', gap:6 }}><Plus size={16}/>Aggiungi</button>
      </div>

      <div style={{ position:'relative' }}>
        <Search size={15} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#9ca3af' }}/>
        <input className="input-base" style={{ paddingLeft:32 }} placeholder="Cerca servizio..." value={filter} onChange={e=>setFilter(e.target.value)}/>
        {filter&&<button onClick={()=>setFilter('')} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#9ca3af' }}><X size={13}/></button>}
      </div>

      {services.length>0 && (
        <div className="card" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 20px', background:'linear-gradient(135deg,#1a1a2e,#2d2d4e)', color:'white' }}>
          <span style={{ color:'#D4AF37', fontWeight:600, fontSize:13 }}>Valore totale listino</span>
          <span style={{ fontSize:22, fontWeight:700 }}>€ {services.reduce((s,x)=>s+(parseFloat(x.prezzo)||0),0).toFixed(2)}</span>
        </div>
      )}

      {err&&<div style={{ background:'#fef2f2', border:'1px solid #fca5a5', color:'#dc2626', padding:'8px 12px', borderRadius:8, fontSize:13 }}>{err}</div>}

      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        {showAdd && <SvcForm onSave={add} onCancel={()=>{setShowAdd(false);setErr('')}} label="Aggiungi"/>}
        {filtered.length===0&&!showAdd ? (
          <div style={{ textAlign:'center', padding:'40px 0', color:'#9ca3af' }}><Scissors size={44} strokeWidth={1} style={{ margin:'0 auto 8px' }}/><p style={{ fontSize:13 }}>{filter?'Nessun risultato.':'Nessun servizio nel listino.'}</p></div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'#f9fafb', borderBottom:'1px solid #f3f4f6' }}>
                <th style={{ textAlign:'left', padding:'10px 16px', fontWeight:600, color:'#6b7280' }}>Servizio</th>
                <th style={{ textAlign:'center', padding:'10px 16px', fontWeight:600, color:'#6b7280' }}>Durata</th>
                <th style={{ textAlign:'right', padding:'10px 16px', fontWeight:600, color:'#6b7280' }}>Prezzo</th>
                <th style={{ width:80 }}/>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s=>(
                <React.Fragment key={s.id}>
                  {editId===s.id && (
                    <tr><td colSpan={4} style={{ padding:0 }}><SvcForm init={s} onSave={d=>edit(s.id,d)} onCancel={()=>{setEditId(null);setErr('')}} label="Salva"/></td></tr>
                  )}
                  {editId!==s.id && (
                    <tr style={{ borderBottom:'1px solid #f9fafb' }} onMouseEnter={e=>e.currentTarget.style.background='#f9fafb'} onMouseLeave={e=>e.currentTarget.style.background='white'}>
                      <td style={{ padding:'10px 16px', fontWeight:500 }}>{s.nome}</td>
                      <td style={{ padding:'10px 16px', textAlign:'center', color:'#6b7280' }}><span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}><Clock size={12}/>{s.durata_minuti} min</span></td>
                      <td style={{ padding:'10px 16px', textAlign:'right', fontWeight:700, color:'#16a34a' }}>€ {parseFloat(s.prezzo).toFixed(2)}</td>
                      <td style={{ padding:'10px 12px' }}>
                        <div style={{ display:'flex', justifyContent:'flex-end', gap:4 }}>
                          <button className="btn-ghost" style={{ padding:'6px' }} onClick={()=>{setEditId(s.id);setShowAdd(false);setErr('')}}><Pencil size={13}/></button>
                          <button onClick={()=>del(s.id,s.nome)} style={{ padding:'6px', background:'none', border:'none', cursor:'pointer', color:'#f87171', borderRadius:6 }} onMouseEnter={e=>e.currentTarget.style.background='#fef2f2'} onMouseLeave={e=>e.currentTarget.style.background='none'}><Trash2 size={13}/></button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
