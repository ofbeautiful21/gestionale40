import React, { useState, useEffect, useCallback, useRef } from 'react'
// 1. ELIMINATO axios, IMPORTATO supabase
import { supabase } from '../supabaseClient'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { AlertTriangle, CalendarDays, RefreshCw, ChevronLeft, ChevronRight, User, Scissors, X, CheckCircle } from 'lucide-react'

function slots() {
  const s = []
  for (let h = 9; h <= 20; h++) {
    s.push(`${String(h).padStart(2,'0')}:00`)
    s.push(`${String(h).padStart(2,'0')}:30`)
  }
  return s
}
const SLOTS = slots()

// ── Popup sola lettura con bottone "Completa" ─────────────────────────────────
function ReadPopup({ ora, giorno, staffId, cell, onClose }) {
  const [completing, setCompleting] = useState(false)
  const [completed,  setCompleted]  = useState(false)
  const [compInfo,   setCompInfo]   = useState(null)
  const ref = useRef(null)

  useEffect(() => {
    const fn = e => {
      if (!document.contains(e.target)) return
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, []) // eslint-disable-line

  // 2. NUOVO METODO PER REGISTRARE UN SERVIZIO COMPLETATO (POST)
  const handleComplete = async () => {
    if (!staffId) { alert('Nessuna operatrice associata'); return }
    setCompleting(true)
    
    try {
      // Evitiamo che venga completato due volte controllando se esiste già l'appuntamento
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

      // Inseriamo il nuovo appuntamento
      const { error } = await supabase.from('appointments').insert([{
        client_id:  cell.client_id  || null,
        service_id: cell.service_id || null,
        staff_id:   staffId,
        data_ora_inizio: `${giorno} ${ora}`,
        note:       cell.testo || '',
        stato:      'completato'
      }])

      if (error) throw error

      setCompleted(true)
      // Passiamo i dati per la schermata di successo
      setCompInfo({
        cliente_nome: cell.cliente_nome || '—',
        servizio_nome: cell.servizio_nome || '—',
        prezzo: cell.servizio_prezzo || 0
      })
    } catch(e) {
      alert('Errore: ' + e.message)
    } finally { 
      setCompleting(false) 
    }
  }

  const hasContent = !!(cell?.testo || cell?.cliente_nome?.trim() || cell?.servizio_nome?.trim())

  // Schermata di conferma
  if (completed && compInfo) {
    return (
      <div ref={ref} style={{ position:'absolute', top:'100%', left:0, zIndex:1000, background:'white', border:'2px solid #16a34a', borderRadius:12, boxShadow:'0 8px 32px rgba(0,0,0,.18)', minWidth:260, padding:0 }}>
        <div style={{ background:'#f0fdf4', borderRadius:'10px 10px 0 0', padding:'12px 16px', display:'flex', alignItems:'center', gap:8 }}>
          <CheckCircle size={20} color="#16a34a"/>
          <p style={{ margin:0, fontWeight:700, color:'#166534', fontSize:13 }}>Servizio completato!</p>
        </div>
        <div style={{ padding:'12px 16px', display:'flex', flexDirection:'column', gap:6 }}>
          {compInfo.cliente_nome !== '—' && <p style={{ margin:0, fontSize:12 }}><b>Cliente:</b> {compInfo.cliente_nome}</p>}
          {compInfo.servizio_nome !== '—' && <p style={{ margin:0, fontSize:12 }}><b>Servizio:</b> {compInfo.servizio_nome}</p>}
          {compInfo.prezzo > 0 && <p style={{ margin:0, fontSize:12 }}><b>Importo:</b> <span style={{ color:'#16a34a', fontWeight:700 }}>€ {parseFloat(compInfo.prezzo).toFixed(2)}</span></p>}
          <p style={{ margin:0, fontSize:11, color:'#6b7280' }}>Analitiche e storico cliente aggiornati ✓</p>
          <button onMouseDown={e=>{e.preventDefault();onClose()}} style={{ marginTop:6, padding:'7px', background:'#16a34a', color:'white', border:'none', borderRadius:8, fontWeight:700, fontSize:13, cursor:'pointer' }}>Chiudi</button>
        </div>
      </div>
    )
  }

  return (
    <div ref={ref} style={{ position:'absolute', top:'100%', left:0, zIndex:1000, background:'white', border:'2px solid #D4AF37', borderRadius:12, boxShadow:'0 8px 32px rgba(0,0,0,.18)', minWidth:260, padding:0 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 12px', borderBottom:'1px solid #e5e7eb', background:'#1a1a2e', borderRadius:'10px 10px 0 0' }}>
        <span style={{ fontSize:11, fontWeight:700, color:'#D4AF37' }}>{ora}</span>
        <button onMouseDown={e=>{e.preventDefault();onClose()}} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:2, lineHeight:0 }}><X size={14}/></button>
      </div>

      <div style={{ padding:12, display:'flex', flexDirection:'column', gap:8 }}>
        {cell?.testo && (
          <div style={{ fontSize:13, color:'#111827', fontWeight:500, padding:'6px 8px', background:'#f9fafb', borderRadius:6 }}>
            {cell.testo}
          </div>
        )}
        {cell?.cliente_nome?.trim() && (
          <div style={{ display:'flex', alignItems:'center', gap:7, padding:'6px 10px', background:'#eff6ff', border:'1px solid #93c5fd', borderRadius:8 }}>
            <User size={13} color="#3b82f6"/>
            <div>
              <p style={{ margin:0, fontSize:12, fontWeight:600, color:'#1e40af' }}>{cell.cliente_nome.trim()}</p>
              <p style={{ margin:0, fontSize:10, color:'#6b7280' }}>Cliente</p>
            </div>
          </div>
        )}
        {cell?.servizio_nome?.trim() && (
          <div style={{ display:'flex', alignItems:'center', gap:7, padding:'6px 10px', background:'#f0fdf4', border:'1px solid #86efac', borderRadius:8 }}>
            <Scissors size={13} color="#16a34a"/>
            <div style={{ flex:1 }}>
              <p style={{ margin:0, fontSize:12, fontWeight:600, color:'#166534' }}>{cell.servizio_nome.trim()}</p>
              <p style={{ margin:0, fontSize:10, color:'#6b7280' }}>Servizio</p>
            </div>
            {cell.servizio_prezzo > 0 && (
              <span style={{ fontSize:13, fontWeight:700, color:'#16a34a', flexShrink:0 }}>
                € {parseFloat(cell.servizio_prezzo).toFixed(2)}
              </span>
            )}
          </div>
        )}

        {!hasContent && <p style={{ margin:0, fontSize:12, color:'#9ca3af', textAlign:'center', padding:'8px 0' }}>Cella vuota</p>}

        <div style={{ borderTop:'1px solid #e5e7eb', paddingTop:8, display:'flex', flexDirection:'column', gap:6 }}>
          <button
            onMouseDown={e=>{ e.preventDefault(); handleComplete() }}
            disabled={completing}
            style={{ width:'100%', padding:'9px', border:'none', borderRadius:8, cursor:'pointer', background:completing?'#d1fae5':'#16a34a', color:'white', fontWeight:700, fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', gap:6, opacity:completing?0.7:1 }}
            onMouseEnter={e=>{ if(!completing) e.currentTarget.style.background='#15803d' }}
            onMouseLeave={e=>{ if(!completing) e.currentTarget.style.background='#16a34a' }}
          >
            <CheckCircle size={15}/>
            {completing ? 'Registrazione...' : '✅ Servizio completato'}
          </button>
          <p style={{ margin:0, fontSize:10, color:'#9ca3af', textAlign:'center' }}>
            👁 Sola lettura — modifica da "Agenda Excel"
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Cella dashboard ───────────────────────────────────────────────────────────
function DashCell({ cell, ora, giorno, staffId }) {
  const [open, setOpen]   = useState(false)
  const isYellow  = cell?.colore === 'yellow'
  const hasContent= !!(cell?.testo || cell?.cliente_nome?.trim() || cell?.servizio_nome?.trim())

  return (
    <td style={{ minWidth:160, height:36, padding:0, position:'relative', background:isYellow?'#fef08a':'white', borderBottom:'1px solid #d1d5db', borderRight:'1px solid #d1d5db', cursor:hasContent?'pointer':'default' }}
      onClick={() => { if (hasContent) setOpen(true) }}
      title={hasContent?'Clicca per dettagli':''}
    >
      <div style={{ display:'flex', alignItems:'center', height:'100%', padding:'0 7px', overflow:'hidden' }}
        onMouseEnter={e=>{ if(hasContent) e.currentTarget.parentElement.style.background=isYellow?'#fde047':'#f0f9ff' }}
        onMouseLeave={e=>{ e.currentTarget.parentElement.style.background=isYellow?'#fef08a':'white' }}
      >
        {cell?.client_id  && <User     size={10} color="#3b82f6" style={{ flexShrink:0, marginRight:3 }}/>}
        {cell?.service_id && <Scissors size={10} color="#16a34a" style={{ flexShrink:0, marginRight:3 }}/>}
        <span style={{ fontSize:11, color:'#1f2937', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', flex:1, fontWeight:hasContent?500:400 }}>
          {cell?.testo || ''}
        </span>
        {cell?.servizio_prezzo > 0 && (
          <span style={{ fontSize:10, color:'#16a34a', fontWeight:700, flexShrink:0, marginLeft:3 }}>
            €{parseFloat(cell.servizio_prezzo).toFixed(0)}
          </span>
        )}
      </div>
      {open && cell && (
        <ReadPopup ora={ora} giorno={giorno} staffId={staffId} cell={cell} onClose={()=>setOpen(false)}/>
      )}
    </td>
  )
}

// ── Dashboard principale ──────────────────────────────────────────────────────
export default function Dashboard() {
  const [date,    setDate]    = useState(format(new Date(),'yyyy-MM-dd'))
  const [staff,   setStaff]   = useState([])
  const [grid,    setGrid]    = useState({})
  const [alerts,  setAlerts]  = useState([])
  const [loading, setLoading] = useState(false)

  // 3. NUOVO METODO PER LEGGERE OPERATRICI E PRODOTTI (IN SCORTA)
  useEffect(() => {
    const fetchSetup = async () => {
      const { data: st } = await supabase.from('staff').select('*').order('nome')
      if (st) setStaff(st)
      
      const { data: pr } = await supabase.from('products').select('*')
      if (pr) setAlerts(pr.filter(p => p.quantita_disponibile <= p.avviso_scorta_minima))
    }
    fetchSetup()
  }, [])

  // 4. NUOVA SUPER-QUERY PER L'AGENDA CON JOIN SU CLIENTI E SERVIZI
  const load = useCallback(async d => {
    setLoading(true)
    try { 
      const { data, error } = await supabase
        .from('agenda_grid')
        .select(`
          *,
          clients ( nome, cognome ),
          services ( nome, prezzo )
        `)
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
  },[])

  useEffect(()=>{ load(date) },[date,load])

  const moveDay=n=>{const [y,m,d]=date.split('-').map(Number);setDate(format(new Date(y,m-1,d+n),'yyyy-MM-dd'))}
  const label=(()=>{try{const [y,m,d]=date.split('-').map(Number);return format(new Date(y,m-1,d),"EEEE d MMMM yyyy",{locale:it})}catch{return date}})()

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12, height:'100%' }}>
      {alerts.map(p=>(
        <div key={p.id} className="alert-scorta"><AlertTriangle size={14}/><span><b>{p.nome}</b>: solo {p.quantita_disponibile} pz rimaste</span></div>
      ))}

      <div className="card" style={{ display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:12, padding:'10px 16px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <CalendarDays size={20} color="#D4AF37"/>
          <div>
            <p style={{ fontWeight:600, textTransform:'capitalize', margin:0, fontSize:14 }}>{label}</p>
            <p style={{ fontSize:11, color:'#6b7280', margin:0 }}>Sola lettura · clicca cella per dettagli e "Servizio completato"</p>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <button className="btn-ghost" style={{ padding:'6px 8px' }} onClick={()=>moveDay(-1)}><ChevronLeft size={14}/></button>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="input-base" style={{ width:'auto' }}/>
          <button className="btn-ghost" style={{ padding:'6px 8px' }} onClick={()=>moveDay(1)}><ChevronRight size={14}/></button>
          <button className="btn-ghost" style={{ padding:'6px 8px' }} onClick={()=>load(date)}><RefreshCw size={14} className={loading?'animate-spin':''}/></button>
        </div>
      </div>

      <div className="card" style={{ flex:1, overflow:'hidden', padding:0, border:'1px solid #9ca3af' }}>
        {staff.length===0 ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#9ca3af', flexDirection:'column', gap:8 }}>
            <CalendarDays size={40} strokeWidth={1}/>
            <p style={{ fontSize:13 }}>Nessuna operatrice. Aggiungile da "Operatrici".</p>
          </div>
        ) : (
          <div style={{ overflow:'auto', height:'100%' }}>
            <table style={{ borderCollapse:'collapse', tableLayout:'fixed', minWidth:'100%', fontSize:12 }}>
              <thead style={{ position:'sticky', top:0, zIndex:10 }}>
                <tr>
                  <th style={{ width:64, padding:'9px 8px', background:'#1a1a2e', borderBottom:'2px solid #D4AF37', borderRight:'2px solid #D4AF37', textAlign:'center', fontSize:11, color:'#D4AF37', fontWeight:700, position:'sticky', left:0, zIndex:20 }}>ORA</th>
                  {staff.map(s=>(
                    <th key={s.id} style={{ minWidth:160, padding:'9px 12px', background:'#1a1a2e', borderBottom:'2px solid #D4AF37', borderRight:'1px solid #4b5563', textAlign:'center', fontWeight:700, color:'white', fontSize:12 }}>{s.nome.trim()}</th>
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
                        <DashCell key={`${s.id}_${ora}`} ora={ora} giorno={date} staffId={s.id} cell={grid[`${s.id}_${ora}`]}/>
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