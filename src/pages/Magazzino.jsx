import React, { useState, useEffect } from 'react'
// 1. IMPORTIAMO IL CLIENT SUPABASE
import { supabase } from '../supabaseClient'
import { Package, Plus, Minus, Trash2, AlertTriangle, TrendingUp, Check, X, Pencil, Search } from 'lucide-react'

export default function Magazzino() {
  const [products, setProducts] = useState([])
  const [filter,   setFilter]   = useState('')
  const [showAdd,  setShowAdd]  = useState(false)
  const [form,     setForm]     = useState({ nome:'', quantita_disponibile:0, prezzo_vendita:'', avviso_scorta_minima:5 })
  const [editId,   setEditId]   = useState(null)
  const [editForm, setEditForm] = useState({})
  const [err,      setErr]      = useState('')
  const [busy,     setBusy]     = useState(null)

  // 2. METODO PER LEGGERE I PRODOTTI
  const load = async () => {
    const { data, error } = await supabase.from('products').select('*').order('nome')
    if (error) console.error("Errore lettura prodotti:", error)
    else setProducts(data || [])
  }
  
  useEffect(()=>{ load() },[])

  const filtered = products.filter(p=>p.nome.toLowerCase().includes(filter.toLowerCase()))
  const totalRic = products.reduce((s,p)=>s+(parseFloat(p.ricavo_totale)||0),0)
  const alerts   = products.filter(p=>p.quantita_disponibile<=p.avviso_scorta_minima)

  // 3. METODO PER AGGIUNGERE UN PRODOTTO
  const add = async () => {
    if (!form.nome.trim()) { setErr('Nome obbligatorio'); return }
    try {
      const { error } = await supabase.from('products').insert([{ 
        nome: form.nome.trim(), 
        quantita_disponibile: parseInt(form.quantita_disponibile)||0, 
        prezzo_vendita: parseFloat(form.prezzo_vendita)||0, 
        avviso_scorta_minima: parseInt(form.avviso_scorta_minima)||5,
        ricavo_totale: 0
      }])
      if (error) throw error
      
      setForm({nome:'',quantita_disponibile:0,prezzo_vendita:'',avviso_scorta_minima:5}); 
      setShowAdd(false); setErr(''); load()
    } catch(e){ setErr(e.message||'Errore') }
  }

  // 4. METODO PER VENDERE (-1 Qtà, + Ricavo)
  const sell = async p => {
    if (p.quantita_disponibile <= 0) return
    setBusy(`sell-${p.id}`)
    try { 
      const nuovaQta = p.quantita_disponibile - 1
      const nuovoRicavo = (parseFloat(p.ricavo_totale) || 0) + (parseFloat(p.prezzo_vendita) || 0)
      
      const { data, error } = await supabase
        .from('products')
        .update({ quantita_disponibile: nuovaQta, ricavo_totale: nuovoRicavo })
        .eq('id', p.id)
        .select() // Per farci restituire la riga aggiornata

      if (error) throw error
      if (data && data[0]) {
         // Aggiorniamo la lista locale senza ricaricare tutto dal database
         setProducts(prev => prev.map(x => x.id === p.id ? data[0] : x))
      }
    }
    catch(e){ alert(e.message||'Errore') } 
    finally { setBusy(null) }
  }

  // 5. METODO PER RIFORNIRE (+1 Qtà)
  const restock = async p => {
    setBusy(`restock-${p.id}`)
    try { 
      const nuovaQta = p.quantita_disponibile + 1
      // Calcoliamo la spesa sottratta al ricavo totale (non andando mai sotto zero)
      const nuovoRicavo = Math.max(0, (parseFloat(p.ricavo_totale) || 0) - (parseFloat(p.prezzo_vendita) || 0))
      
      const { data, error } = await supabase
        .from('products')
        .update({ quantita_disponibile: nuovaQta, ricavo_totale: nuovoRicavo })
        .eq('id', p.id)
        .select()

      if (error) throw error
      if (data && data[0]) {
         setProducts(prev => prev.map(x => x.id === p.id ? data[0] : x))
      }
    }
    catch(e){ alert(e.message||'Errore') } 
    finally { setBusy(null) }
  }

  // 6. METODO PER ELIMINARE
  const del = async (id,nome) => {
    if (!confirm(`Eliminare "${nome}"?`)) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) alert(error.message)
    else load()
  }

  // 7. METODO PER SALVARE LA MODIFICA INLINE
  const saveEdit = async id => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ 
          nome: editForm.nome, 
          quantita_disponibile: parseInt(editForm.quantita_disponibile)||0, 
          prezzo_vendita: parseFloat(editForm.prezzo_vendita)||0, 
          avviso_scorta_minima: parseInt(editForm.avviso_scorta_minima)||5 
        })
        .eq('id', id)
        
      if (error) throw error
      setEditId(null); load()
    } catch(e){ alert(e.message||'Errore') }
  }

  // LA GRAFICA È IDENTICA, tranne per come passiamo `p` a sell() e restock()
  return (
    <div style={{ maxWidth:900, margin:'0 auto', display:'flex', flexDirection:'column', gap:14 }}>
      {/* Card ricavo */}
      <div className="card" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'18px 24px', background:'linear-gradient(135deg,#27AE60,#1e8449)', color:'white' }}>
        <div style={{ display:'flex', gap:12, alignItems:'center' }}><TrendingUp size={28}/><div><p style={{ fontSize:12, opacity:.8, margin:0 }}>Ricavo totale magazzino</p><p style={{ fontSize:28, fontWeight:700, margin:0 }}>€ {totalRic.toFixed(2)}</p></div></div>
        <div style={{ textAlign:'right', opacity:.7, fontSize:12 }}><p style={{ margin:0 }}>{products.length} prodotti</p><p style={{ margin:0 }}>{alerts.length} in esaurimento</p></div>
      </div>

      {alerts.map(p=>(<div key={p.id} className="alert-scorta"><AlertTriangle size={14}/><span><b>{p.nome}</b>: {p.quantita_disponibile} pz (soglia: {p.avviso_scorta_minima})</span></div>))}

      <div className="card" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px' }}>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}><Package size={22} color="#D4AF37"/><p style={{ fontWeight:700, margin:0 }}>Magazzino Prodotti</p></div>
        <button className="btn-gold" onClick={()=>{setShowAdd(true);setErr('')}} style={{ display:'flex', gap:6 }}><Plus size={16}/>Nuovo prodotto</button>
      </div>

      <div style={{ position:'relative' }}>
        <Search size={15} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#9ca3af' }}/>
        <input className="input-base" style={{ paddingLeft:32 }} placeholder="Cerca prodotto..." value={filter} onChange={e=>setFilter(e.target.value)}/>
        {filter&&<button onClick={()=>setFilter('')} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#9ca3af' }}><X size={13}/></button>}
      </div>

      {err&&<div style={{ background:'#fef2f2', border:'1px solid #fca5a5', color:'#dc2626', padding:'8px 12px', borderRadius:8, fontSize:13 }}>{err}</div>}

      {showAdd && (
        <div className="card" style={{ border:'2px solid #D4AF37' }}>
          <p style={{ fontWeight:600, fontSize:13, marginBottom:10, marginTop:0 }}>Nuovo Prodotto</p>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:8, marginBottom:10 }}>
            <input autoFocus className="input-base" placeholder="Nome *" value={form.nome} onChange={e=>setForm(p=>({...p,nome:e.target.value}))}/>
            <input type="number" min={0} className="input-base" placeholder="Quantità" value={form.quantita_disponibile} onChange={e=>setForm(p=>({...p,quantita_disponibile:e.target.value}))}/>
            <input type="number" min={0} step={0.01} className="input-base" placeholder="Prezzo €" value={form.prezzo_vendita} onChange={e=>setForm(p=>({...p,prezzo_vendita:e.target.value}))}/>
            <input type="number" min={0} className="input-base" placeholder="Soglia alert" value={form.avviso_scorta_minima} onChange={e=>setForm(p=>({...p,avviso_scorta_minima:e.target.value}))}/>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn-success" style={{ display:'flex', gap:4 }} onClick={add}><Check size={14}/>Aggiungi</button>
            <button className="btn-ghost" onClick={()=>{setShowAdd(false);setErr('')}}><X size={14}/></button>
          </div>
        </div>
      )}

      {filtered.length===0 ? (
        <div className="card" style={{ textAlign:'center', padding:'40px 0', color:'#9ca3af' }}><Package size={44} strokeWidth={1} style={{ margin:'0 auto 8px' }}/><p style={{ fontSize:13 }}>{filter?'Nessun prodotto trovato.':'Nessun prodotto nel magazzino.'}</p></div>
      ) : (
        <div className="card" style={{ padding:0, overflow:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead><tr style={{ background:'#f9fafb', borderBottom:'1px solid #f3f4f6' }}>
              {['Prodotto','Prezzo','Quantità','Incasso totale','Azioni',''].map((h,i)=>(
                <th key={i} style={{ padding:'10px 14px', fontWeight:600, color:'#6b7280', textAlign:i===0?'left':i===5?'left':'center' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map(p=>{
                const low=p.quantita_disponibile<=p.avviso_scorta_minima
                if (editId===p.id) return (
                  <tr key={p.id} style={{ borderBottom:'1px solid #f3f4f6', background:'#fefce8' }}>
                    <td colSpan={6} style={{ padding:'8px 12px' }}>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:8, alignItems:'center' }}>
                        <input className="input-base" style={{ width:160 }} value={editForm.nome} onChange={e=>setEditForm(p=>({...p,nome:e.target.value}))} placeholder="Nome"/>
                        <input type="number" className="input-base" style={{ width:90 }} value={editForm.prezzo_vendita} onChange={e=>setEditForm(p=>({...p,prezzo_vendita:e.target.value}))} placeholder="€"/>
                        <input type="number" className="input-base" style={{ width:80 }} value={editForm.quantita_disponibile} onChange={e=>setEditForm(p=>({...p,quantita_disponibile:e.target.value}))} placeholder="Qtà"/>
                        <input type="number" className="input-base" style={{ width:90 }} value={editForm.avviso_scorta_minima} onChange={e=>setEditForm(p=>({...p,avviso_scorta_minima:e.target.value}))} placeholder="Soglia"/>
                        <button className="btn-success" style={{ display:'flex', gap:4 }} onClick={()=>saveEdit(p.id)}><Check size={13}/>Salva</button>
                        <button className="btn-ghost" style={{ padding:'7px' }} onClick={()=>setEditId(null)}><X size={13}/></button>
                      </div>
                    </td>
                  </tr>
                )
                return (
                  <tr key={p.id} style={{ borderBottom:'1px solid #f9fafb', background:low?'rgba(254,242,242,.5)':'white' }}
                    onMouseEnter={e=>{ if(!low) e.currentTarget.style.background='#f9fafb' }}
                    onMouseLeave={e=>{ if(!low) e.currentTarget.style.background='white' }}>
                    <td style={{ padding:'10px 14px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        {low&&<AlertTriangle size={13} color="#ef4444"/>}
                        <span style={{ fontWeight:500, color:low?'#dc2626':'#111827' }}>{p.nome}</span>
                      </div>
                      {low&&<p style={{ fontSize:11, color:'#ef4444', margin:0 }}>Scorta bassa! Soglia: {p.avviso_scorta_minima}</p>}
                    </td>
                    <td style={{ padding:'10px 14px', textAlign:'center', fontWeight:700 }}>€ {parseFloat(p.prezzo_vendita).toFixed(2)}</td>
                    <td style={{ padding:'10px 14px', textAlign:'center', fontSize:17, fontWeight:700, color:low?'#dc2626':'#111827' }}>{p.quantita_disponibile}</td>
                    <td style={{ padding:'10px 14px', textAlign:'center', fontWeight:700, color:'#16a34a', fontSize:15 }}>€ {parseFloat(p.ricavo_totale||0).toFixed(2)}</td>
                    <td style={{ padding:'10px 14px', textAlign:'center' }}>
                      <div style={{ display:'flex', gap:6, justifyContent:'center' }}>
                        {/* ATTENZIONE: Qui ora passiamo l'intero oggetto 'p' alla funzione sell e restock invece del solo ID */}
                        <button disabled={busy===`sell-${p.id}`||p.quantita_disponibile<=0}
                          onClick={()=>sell(p)}
                          style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 12px', background:p.quantita_disponibile<=0?'#e5e7eb':'#dc2626', color:'white', border:'none', borderRadius:8, fontWeight:700, fontSize:12, cursor:p.quantita_disponibile<=0?'not-allowed':'pointer', opacity:p.quantita_disponibile<=0?.5:1 }}>
                          <Minus size={13}/>Vendi
                        </button>
                        <button disabled={busy===`restock-${p.id}`}
                          onClick={()=>restock(p)}
                          style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 10px', background:'#16a34a', color:'white', border:'none', borderRadius:8, fontWeight:700, fontSize:12, cursor:'pointer' }}>
                          <Plus size={13}/>
                        </button>
                      </div>
                    </td>
                    <td style={{ padding:'10px 8px' }}>
                      <div style={{ display:'flex', gap:4 }}>
                        <button className="btn-ghost" style={{ padding:'5px' }} onClick={()=>{ setEditId(p.id); setEditForm({nome:p.nome,quantita_disponibile:p.quantita_disponibile,prezzo_vendita:p.prezzo_vendita,avviso_scorta_minima:p.avviso_scorta_minima}) }}><Pencil size={12}/></button>
                        <button onClick={()=>del(p.id,p.nome)} style={{ padding:'5px', background:'none', border:'none', cursor:'pointer', color:'#f87171', borderRadius:6 }} onMouseEnter={e=>e.currentTarget.style.background='#fef2f2'} onMouseLeave={e=>e.currentTarget.style.background='none'}><Trash2 size={12}/></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}