import React, { useState, useEffect, useCallback } from 'react'
// 1. ELIMINATO axios, IMPORTATO supabase
import { supabase } from '../supabaseClient'
import { UserCircle, Search, Plus, Trash2, Check, X, ChevronRight, ArrowLeft, Phone, FileText, Calendar } from 'lucide-react'

function Detail({ client, onBack, onDeleted }) {
  const [form, setForm] = useState({...client})
  const [appts, setAppts] = useState([])
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  // 2. NUOVO METODO PER LEGGERE LO STORICO (GET con Join)
  useEffect(()=>{
    setForm({...client})
    
    const fetchAppuntamenti = async () => {
      // Usiamo Supabase per prendere gli appuntamenti e, contemporaneamente, i nomi di servizi e staff
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id, 
          data_ora_inizio, 
          services ( nome, prezzo ), 
          staff ( nome )
        `)
        .eq('client_id', client.id)
        .order('data_ora_inizio', { ascending: false }) // Dal più recente al più vecchio

      if (error) {
        console.error("Errore storico:", error)
      } else if (data) {
        // Appiattiamo i dati per renderli compatibili con la tua vecchia grafica
        const formattati = data.map(a => ({
          id: a.id,
          data_ora_inizio: a.data_ora_inizio,
          prezzo: a.services ? a.services.prezzo : 0,
          servizio_nome: a.services ? a.services.nome : 'Servizio eliminato',
          staff_nome: a.staff ? a.staff.nome : ''
        }))
        setAppts(formattati)
      }
    }
    fetchAppuntamenti()
  },[client.id])

  // 3. NUOVO METODO PER AGGIORNARE CLIENTE (PUT)
  const save = async()=>{
    setSaving(true)
    const { error } = await supabase
      .from('clients')
      .update({
        nome: form.nome, 
        cognome: form.cognome, 
        telefono: form.telefono, 
        email: form.email, 
        note: form.note
      })
      .eq('id', client.id)

    if (error) {
      alert('Errore salvataggio: ' + error.message)
    } else {
      setSaved(true); setTimeout(()=>setSaved(false),2000)
    }
    setSaving(false)
  }

  // 4. NUOVO METODO PER ELIMINARE CLIENTE (DELETE)
  const del = async()=>{
    if (!confirm(`Eliminare ${client.nome} ${client.cognome}?`)) return
    const { error } = await supabase.from('clients').delete().eq('id', client.id)
    if (error) alert('Errore durante eliminazione: ' + error.message)
    else onDeleted()
  }

  const totalSpeso = appts.reduce((s,a)=>s+(parseFloat(a.prezzo)||0),0)
  const f = form

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div className="card" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 16px' }}>
        <button className="btn-ghost" style={{ display:'flex', gap:6 }} onClick={onBack}><ArrowLeft size={15}/>Torna alla lista</button>
        <button onClick={del} style={{ display:'flex', gap:6, alignItems:'center', padding:'7px 12px', background:'none', border:'none', cursor:'pointer', color:'#ef4444', borderRadius:8, fontSize:13 }} onMouseEnter={e=>e.currentTarget.style.background='#fef2f2'} onMouseLeave={e=>e.currentTarget.style.background='none'}><Trash2 size={14}/>Elimina cliente</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        {/* Anagrafica */}
        <div className="card" style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:4 }}>
            <div style={{ width:46, height:46, borderRadius:'50%', background:'#D4AF37', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:700, fontSize:16, flexShrink:0 }}>
              {(client.nome[0]||'?').toUpperCase()}{(client.cognome[0]||'').toUpperCase()}
            </div>
            <div><p style={{ fontWeight:700, margin:0 }}>{client.nome} {client.cognome}</p><p style={{ fontSize:11, color:'#9ca3af', margin:0 }}>{client.data_registrazione?.split('T')[0]||''}</p></div>
          </div>

          {[['Nome *','nome'],['Cognome','cognome'],['Telefono','telefono'],['Email','email']].map(([lbl,key])=>(
            <div key={key}>
              <label style={{ fontSize:11, fontWeight:600, color:'#6b7280', display:'block', marginBottom:3 }}>{lbl}</label>
              <input className="input-base" value={f[key]||''} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))}/>
            </div>
          ))}
          <div>
            <label style={{ fontSize:11, fontWeight:600, color:'#6b7280', display:'flex', gap:4, alignItems:'center', marginBottom:3 }}><FileText size={11}/>Note (formula colore...)</label>
            <textarea className="input-base" rows={4} style={{ resize:'none' }} value={f.note||''} onChange={e=>setForm(p=>({...p,note:e.target.value}))} placeholder="Es: SHEIS 35ml 7/0..."/>
          </div>
          <button className="btn-gold" onClick={save} style={{ display:'flex', justifyContent:'center', gap:6 }}>
            {saved?<><Check size={14}/>Salvato!</>:saving?'Salvataggio...':<><Check size={14}/>Salva modifiche</>}
          </button>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:4 }}>
            <div className="card" style={{ textAlign:'center', padding:10 }}><p style={{ fontSize:22, fontWeight:700, margin:0 }}>{appts.length}</p><p style={{ fontSize:11, color:'#6b7280', margin:0 }}>Appuntamenti</p></div>
            <div className="card" style={{ textAlign:'center', padding:10 }}><p style={{ fontSize:22, fontWeight:700, color:'#16a34a', margin:0 }}>€{totalSpeso.toFixed(0)}</p><p style={{ fontSize:11, color:'#6b7280', margin:0 }}>Totale speso</p></div>
          </div>
        </div>

        {/* Storico */}
        <div className="card" style={{ display:'flex', flexDirection:'column', gap:10, overflow:'hidden', maxHeight:600 }}>
          <p style={{ fontWeight:700, fontSize:13, display:'flex', gap:6, alignItems:'center', margin:0, flexShrink:0 }}><Calendar size={15} color="#D4AF37"/>Storico appuntamenti</p>
          {appts.length===0 ? (
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'#d1d5db', flexDirection:'column', gap:8 }}>
              <Calendar size={34} strokeWidth={1}/><p style={{ fontSize:12 }}>Nessun appuntamento</p>
            </div>
          ) : (
            <div style={{ overflowY:'auto', flex:1, display:'flex', flexDirection:'column', gap:8 }}>
              {appts.map(a=>(
                <div key={a.id} style={{ background:'#f9f9f6', borderLeft:'3px solid #D4AF37', borderRadius:8, padding:'10px 12px', fontSize:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                    <span style={{ fontWeight:600 }}>{a.servizio_nome||'Servizio'}</span>
                    <span style={{ fontWeight:700, color:'#16a34a' }}>€{parseFloat(a.prezzo||0).toFixed(2)}</span>
                  </div>
                  <p style={{ margin:0, color:'#6b7280' }}>{a.data_ora_inizio||'—'}</p>
                  {a.staff_nome&&<p style={{ margin:0, color:'#9ca3af' }}>con {a.staff_nome}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Clienti() {
  const [clients, setClients] = useState([])
  const [search,  setSearch]  = useState('')
  const [sel,     setSel]     = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form,    setForm]    = useState({ nome:'', cognome:'', telefono:'', email:'', note:'' })
  const [err,     setErr]     = useState('')
  const [loading, setLoading] = useState(false)

  // 5. NUOVO METODO PER CERCARE/ELENCARE CLIENTI (GET con ricerca)
  const load = useCallback(async (q='')=>{
    setLoading(true)
    let query = supabase.from('clients').select('*').order('nome')

    // Se stiamo cercando qualcosa, filtriamo per nome, cognome o telefono (ignorando maiuscole/minuscole)
    if (q) {
      query = query.or(`nome.ilike.%${q}%,cognome.ilike.%${q}%,telefono.ilike.%${q}%`)
    }

    const { data, error } = await query
    
    if (error) console.error(error)
    else setClients(data || [])
    
    setLoading(false)
  },[])

  useEffect(()=>{ load() },[load])
  useEffect(()=>{ const t=setTimeout(()=>load(search),300); return()=>clearTimeout(t) },[search,load])

  // 6. NUOVO METODO PER AGGIUNGERE UN CLIENTE (POST)
  const add = async()=>{
    if (!form.nome.trim()) { setErr('Nome obbligatorio'); return }
    const { error } = await supabase.from('clients').insert([{
      nome: form.nome, cognome: form.cognome, telefono: form.telefono, email: form.email, note: form.note
    }])

    if (error) {
      setErr(error.message)
    } else {
      setForm({nome:'',cognome:'',telefono:'',email:'',note:''}); 
      setShowAdd(false); setErr(''); load(search)
    }
  }

  if (sel) return <Detail client={sel} onBack={()=>{ setSel(null); load(search) }} onDeleted={()=>{ setSel(null); load(search) }}/>

  return (
    <div style={{ maxWidth:700, margin:'0 auto', display:'flex', flexDirection:'column', gap:14 }}>
      <div className="card" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <UserCircle size={22} color="#D4AF37"/>
          <div><p style={{ fontWeight:700, margin:0 }}>Clienti</p><p style={{ fontSize:12, color:'#6b7280', margin:0 }}>{clients.length} clienti</p></div>
        </div>
        <button className="btn-gold" onClick={()=>{setShowAdd(true);setErr('')}} style={{ display:'flex', gap:6 }}><Plus size={16}/>Nuova cliente</button>
      </div>

      <div style={{ position:'relative' }}>
        <Search size={15} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#9ca3af' }}/>
        <input className="input-base" style={{ paddingLeft:32 }} placeholder="Cerca per nome, cognome, telefono..." value={search} onChange={e=>setSearch(e.target.value)}/>
        {search&&<button onClick={()=>setSearch('')} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#9ca3af' }}><X size={13}/></button>}
      </div>

      {err&&<div style={{ background:'#fef2f2', border:'1px solid #fca5a5', color:'#dc2626', padding:'8px 12px', borderRadius:8, fontSize:13 }}>{err}</div>}

      {showAdd && (
        <div className="card" style={{ border:'2px solid #D4AF37' }}>
          <p style={{ fontWeight:600, fontSize:13, marginBottom:10, marginTop:0 }}>Nuova Cliente</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
            {[['Nome *','nome'],['Cognome','cognome'],['Telefono','telefono'],['Email','email']].map(([lbl,key])=>(
              <input key={key} className="input-base" placeholder={lbl} value={form[key]} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))} autoFocus={key==='nome'}/>
            ))}
          </div>
          <textarea className="input-base" rows={2} style={{ resize:'none', marginBottom:8, width:'100%' }} placeholder="Note (formula colore, allergie...)" value={form.note} onChange={e=>setForm(p=>({...p,note:e.target.value}))}/>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn-success" style={{ display:'flex', gap:4 }} onClick={add}><Check size={14}/>Aggiungi</button>
            <button className="btn-ghost" onClick={()=>{setShowAdd(false);setErr('')}}><X size={14}/></button>
          </div>
        </div>
      )}

      {loading ? <div className="card" style={{ textAlign:'center', color:'#9ca3af', padding:40 }}>Caricamento...</div>
      : clients.length===0 ? (
        <div className="card" style={{ textAlign:'center', padding:'40px 0', color:'#9ca3af' }}><UserCircle size={44} strokeWidth={1} style={{ margin:'0 auto 8px' }}/><p style={{ fontSize:13 }}>{search?'Nessun cliente trovato.':'Nessuna cliente ancora.'}</p></div>
      ) : (
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          {clients.map((c,i)=>(
            <button key={c.id} onClick={()=>setSel(c)}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background:'white', border:'none', borderBottom:'1px solid #f9fafb', cursor:'pointer', textAlign:'left' }}
              onMouseEnter={e=>e.currentTarget.style.background='#fefce8'}
              onMouseLeave={e=>e.currentTarget.style.background='white'}>
              <div style={{ width:36, height:36, borderRadius:'50%', background:`hsl(${(i*53+180)%360},55%,45%)`, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:700, fontSize:13, flexShrink:0 }}>
                {(c.nome[0]||'?').toUpperCase()}{(c.cognome[0]||'').toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontWeight:600, fontSize:13, margin:0 }}>{c.cognome} {c.nome}</p>
                <div style={{ display:'flex', gap:12, fontSize:11, color:'#9ca3af' }}>
                  {c.telefono&&<span style={{ display:'flex', gap:3, alignItems:'center' }}><Phone size={10}/>{c.telefono}</span>}
                  {c.note&&<span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:200 }}>{c.note.substring(0,45)}{c.note.length>45?'…':''}</span>}
                </div>
              </div>
              <ChevronRight size={15} color="#d1d5db"/>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}