import React, { useState } from 'react'
import { supabase } from '../supabaseClient'
import { Lock, ArrowRight } from 'lucide-react'

export default function Login({ onLoginSuccess }) {
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErr('')

    // Usiamo l'email fissa che hai creato su Supabase!
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@salone.it', // <-- INSERISCI QUI L'EMAIL FITTIZIA CHE HAI CREATO
      password: password
    })

    if (error) {
      setErr('Password errata!')
    } else {
      onLoginSuccess(data.session)
    }
    setLoading(false)
  }

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#f3f4f6' }}>
      <div className="card" style={{ maxWidth: 360, width: '100%', padding: '40px 30px', textAlign: 'center', borderTop: '4px solid #D4AF37' }}>
        
        <div style={{ width: 60, height: 60, background: '#fefce8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Lock size={28} color="#D4AF37" />
        </div>
        
        <h2 style={{ margin: '0 0 8px', color: '#111827' }}>Gestionale Salone</h2>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 24px' }}>Inserisci la password per accedere</p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input 
            type="password" 
            autoFocus
            className="input-base" 
            placeholder="Password..." 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ textAlign: 'center', fontSize: 18, letterSpacing: 2, padding: '12px' }}
          />
          
          {err && <p style={{ margin: 0, color: '#dc2626', fontSize: 13, fontWeight: 600 }}>{err}</p>}
          
          <button 
            type="submit" 
            disabled={loading}
            className="btn-gold" 
            style={{ padding: '12px', fontSize: 15, display: 'flex', justifyContent: 'center', gap: 8 }}
          >
            {loading ? 'Verifica in corso...' : 'Accedi'} <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  )
}