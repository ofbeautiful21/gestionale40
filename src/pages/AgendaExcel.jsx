import React, { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { CalendarDays, RefreshCw, ChevronLeft, ChevronRight, Search, X, User, Scissors, Trash2, CheckCircle } from 'lucide-react'

function slots() {
  const s = []
  for (let h = 9; h <= 20; h++) {
    s.push(`${String(h).padStart(2,'0')}:00`)
    s.push(`${String(h).padStart(2,'0')}:30`)
  }
  return s
}
const SLOTS = slots()

function DropItem({ onPick, children }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onMouseDown={e => { e.preventDefault(); onPick() }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ width:'100%', textAlign:'left', padding:'7px 12px', fontSize:12, background:hover?'#fefce8':'white', border:'none', borderBottom:'1px solid #f0f0f0', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center' }}
    >{children}</button>
  )
}

function BtnX({ onClick, size=12, color='#9ca3af' }) {
  return (
    <button onMouseDown={e=>{e.preventDefault();e.stopPropagation();onClick()}}
      style={{background:'none',border:'none',cursor:'pointer',color,padding:2,lineHeight:0,flexShrink:0}}>
      <X size={size}/>
    </button>
  )
}

// ── Popup modifica cella ──────────────────────────────────────────────────────
function Popup({ ora, giorno, staffId, cellData, clients, services, onSave, onDelete, onClose }) {
  const [testo,    setTesto]    = useState(cellData?.testo || '')
  const [cSearch,  setCSearch]  = useState('')
  const [sSearch,  setSSearch]  = useState('')
  const [selC,     setSelC]     = useState(
    cellData?.client_id  ? { id:cellData.client_id,  label:(cellData.cliente_nome||'').trim() } : null
  )
  const [selS, setSelS] = useState(
    cellData?.service_id ? { id:cellData.service_id, label:(cellData.servizio_nome||'').trim(), prezzo:cellData.servizio_prezzo||0 } : null
  )
  const [showC,    setShowC]    = useState(false)
  const [showS,    setShowS]    = useState(false)
  const [completing, setCompleting] = useState(false)
  const [completed,  setCompleted]  = useState(false)
  const [compInfo,   setCompInfo]   = useState(null)
  const ref    = useRef(null)
  const txtRef = useRef(null)

  useEffect(() => {
    txtRef.current?.focus()
    const fn = e => {
      if (!document.contains(e.target)) return
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const filtC = clients.filter(c => !cSearch.trim() || `${c.nome} ${c.cognome}`.toLowerCase().includes(cSearch.toLowerCase()) || (c.telefono||'').includes(cSearch)).slice(0,8)
  const filtS = services.filter(s => !sSearch.trim() || s.nome.toLowerCase().includes(sSearch.toLowerCase())).slice(0,8)

  const pickClient = c => {
    const label = `${c.nome} ${c.cognome}`.trim()
    setSelC({ id:c.id, label })
    setCSearch(''); setShowC(false)
    setTesto(prev => prev.trim()==='' ? label+(selS?` — ${selS.label}`:'') : prev)
  }
  const pickService = s => {
    setSelS({ id:s.id, label:s.nome.trim(), prezzo:s.prezzo })
    setSSearch(''); setShowS(false)
    setTesto(prev => prev.trim()==='' ? (selC?`${selC.label} — `:'')+s.nome.trim() : prev)
  }

  const save = () => {
    onSave({ testo, colore:cellData?.colore||'white', client_id:selC?.id||null, service_id:selS?.id||null })
    onClose()
  }

  const handleComplete = async () => {
    if (!staffId) { alert('Nessuna operatrice associata a questa cella'); return }
    setCompleting(true)
    try {
      const { data: existing } = await supabase
        .from('appointments')
        .select('id')
        .eq('staff_id', staffId)
        .eq('data_ora_inizio', `${giorno} ${ora}`)
        .maybeSingle()

      if (existing) {
        alert('⚠️ Questo servizio è già stato registrato come completato.')
        setCompleting(false)
        return
      }

      const { error } = await supabase.from('appointments').insert([{
        client_id:  selC?.id  || null,
        service_id: selS?.id  || null,
        staff_id:   staffId,
        data_ora_inizio: `${giorno} ${ora}`,
        note:       testo || '',
        stato:      'completato'
      }])

      if (error) throw error

      setCompleted(true)
      setCompInfo({
        cliente_nome: selC?.label || '—',
        servizio_nome: selS?.label || '—',
        prezzo: selS?.prezzo || 0
      })
    } catch(e) {
      alert('Errore: ' + e.message)
    } finally { setCompleting(false) }
  }

  const hasData = !!(cellData?.testo || cellData?.client_id || cellData?.service_id)
  const dropBox = { position:'absolute', top:'100%', left:0, right:0, background:'white', border:'1px solid #d1d5db', borderRadius:8, boxShadow:'0 6px 20px rgba(0,0,0,.14)', zIndex:9999, maxHeight:160, overflowY:'auto', marginTop:2 }

  if (completed && compInfo) {
    return (
      <div ref={ref} style={{ position:'absolute', top:'100%', left:0, zIndex:1000, background:'white', border:'2px solid #16a34a', borderRadius:12, boxShadow:'0 8px 32px rgba(0,0,0,.18)', minWidth:280, padding:0 }}>
        <div style={{ background:'#f0fdf4', borderRadius:'10px 10px 0 0', padding:'12px 16px', display:'flex', alignItems:'center', gap:8 }}>
          <CheckCircle size={20} color="#16a34a"/>
          <p style={{ margin:0, fontWeight:700, color:'#166534', fontSize:13 }}>Servizio completato!</p>
        </div>
        <div style={{ padding:'12px 16px', display:'flex', flexDirection:'column', gap:6 }}>
          {compInfo.cliente_nome !== '—' && <p style={{ margin:0, fontSize:12 }}><b>Cliente:</b> {compInfo.cliente_nome}</p>}
          {compInfo.servizio_nome !== '—' && <p style={{ margin:0, fontSize:12 }}><b>Servizio:</b> {compInfo.servizio_nome}</p>}
          {compInfo.prezzo > 0 && <p style={{ margin:0, fontSize:12 }}><b>Importo:</b> <span style={{ color:'#16a34a', fontWeight:700 }}>€ {parseFloat(compInfo.prezzo).toFixed(2)}</span></p>}
          <p style={{ margin:0, fontSize:11, color:'#6b7280' }}>Analitiche e storico cliente aggiornati ✓</p>
          <button onMouseDown={e=>{e.preventDefault();onClose()}} style={{ marginTop:6, padding:'7px', background:'#16a34a', color:'white', border:'none', borderRadius:8, fontWeight:700, fontSize:13, cursor:'pointer' }}>
            Chiudi
          </button>
        </div>
      </div>
    )
  }

  return (
    <div ref={ref} style={{ position:'absolute', top:'100%', left:0, zIndex:1000, background:'white', border:'2px solid #D4AF37', borderRadius:12, boxShadow:'0 8px 32px rgba(0,0,0,.2)', minWidth:320, padding:0 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 12px', borderBottom:'1px solid #e5e7eb', background:'#fafafa', borderRadius:'10px 10px 0 0' }}>
        <span style={{ fontSize:11, fontWeight:700, color:'#374151' }}>{ora}</span>
        <BtnX onClick={onClose} size={14} color="#6b7280"/>
      </div>

      <div style={{ padding:12, display:'flex', flexDirection:'column', gap:10 }}>

        <div>
          <label style={{ fontSize:11, fontWeight:600, color:'#6b7280', display:'block', marginBottom:4 }}>Testo libero</label>
          <input ref={txtRef} value={testo} onChange={e=>setTesto(e.target.value)}
            onKeyDown={e=>{ if(e.key==='Enter') save(); if(e.key==='Escape') onClose() }}
            placeholder="Scrivi testo libero..." className="input-base" style={{ fontSize:12 }}/>
        </div>

        <div>
          <label style={{ fontSize:11, fontWeight:600, color:'#6b7280', display:'flex', alignItems:'center', gap:4, marginBottom:4 }}><User size={11}/> Cliente</label>
          {selC ? (
            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 10px', background:'#eff6ff', border:'1px solid #93c5fd', borderRadius:8 }}>
              <User size={11} color="#3b82f6"/>
              <span style={{ flex:1, fontSize:12, fontWeight:500 }}>{selC.label}</span>
              <BtnX onClick={()=>setSelC(null)}/>
            </div>
          ) : (
            <div style={{ position:'relative' }}>
              <Search size={12} style={{ position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', color:'#9ca3af' }}/>
              <input value={cSearch} onChange={e=>{setCSearch(e.target.value);setShowC(true)}} onFocus={()=>setShowC(true)} onBlur={()=>setTimeout(()=>setShowC(false),150)}
                placeholder="Cerca cliente..." className="input-base" style={{ paddingLeft:28, fontSize:12 }}/>
              {showC && (
                <div style={dropBox}>
                  {filtC.length===0 ? <p style={{ padding:'8px 12px', fontSize:12, color:'#9ca3af', margin:0 }}>Nessun risultato</p>
                  : filtC.map(c=><DropItem key={c.id} onPick={()=>pickClient(c)}><span><b>{c.cognome}</b> {c.nome}</span>{c.telefono&&<span style={{color:'#9ca3af',fontSize:11}}>{c.telefono}</span>}</DropItem>)}
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <label style={{ fontSize:11, fontWeight:600, color:'#6b7280', display:'flex', alignItems:'center', gap:4, marginBottom:4 }}><Scissors size={11}/> Servizio</label>
          {selS ? (
            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 10px', background:'#f0fdf4', border:'1px solid #86efac', borderRadius:8 }}>
              <Scissors size={11} color="#22c55e"/>
              <span style={{ flex:1, fontSize:12, fontWeight:500 }}>{selS.label}</span>
              <span style={{ fontSize:11, fontWeight:700, color:'#16a34a' }}>€{parseFloat(selS.prezzo).toFixed(0)}</span>
              <BtnX onClick={()=>setSelS(null)}/>
            </div>
          ) : (
            <div style={{ position:'relative' }}>
              <Search size={12} style={{ position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', color:'#9ca3af' }}/>
              <input value={sSearch} onChange={e=>{setSSearch(e.target.value);setShowS(true)}} onFocus={()=>setShowS(true)} onBlur={()=>setTimeout(()=>setShowS(false),150)}
                placeholder="Cerca servizio..." className="input-base" style={{ paddingLeft:28, fontSize:12 }}/>
              {showS && (
                <div style={dropBox}>
                  {filtS.length===0 ? <p style={{ padding:'8px 12px', fontSize:12, color:'#9ca3af', margin:0 }}>Nessun risultato</p>
                  : filtS.map(s=><DropItem key={s.id} onPick={()=>pickService(s)}><span>{s.nome}</span><span style={{color:'#16a34a',fontWeight:700,marginLeft:8,flexShrink:0}}>€{parseFloat(s.prezzo).toFixed(0)}</span></DropItem>)}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ display:'flex', gap:8, paddingTop:4, borderTop:'1px solid #e5e7eb' }}>
          <button onMouseDown={e=>{e.preventDefault();save()}}
            style={{ flex:1, padding:'8px', background:'#D4AF37', color:'white', border:'none', borderRadius:8, fontWeight:700, fontSize:12, cursor:'pointer' }}>
            💾 Salva
          </button>
          {hasData && (
            <button onMouseDown={e=>{e.preventDefault();onDelete();onClose()}}
              style={{ padding:'8px 10px', background:'none', border:'1px solid #fca5a5', color:'#ef4444', borderRadius:8, cursor:'pointer' }}>
              <Trash2 size={13}/>
            </button>
          )}
        </div>

        <button
          onMouseDown={e=>{ e.preventDefault(); handleComplete() }}
          disabled={completing}
          style={{
            width:'100%', padding:'9px', border:'none', borderRadius:8, cursor:'pointer',
            background: completing ? '#d1fae5' : '#16a34a',
            color:'white', fontWeight:700, fontSize:13,
            display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            opacity: completing ? 0.7 : 1,
            transition:'background .15s',
          }}
          onMouseEnter={e=>{ if(!completing) e.currentTarget.style.background='#15803d' }}
          onMouseLeave={e=>{ if(!completing) e.currentTarget.style.background='#16a34a' }}
        >
          <CheckCircle size={15}/>
          {completing ? 'Registrazione...' : '✅ Servizio completato'}
        </button>
        <p style={{ margin:0, fontSize:10, color:'#9ca3af', textAlign:'center', marginTop:-6 }}>
          Aggiorna analitiche e storico cliente
        </p>
      </div>
    </div>
  )
}

// ── Cella singola ─────────────────────────────────────────────────────────────
const Cell = React.memo(({ staffId, ora, giorno, cellData, clients, services, onSave, onDelete, onToggle }) => {
  const [open, setOpen] = useState(false)
  const isYellow = cellData?.colore === 'yellow'
  const isEmpty  = !(cellData?.testo || cellData?.client_id || cellData?.service_id)

  return (
    <td
      style={{ minWidth:170, height:36, padding:0, position:'relative', background:isYellow?'#fef08a':'white', borderBottom:'1px solid #d1d5db', borderRight:'1px solid #d1d5db', cursor:'pointer' }}
      onClick={() => setOpen(true)}
      onContextMenu={e => { e.preventDefault(); onToggle(staffId, ora) }}
      title="Clic: modifica · Clic destro: turno giallo"
    >
      <div style={{ display:'flex', alignItems:'center', height:'100%', padding:'0 7px', overflow:'hidden' }}>
        {cellData?.client_id  && <User     size={10} color="#3b82f6" style={{ flexShrink:0, marginRight:3 }}/>}
        {cellData?.service_id && <Scissors size={10} color="#16a34a" style={{ flexShrink:0, marginRight:3 }}/>}
        <span style={{ fontSize:11, color:'#1f2937', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', flex:1, fontWeight:isEmpty?400:500 }}>
          {cellData?.testo || ''}
        </span>
        {cellData?.servizio_prezzo > 0 && (
          <span style={{ fontSize:10, color:'#16a34a', fontWeight:700, flexShrink:0, marginLeft:3 }}>
            €{parseFloat(cellData.servizio_prezzo).toFixed(0)}
          </span>
        )}
      </div>
      {open && (
        <Popup
          ora={ora} giorno={giorno} staffId={staffId}
          cellData={cellData} clients={clients} services={services}
          onSave={d => { onSave(staffId, ora, d); setOpen(false) }}
          onDelete={() => onDelete(staffId, ora)}
          onClose={() => setOpen(false)}
        />
      )}
    </td>
  )
})
Cell.displayName = 'Cell'

// ── Pagina principale ─────────────────────────────────────────────────────────
export default function AgendaExcel() {
  const [date,    setDate]    = useState(format(new Date(),'yyyy-MM-dd'))
  const [staff,   setStaff]   = useState([])
  const [clients, setClients] = useState([])
  const [svcs,    setSvcs]    = useState([])
  const [grid,    setGrid]    = useState({})
  const [loading, setLoading] = useState(false)
  const [saving,  setSaving]  = useState(false)
  
  // STATO PER IL DRAG & DROP
  const [draggedStaff, setDraggedStaff] = useState(null)

  useEffect(() => {
    const fetchSetup = async () => {
      const [{ data: st }, { data: cl }, { data: sv }] = await Promise.all([
        // Carica lo staff in base alla nuova colonna "ordine" (ascendente)
        supabase.from('staff').select('*').order('ordine', { ascending: true }),
        supabase.from('clients').select('*').order('nome'),
        supabase.from('services').select('*').order('nome')
      ])
      if (st) setStaff(st)
      if (cl) setClients(cl)
      if (sv) setSvcs(sv)
    }
    fetchSetup()
  }, [])

  const loadGrid = useCallback(async d => {
    setLoading(true)
    try { 
      const { data, error } = await supabase
        .from('agenda_grid')
        .select(`*, clients ( nome, cognome ), services ( nome, prezzo )`)
        .eq('giorno', d)
      
      if (error) throw error

      const m = {}
      if (data) {
        data.forEach(r => {
          m[`${r.staff_id}_${r.ora}`] = {
            ...r,
            cliente_nome: r.clients ? `${r.clients.nome} ${r.clients.cognome || ''}`.trim() : null,
            servizio_nome: r.services ? r.services.nome : null,
            servizio_prezzo: r.services ? r.services.prezzo : 0
          }
        })
      }
      setGrid(m)
    }
    catch(e){console.error(e)} finally{setLoading(false)}
  }, [])

  useEffect(()=>{ loadGrid(date) },[date,loadGrid])

  const handleSave = useCallback(async (staffId, ora, payload) => {
    setSaving(true)
    try {
      const key = `${staffId}_${ora}`
      const existingId = grid[key]?.id
      
      const payloadData = {
        giorno: date,
        ora: ora,
        staff_id: staffId,
        testo: payload.testo || '',
        colore: payload.colore || (grid[key]?.colore || 'white'),
        client_id: payload.client_id || null,
        service_id: payload.service_id || null
      }

      if (existingId) {
        const { error } = await supabase.from('agenda_grid').update(payloadData).eq('id', existingId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('agenda_grid').insert([payloadData])
        if (error) throw error
      }
      
      await loadGrid(date)
    } catch(e){console.error(e);alert('Errore: '+e.message)} finally{setSaving(false)}
  },[date, grid, loadGrid])

  const handleDelete = useCallback(async (staffId, ora) => {
    const key = `${staffId}_${ora}`
    const idToDelete = grid[key]?.id
    if (!idToDelete) return
    
    setGrid(p=>{const n={...p};delete n[key];return n})
    try { await supabase.from('agenda_grid').delete().eq('id', idToDelete) } catch(e){console.error(e)}
  },[grid])

  const handleToggle = useCallback(async (staffId, ora) => {
    const key = `${staffId}_${ora}`
    const cur = grid[key] || {}
    const nc = cur.colore === 'yellow' ? 'white' : 'yellow'
    
    setGrid(p=>({...p,[key]:{...cur, colore: nc}}))
    
    try {
      if (cur.id) {
        await supabase.from('agenda_grid').update({ colore: nc }).eq('id', cur.id)
      } else {
        const { data, error } = await supabase.from('agenda_grid').insert([{
          giorno: date, ora, staff_id: staffId, testo: cur.testo||'', colore: nc, client_id: cur.client_id||null, service_id: cur.service_id||null
        }]).select()
        if (data && data[0]) {
           setGrid(p=>({...p,[key]:{...cur, colore: nc, id: data[0].id}}))
        }
      }
    } catch(e){ setGrid(p=>({...p,[key]:{...cur, colore: cur.colore||'white'}})) }
  },[grid, date])

  const moveDay=n=>{const [y,m,d]=date.split('-').map(Number);setDate(format(new Date(y,m-1,d+n),'yyyy-MM-dd'))}
  const label=(()=>{try{const [y,m,d]=date.split('-').map(Number);return format(new Date(y,m-1,d),"EEEE d MMMM yyyy",{locale:it})}catch{return date}})()

  // ── FUNZIONI PER IL DRAG & DROP SULLE OPERATRICI ──
  const handleDragStart = (e, id) => {
    setDraggedStaff(id)
  }

  const handleDragOver = (e) => {
    e.preventDefault() // Obbligatorio per consentire il drop
  }

  const handleDrop = async (e, targetId) => {
    e.preventDefault()
    if (!draggedStaff || draggedStaff === targetId) return

    const draggedIdx = staff.findIndex(s => s.id === draggedStaff)
    const targetIdx  = staff.findIndex(s => s.id === targetId)

    const newStaff = [...staff]
    const [item] = newStaff.splice(draggedIdx, 1)
    newStaff.splice(targetIdx, 0, item)

    // Aggiornamento visivo immediato
    setStaff(newStaff)

    // Salvataggio nel database tramite upsert
    const updates = newStaff.map((s, index) => ({
      id: s.id,
      nome: s.nome,
      ordine: index
    }))

    const { error } = await supabase.from('staff').upsert(updates)
    if (error) {
      console.error("Errore salvataggio ordine:", error)
      alert("Errore nel salvataggio dell'ordine")
    }
    
    setDraggedStaff(null)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10, height:'100%' }}>
      <div className="card" style={{ display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:10, padding:'10px 16px' }}>
        <div>
          <p style={{ fontWeight:600, textTransform:'capitalize', margin:0, fontSize:14 }}>{label}</p>
          <p style={{ fontSize:11, color:'#6b7280', margin:0 }}>Trascina il nome delle operatrici per cambiare l'ordine</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <button className="btn-ghost" style={{ padding:'6px 8px' }} onClick={()=>moveDay(-1)}><ChevronLeft size={14}/></button>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="input-base" style={{ width:'auto' }}/>
          <button className="btn-ghost" style={{ padding:'6px 8px' }} onClick={()=>moveDay(1)}><ChevronRight size={14}/></button>
          <button className="btn-ghost" style={{ padding:'6px 8px' }} onClick={()=>loadGrid(date)}><RefreshCw size={14} className={loading?'animate-spin':''}/></button>
          {saving&&<span style={{ fontSize:11, color:'#d97706', fontWeight:600 }}>💾 Salvo...</span>}
        </div>
      </div>

      <div style={{ display:'flex', gap:16, fontSize:11, color:'#6b7280', paddingLeft:4, flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}><div style={{ width:14,height:14,borderRadius:3,background:'white',border:'1px solid #9ca3af' }}/><span>Libera</span></div>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}><div style={{ width:14,height:14,borderRadius:3,background:'#fef08a',border:'1px solid #d97706' }}/><span>Turno</span></div>
        <div style={{ display:'flex', alignItems:'center', gap:4 }}><User size={11} color="#3b82f6"/><span>Cliente</span></div>
        <div style={{ display:'flex', alignItems:'center', gap:4 }}><Scissors size={11} color="#16a34a"/><span>Servizio</span></div>
        <div style={{ display:'flex', alignItems:'center', gap:4 }}><CheckCircle size={11} color="#16a34a"/><span>Clic → "Servizio completato" per aggiornare analitiche</span></div>
      </div>

      <div className="card" style={{ flex:1, overflow:'hidden', padding:0, border:'1px solid #9ca3af' }}>
        {staff.length===0 ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#9ca3af', flexDirection:'column', gap:8 }}>
            <CalendarDays size={40} strokeWidth={1}/>
            <p style={{ fontSize:13 }}>Nessuna operatrice. Aggiungile da "Operatrici".</p>
          </div>
        ) : (
          <div style={{ overflow:'auto', height:'100%', userSelect:'none' }}>
            <table style={{ borderCollapse:'collapse', tableLayout:'fixed', minWidth:'100%', fontSize:12 }}>
              <thead style={{ position:'sticky', top:0, zIndex:10 }}>
                <tr>
                  <th style={{ width:64, padding:'9px 8px', background:'#1a1a2e', borderBottom:'2px solid #D4AF37', borderRight:'2px solid #D4AF37', textAlign:'center', fontSize:11, color:'#D4AF37', fontWeight:700, position:'sticky', left:0, zIndex:20 }}>ORA</th>
                  {staff.map(s=>(
                    <th 
                      key={s.id} 
                      draggable 
                      onDragStart={(e) => handleDragStart(e, s.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, s.id)}
                      title="Trascina per riordinare"
                      style={{ 
                        minWidth:170, 
                        padding:'9px 12px', 
                        background:'#1a1a2e', 
                        borderBottom:'2px solid #D4AF37', 
                        borderRight:'1px solid #4b5563', 
                        textAlign:'center', 
                        fontWeight:700, 
                        color:'white', 
                        fontSize:12,
                        cursor: 'grab' // Mostra la manina del trascinamento
                      }}>
                      {s.nome.trim()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SLOTS.map(ora=>{
                  const isH=ora.endsWith(':00')
                  return (
                    <tr key={ora}>
                      <td style={{ width:64,height:36,padding:'0 8px',fontFamily:'monospace',fontSize:12,fontWeight:isH?800:400,color:isH?'#1e1b4b':'#6b7280',background:isH?'#dde3f5':'#f3f4f6',borderBottom:isH?'1px solid #6366f1':'1px solid #d1d5db',borderRight:'2px solid #D4AF37',position:'sticky',left:0,zIndex:1,textAlign:'right' }}>{ora}</td>
                      {staff.map(s=>(
                        <Cell key={`${s.id}_${ora}`} staffId={s.id} ora={ora} giorno={date}
                          cellData={grid[`${s.id}_${ora}`]} clients={clients} services={svcs}
                          onSave={handleSave} onDelete={handleDelete} onToggle={handleToggle}/>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
