import React, { useState, useEffect } from 'react'
import { LayoutDashboard, CalendarDays, Users, Scissors, UserCircle, Package, BarChart3, ChevronLeft, ChevronRight, LogOut } from 'lucide-react'
import { supabase } from './supabaseClient'
import Login from './pages//Login.jsx' // Importiamo la nuova schermata di Login!

import Dashboard   from './pages/Dashboard.jsx'
import AgendaExcel from './pages/AgendaExcel.jsx'
import Operatrici  from './pages/Operatrici.jsx'
import Servizi     from './pages/Servizi.jsx'
import Clienti     from './pages/Clienti.jsx'
import Magazzino   from './pages/Magazzino.jsx'
import Analitiche  from './pages/Analitiche.jsx'

const NAV = [
  { id:'dashboard',  label:'Dashboard',    icon:LayoutDashboard, C:Dashboard },
  { id:'agenda',     label:'Agenda Excel', icon:CalendarDays,    C:AgendaExcel },
  { id:'operatrici', label:'Operatrici',   icon:Users,           C:Operatrici },
  { id:'servizi',    label:'Servizi',      icon:Scissors,        C:Servizi },
  { id:'clienti',    label:'Clienti',      icon:UserCircle,      C:Clienti },
  { id:'magazzino',  label:'Magazzino',    icon:Package,         C:Magazzino },
  { id:'analitiche', label:'Analitiche',   icon:BarChart3,       C:Analitiche },
]

// ── App principale ────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null)
  const [isChecking, setIsChecking] = useState(true)

  const [page, setPage] = useState('dashboard')
  const [open, setOpen] = useState(true)

  // Controllo di sicurezza all'avvio: verifica se siamo già loggati
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setIsChecking(false)
    })

    // Ascolta i cambiamenti (es. quando facciamo login o logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Funzione per chiudere la sessione (Mettere il lucchetto)
  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  // 1. Se sta ancora verificando la password nel cloud, mostriamo un caricamento
  if (isChecking) {
    return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#f4f1ea', color:'#D4AF37', fontWeight:'bold' }}>Verifica sicurezza in corso...</div>
  }

  // 2. Se NON c'è una sessione attiva, mostriamo SOLO la pagina di Login
  if (!session) {
    return <Login onLoginSuccess={setSession} />
  }

  // 3. Se la password è corretta, mostriamo il gestionale completo!
  const { C: Page, label } = NAV.find(n => n.id === page)

  return (
    <div style={{ display:'flex', height:'100vh', width:'100vw', overflow:'hidden', background:'#f4f1ea' }}>

      {/* ── Sidebar ── */}
      <aside style={{ width:open?220:64, flexShrink:0, background:'#1a1a2e', borderRight:'2px solid #D4AF37', display:'flex', flexDirection:'column', transition:'width .25s' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'18px 16px', borderBottom:'1px solid #374151' }}>
          <div style={{ width:36, height:36, borderRadius:'50%', background:'#D4AF37', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Scissors size={18} color="#1a1a2e"/>
          </div>
          {open && <div>
            <p style={{ color:'white', fontWeight:700, fontSize:13, lineHeight:1.2, margin:0 }}>Gestionale</p>
            <p style={{ color:'#D4AF37', fontSize:11, fontWeight:500, margin:0 }}>4.0 • Salone</p>
          </div>}
        </div>

        <nav style={{ flex:1, paddingTop:12, overflowY:'auto' }}>
          {NAV.map(({ id, label, icon:Icon }) => {
            const active = page === id
            return (
              <button key={id} onClick={() => setPage(id)}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'11px 16px', background:active?'rgba(212,175,55,0.14)':'transparent', borderLeft:active?'3px solid #D4AF37':'3px solid transparent', color:active?'#D4AF37':'#9ca3af', cursor:'pointer', border:'none', textAlign:'left' }}
                onMouseEnter={e=>{if(!active)e.currentTarget.style.background='#2d2d4e'}}
                onMouseLeave={e=>{if(!active)e.currentTarget.style.background='transparent'}}
              >
                <Icon size={18} style={{ flexShrink:0 }}/>
                {open && <span style={{ fontSize:13, fontWeight:500, whiteSpace:'nowrap' }}>{label}</span>}
              </button>
            )
          })}
        </nav>

        <button onClick={()=>setOpen(p=>!p)}
          style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:12, borderTop:'1px solid #374151', background:'transparent', border:'none', cursor:'pointer', color:'#9ca3af' }}
          onMouseEnter={e=>e.currentTarget.style.color='#D4AF37'}
          onMouseLeave={e=>e.currentTarget.style.color='#9ca3af'}>
          {open ? <ChevronLeft size={18}/> : <ChevronRight size={18}/>}
        </button>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>
        <header style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 20px', background:'white', borderBottom:'1px solid #e5e7eb', flexShrink:0 }}>
          <h1 style={{ fontWeight:700, fontSize:15, color:'#111827', margin:0 }}>{label}</h1>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            
            {/* Tasto Logout */}
            <button
              onClick={handleLogout}
              title="Blocca il gestionale"
              style={{
                display:'flex', alignItems:'center', gap:5, padding:'6px 12px',
                background:'#fef2f2', color:'#dc2626', border:'1px solid #fca5a5',
                borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer',
                transition:'all .2s',
              }}
              onMouseEnter={e=>e.currentTarget.style.background='#fee2e2'}
              onMouseLeave={e=>e.currentTarget.style.background='#fef2f2'}
            >
              <LogOut size={13}/> Esci e Blocca
            </button>

            {/* Indicatore server Cloud */}
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:'#27AE60' }} title="Cloud attivo"/>
              <span style={{ fontSize:12, color:'#6b7280' }}>Cloud Vercel</span>
            </div>
          </div>
        </header>

        <div className="fade-in" key={page} style={{ flex:1, overflow:'auto', padding:16 }}>
          <Page/>
        </div>
      </main>
    </div>
  )
}
