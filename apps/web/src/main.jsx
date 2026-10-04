import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Mic, Send, ShieldCheck, CheckCircle2, XCircle, Search, Plug, Car, Briefcase, Plane, Film, ShoppingBag, Utensils, Stethoscope, Mail, Sparkles, ChevronRight, RefreshCw } from 'lucide-react';
import './style.css';

const API = import.meta.env.VITE_API_URL || '/api';
const intents = [
  ['Jobs', Briefcase, 'Find the best HR leadership jobs for me'],
  ['Cab', Car, 'Compare cabs to the airport'],
  ['Travel', Plane, 'Find the best Bengaluru to Delhi flight'],
  ['Movies', Film, 'Find the best movie option tonight'],
  ['Shopping', ShoppingBag, 'Compare a product price'],
  ['Food', Utensils, 'Find the best dinner ordering option'],
  ['Health', Stethoscope, 'Find a doctor appointment'],
  ['Email', Mail, 'Review my important email']
];

function App() {
  const [data, setData] = useState({ messages: [], approvals: [], paymentConfirmations: [], connections: [], profile: { cards: [] }, registry: {} });
  const [text, setText] = useState('');
  const [comparison, setComparison] = useState(null);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState('Jarvis');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const r = await fetch(`${API}/dashboard`);
      if (!r.ok) throw new Error('API unavailable');
      setData(await r.json()); setError('');
    } catch { setError('Backend is not reachable. Start the API or deploy the combined app.'); }
  };
  useEffect(() => { load(); }, []);

  async function ask(value = text) {
    const message = value.trim(); if (!message || busy) return;
    setBusy(true); setText(''); setError('');
    try {
      const r = await fetch(`${API}/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Request failed');
      if (j.results?.length) setComparison({ domain: j.domain, results: j.results, dataMode: j.dataMode, providers: j.providers });
      await load();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function decision(id, decisionValue) {
    await fetch(`${API}/approvals/${id}/decision`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ decision: decisionValue }) });
    load();
  }

  function voice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert('Voice recognition is unavailable in this browser.');
    const recognition = new SpeechRecognition(); recognition.lang = 'en-IN';
    recognition.onresult = e => setText(e.results[0][0].transcript); recognition.start();
  }

  const providerCount = useMemo(() => Object.values(data.registry || {}).flat().length, [data.registry]);

  return <div className="shell"><aside><div className="logo"><div>J</div><span>JARVIS<small>Personal Intelligence</small></span></div><nav>{['Jarvis','Discover','Approvals','Connections','Profile'].map(x=><button className={tab===x?'on':''} onClick={()=>setTab(x)} key={x}>{x}</button>)}</nav><div className="safe"><ShieldCheck/> Protected execution<small>Jarvis can search and prepare autonomously. Every monetary transaction requires a fresh, exact confirmation immediately before payment — even ₹1.</small></div></aside><main><header><div className="topsearch"><Search/><input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&ask()} placeholder="Tell Jarvis the outcome you want…"/></div><button onClick={voice}><Mic/> Voice</button><div className="avatar">S</div></header><section className="content"><div className="hero"><span><Sparkles/> JARVIS ORCHESTRATOR</span><h1>What should I take care of?</h1><p>Tell me the outcome. Jarvis decides which connected sources to check, normalizes comparable results and brings you the best next action.</p></div>{error&&<div style={{padding:'12px 14px',border:'1px solid #f1c7c7',background:'#fff5f5',borderRadius:12,margin:'14px 0',color:'#8b2d2d'}}>{error}</div>}<div className="intentRow">{intents.map(([name,Icon,prompt])=><button key={name} onClick={()=>ask(prompt)}><Icon/><span><b>{name}</b><small>{prompt}</small></span><ChevronRight/></button>)}</div><div className="layout"><article className="conversation"><div className="sectionTitle"><b>Conversation</b><span>{busy?<><RefreshCw size={14}/> Working…</>:'Ready'}</span></div><div className="messages">{data.messages.length?data.messages.map(m=><div className={'msg '+m.role} key={m.id}>{m.text}</div>):<div className="starter"><Sparkles/><b>Jarvis is ready.</b><p>Try “Find the best HR leadership jobs for me” or “Book a cab to the airport.”</p></div>}</div><div className="composer"><button onClick={voice}><Mic/></button><input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&ask()} placeholder="Talk or type naturally…"/><button className="primary" onClick={()=>ask()}><Send/></button></div></article><div className="sidecol">{comparison&&<article><div className="sectionTitle"><b>Jarvis comparison</b><span>{comparison.domain} · {comparison.dataMode}</span></div><div className="results">{comparison.results.map((r,i)=><div className={'result '+(i===0?'best':'')} key={r.id}><div className="rank">{i===0?'★':i+1}</div><div><b>{r.provider}</b><span>{r.title}</span><small>{r.note}</small></div><strong>{r.value}</strong></div>)}</div><p className="disclaimer">Prototype comparison data is clearly marked. Live data is enabled provider-by-provider only after a permitted connector is configured.</p></article>}<article><div className="sectionTitle"><b>Action approvals</b><span>{data.approvals.length}</span></div>{data.approvals.length?data.approvals.map(a=><div className="approval" key={a.id}><b>{a.domain} · {a.recommendedProvider||'provider'}</b><p>{a.instruction}</p>{a.maySpendMoney&&<small style={{display:'block',color:'#9a6a00',marginBottom:8}}>May involve payment. Action approval never authorizes a charge.</small>}<div><button onClick={()=>decision(a.id,'rejected')}><XCircle/>Cancel</button><button className="primary" onClick={()=>decision(a.id,'approved')}><CheckCircle2/>Approve</button></div></div>):<div className="empty">Nothing waiting for approval.</div>}</article><article><div className="sectionTitle"><b>Payment lock</b><span>{data.paymentConfirmations?.length||0}</span></div><p className="muted">No automatic payments. Every exact amount/provider must be confirmed immediately before a charge. Confirmations are time-limited and single-use.</p>{data.paymentConfirmations?.length?data.paymentConfirmations.map(p=><div className="approval" key={p.id}><b>{p.provider} · {(p.amountMinor/100).toLocaleString('en-IN',{style:'currency',currency:p.currency||'INR'})}</b><p>{p.description}</p><small>Use the mobile payment confirmation flow or payment API decision endpoint.</small></div>):null}</article><article><div className="sectionTitle"><b>Connected world</b><span><Plug size={15}/> {data.connections?.length||0} connected</span></div><p className="muted">{providerCount} provider definitions are scaffolded. Their live connectors must be added using official/permitted authorization and APIs.</p></article></div></div></section></main></div>;
}

createRoot(document.getElementById('root')).render(<App/>);
