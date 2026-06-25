import React, { useState, useEffect } from 'react'
// 1. ELIMINA axios E IMPORTA supabase
import { supabase } from '../supabaseClient'
import { BarChart3, TrendingUp, Users, Scissors, Package, RefreshCw, Trophy } from 'lucide-react'

export default function Analitiche() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  // 2. NUOVO METODO PER CALCOLARE LE STATISTICHE DIRETTAMENTE IN REACT
  const load = async () => {
    setLoading(true)
    try {
      // A. Preleviamo i ricavi del magazzino
      const { data: prods, error: errP } = await supabase.from('products').select('ricavo_totale')
      let magazzinoTotal = 0
      if (prods) {
        magazzinoTotal = prods.reduce((sum, p) => sum + (parseFloat(p.ricavo_totale) || 0), 0)
      }

      // B. Preleviamo TUTTI gli appuntamenti completati, incrociati con staff e servizi
      const { data: appts, error: errA } = await supabase
        .from('appointments')
        .select(`
          id,
          staff_id,
          staff ( id, nome ),
          services ( prezzo )
        `)
        .eq('stato', 'completato')

      let totAppuntamenti = 0
      let totIncassoServizi = 0
      const staffMap = {} // Oggetto per raggruppare i dati per ogni operatrice

      if (appts) {
        totAppuntamenti = appts.length // Il numero di servizi completati
        
        appts.forEach(a => {
          // Ricaviamo il prezzo del servizio (se esiste, altrimenti 0)
          const prezzo = a.services ? parseFloat(a.services.prezzo) || 0 : 0
          totIncassoServizi += prezzo // Sommiamo all'incasso totale del salone

          // Se l'appuntamento ha un'operatrice assegnata, aggiungiamo i dati al suo "pallottoliere" personale
          if (a.staff) {
            const sid = a.staff.id
            if (!staffMap[sid]) {
              staffMap[sid] = { id: sid, nome: a.staff.nome, num_servizi: 0, incasso_totale: 0 }
            }
            staffMap[sid].num_servizi += 1
            staffMap[sid].incasso_totale += prezzo
          }
        })
      }

      // Trasformiamo l'oggetto staffMap in un array e lo ordiniamo dal più alto al più basso (classifica)
      const staffStats = Object.values(staffMap).sort((a, b) => b.incasso_totale - a.incasso_totale)

      // Salviamo i dati formattati esattamente come li si aspettava la tua vecchia grafica!
      setData({
        staff_stats: staffStats,
        totale_ricavi_magazzino: magazzinoTotal,
        totale_appuntamenti: totAppuntamenti,
        totale_incasso_servizi: totIncassoServizi
      })

    } catch(e) { 
      console.error(e) 
    } finally { 
      setLoading(false) 
    }
  }

  useEffect(()=>{ load() },[])

  if (loading||!data) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200, color:'#9ca3af', gap:8 }}>
      <RefreshCw size={20} style={{ animation:'spin 1s linear infinite' }}/><span>Calcolo statistiche...</span>
    </div>
  )

  const { staff_stats, totale_ricavi_magazzino, totale_appuntamenti, totale_incasso_servizi } = data
  const totale = (parseFloat(totale_incasso_servizi)||0)+(parseFloat(totale_ricavi_magazzino)||0)
  const maxI   = Math.max(...staff_stats.map(s=>parseFloat(s.incasso_totale)||0),1)
  const pal    = ['#D4AF37','#27AE60','#C0392B','#2980B9','#8E44AD','#E67E22','#16A085','#D35400']

  return (
    <div style={{ maxWidth:900, margin:'0 auto', display:'flex', flexDirection:'column', gap:14 }}>
      <div className="card" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 16px' }}>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}><BarChart3 size={22} color="#D4AF37"/><p style={{ fontWeight:700, margin:0 }}>Analitiche Salone</p></div>
        <button className="btn-ghost" onClick={load} style={{ display:'flex', gap:6, alignItems:'center', fontSize:12 }}><RefreshCw size={13}/>Aggiorna</button>
      </div>

      {/* KPI */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
        {[
          { icon:<Scissors size={20} color="#D4AF37"/>, v:totale_appuntamenti, l:'Servizi completati', top:'#D4AF37' },
          { icon:<TrendingUp size={20} color="#16a34a"/>, v:`€${parseFloat(totale_incasso_servizi||0).toFixed(0)}`, l:'Incasso servizi', top:'#16a34a' },
          { icon:<Package size={20} color="#16a34a"/>, v:`€${parseFloat(totale_ricavi_magazzino||0).toFixed(0)}`, l:'Ricavi magazzino', top:'#16a34a' },
          { icon:<TrendingUp size={20} color="#D4AF37"/>, v:`€${totale.toFixed(0)}`, l:'Totale globale', top:'#D4AF37', dark:true },
        ].map((k,i)=>(
          <div key={i} className="card" style={{ textAlign:'center', borderTop:`3px solid ${k.top}`, background:k.dark?'linear-gradient(135deg,#1a1a2e,#2d2d4e)':'white', color:k.dark?'white':undefined }}>
            <div style={{ display:'flex', justifyContent:'center', marginBottom:6 }}>{k.icon}</div>
            <p style={{ fontSize:22, fontWeight:700, margin:0 }}>{k.v}</p>
            <p style={{ fontSize:11, color:k.dark?'rgba(255,255,255,.6)':'#6b7280', margin:0 }}>{k.l}</p>
          </div>
        ))}
      </div>

      {/* Staff */}
      <div className="card">
        <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:20 }}><Users size={18} color="#D4AF37"/><p style={{ fontWeight:700, margin:0 }}>Performance Operatrici</p></div>
        {staff_stats.length===0 ? <p style={{ textAlign:'center', color:'#9ca3af', fontSize:13 }}>Nessun dato.</p>
        : staff_stats.map((s,i)=>{
          const inc=parseFloat(s.incasso_totale)||0
          const pct=(inc/maxI)*100
          const col=pal[i%pal.length]
          const top=i===0&&inc>0
          return (
            <div key={s.id} style={{ marginBottom:18 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  {top&&<Trophy size={14} color="#D4AF37"/>}
                  <div style={{ width:28, height:28, borderRadius:'50%', background:col, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:700, fontSize:12, flexShrink:0 }}>{s.nome.trim().charAt(0).toUpperCase()}</div>
                  <span style={{ fontWeight:600, fontSize:14 }}>{s.nome.trim()}</span>
                  {top&&<span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background:'#D4AF37', color:'white' }}>Top</span>}
                </div>
                <div style={{ display:'flex', gap:16, fontSize:13 }}>
                  <span style={{ color:'#6b7280' }}><b style={{ color:'#111827' }}>{s.num_servizi}</b> servizi</span>
                  <span style={{ fontWeight:700, color:'#16a34a', minWidth:80, textAlign:'right' }}>€ {inc.toFixed(2)}</span>
                </div>
              </div>
              <div style={{ height:8, background:'#f3f4f6', borderRadius:4, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${pct}%`, background:col, borderRadius:4, transition:'width .6s' }}/>
              </div>
              {s.num_servizi>0&&<p style={{ fontSize:11, color:'#9ca3af', margin:'3px 0 0' }}>Media: € {(inc/s.num_servizi).toFixed(2)}/servizio</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}