import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

const API = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8787/api';
const tabs = ['Jarvis', 'Approvals', 'Payments', 'Connections'];
const quick = [
  ['Jobs', 'Find the best HR leadership jobs for me'],
  ['Cab', 'Compare cabs to the airport'],
  ['Travel', 'Find the best Bengaluru to Delhi flight'],
  ['Movies', 'Find the best movie option tonight']
];

const money = (minor, currency = 'INR') => {
  try { return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(minor / 100); }
  catch { return `${currency} ${(minor / 100).toFixed(2)}`; }
};

export default function App() {
  const [tab, setTab] = useState('Jarvis');
  const [data, setData] = useState({ messages: [], approvals: [], paymentConfirmations: [], connections: [], registry: {} });
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const r = await fetch(`${API}/dashboard`);
      if (!r.ok) throw new Error('Jarvis API unavailable');
      setData(await r.json());
      setError('');
    } catch (e) { setError(e.message); }
  };

  useEffect(() => { load(); }, []);

  const ask = async (value = text) => {
    const message = String(value || '').trim();
    if (!message || busy) return;
    setBusy(true); setText('');
    try {
      const r = await fetch(`${API}/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Request failed');
      await load();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const actionDecision = async (approval, decision) => {
    if (decision === 'approved' && approval.maySpendMoney) {
      const proceed = await new Promise(resolve => Alert.alert(
        'Approve action preparation?',
        'This does NOT authorize payment. If a charge is required, Jarvis must ask you again for the exact amount immediately before payment — even for ₹1.',
        [{ text: 'Cancel', style: 'cancel', onPress: () => resolve(false) }, { text: 'Approve action', onPress: () => resolve(true) }]
      ));
      if (!proceed) return;
    }
    await fetch(`${API}/approvals/${approval.id}/decision`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision })
    });
    load();
  };

  const paymentDecision = async (payment, decision) => {
    if (decision === 'confirmed') {
      const exact = money(payment.amountMinor, payment.currency);
      const proceed = await new Promise(resolve => Alert.alert(
        `Confirm payment ${exact}?`,
        `Pay ${exact} to ${payment.provider} for ${payment.description}. This confirmation is exact, time-limited and single-use.`,
        [{ text: 'No', style: 'cancel', onPress: () => resolve(false) }, { text: `Confirm ${exact}`, style: 'destructive', onPress: () => resolve(true) }]
      ));
      if (!proceed) return;
    }
    const r = await fetch(`${API}/payments/${payment.id}/decision`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision })
    });
    const j = await r.json();
    if (!r.ok) Alert.alert('Unable to update payment', j.error || 'Try again');
    load();
  };

  const providers = useMemo(() => Object.values(data.registry || {}).flat().length, [data.registry]);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.header}>
          <View><Text style={s.brand}>JARVIS</Text><Text style={s.sub}>Personal AI OS</Text></View>
          <View style={s.shield}><Text style={s.shieldText}>₹ PAYMENT LOCK</Text></View>
        </View>

        <View style={s.paymentRule}>
          <Text style={s.paymentRuleTitle}>No automatic payments. Ever.</Text>
          <Text style={s.paymentRuleText}>Every charge requires a fresh confirmation for the exact provider and amount immediately before payment — including ₹1.</Text>
        </View>

        <View style={s.tabs}>{tabs.map(t => <Pressable key={t} onPress={() => setTab(t)} style={[s.tab, tab === t && s.tabOn]}><Text style={[s.tabText, tab === t && s.tabTextOn]}>{t}</Text></Pressable>)}</View>

        {error ? <Text style={s.error}>{error} · API: {API}</Text> : null}

        {tab === 'Jarvis' && <View style={s.flex}>
          <ScrollView contentContainerStyle={s.body}>
            <Text style={s.title}>What should I take care of?</Text>
            <Text style={s.muted}>Tell Jarvis the outcome. It chooses the relevant connected providers and compares them for you.</Text>
            <View style={s.quickGrid}>{quick.map(([name, prompt]) => <Pressable key={name} style={s.quick} onPress={() => ask(prompt)}><Text style={s.quickTitle}>{name}</Text><Text style={s.quickText}>{prompt}</Text></Pressable>)}</View>
            <Text style={s.section}>Conversation</Text>
            {(data.messages || []).length ? data.messages.slice(-20).map(m => <View key={m.id} style={[s.msg, m.role === 'user' ? s.user : s.ai]}><Text style={s.msgText}>{m.text}</Text></View>) : <View style={s.empty}><Text style={s.emptyTitle}>Jarvis is ready.</Text><Text style={s.muted}>Try “Book a cab to the airport” or “Find jobs for me.”</Text></View>}
          </ScrollView>
          <View style={s.composer}><TextInput style={s.input} value={text} onChangeText={setText} placeholder="Talk or type naturally…" placeholderTextColor="#71869d" onSubmitEditing={() => ask()} /><Pressable style={s.send} onPress={() => ask()}>{busy ? <ActivityIndicator color="#07111f" /> : <Text style={s.sendText}>Send</Text>}</Pressable></View>
        </View>}

        {tab === 'Approvals' && <ScrollView contentContainerStyle={s.body}>
          <Text style={s.title}>Action approvals</Text>
          <Text style={s.muted}>Actions that change something outside Jarvis wait here. Payment is always a separate confirmation.</Text>
          {(data.approvals || []).map(a => <View style={s.card} key={a.id}><Text style={s.cardTitle}>{a.domain} · {a.recommendedProvider || 'provider'}</Text><Text style={s.cardText}>{a.instruction}</Text>{a.maySpendMoney && <Text style={s.warning}>May involve payment — approving this does not authorize a charge.</Text>}<View style={s.row}><Pressable style={s.secondary} onPress={() => actionDecision(a, 'rejected')}><Text style={s.secondaryText}>Cancel</Text></Pressable><Pressable style={s.primary} onPress={() => actionDecision(a, 'approved')}><Text style={s.primaryText}>Approve action</Text></Pressable></View></View>)}
          {!data.approvals?.length && <View style={s.empty}><Text style={s.emptyTitle}>Nothing waiting.</Text></View>}
        </ScrollView>}

        {tab === 'Payments' && <ScrollView contentContainerStyle={s.body}>
          <Text style={s.title}>Payment confirmation</Text>
          <Text style={s.muted}>Jarvis cannot bypass this screen or reuse an old confirmation for a different amount or provider.</Text>
          {(data.paymentConfirmations || []).map(p => <View style={s.card} key={p.id}><Text style={s.amount}>{money(p.amountMinor, p.currency)}</Text><Text style={s.cardTitle}>{p.provider}</Text><Text style={s.cardText}>{p.description}</Text><Text style={s.warning}>Exact amount · single use · expires quickly</Text><View style={s.row}><Pressable style={s.secondary} onPress={() => paymentDecision(p, 'rejected')}><Text style={s.secondaryText}>Reject</Text></Pressable>{p.status === 'pending' && <Pressable style={s.danger} onPress={() => paymentDecision(p, 'confirmed')}><Text style={s.primaryText}>Confirm payment</Text></Pressable>}</View></View>)}
          {!data.paymentConfirmations?.length && <View style={s.empty}><Text style={s.emptyTitle}>No payment waiting.</Text><Text style={s.muted}>Jarvis will only show a payment here immediately before a real provider charge.</Text></View>}
        </ScrollView>}

        {tab === 'Connections' && <ScrollView contentContainerStyle={s.body}>
          <Text style={s.title}>Connected apps</Text><Text style={s.muted}>{providers} provider definitions are scaffolded. Live connections must use permitted OAuth/API/deep-link flows.</Text>
          {(data.connections || []).map(c => <View style={s.card} key={c.id}><Text style={s.cardTitle}>{c.provider}</Text><Text style={s.cardText}>{c.status}</Text></View>)}
          {!data.connections?.length && <View style={s.empty}><Text style={s.emptyTitle}>No live providers connected yet.</Text></View>}
        </ScrollView>}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:'#07111f'}, flex:{flex:1}, header:{paddingHorizontal:18,paddingVertical:14,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderBottomColor:'#20364d'}, brand:{color:'#f5f8fc',fontWeight:'900',fontSize:20,letterSpacing:3}, sub:{color:'#91a4ba',fontSize:11}, shield:{borderWidth:1,borderColor:'#3f765e',backgroundColor:'#0f2a22',paddingHorizontal:10,paddingVertical:7,borderRadius:999}, shieldText:{color:'#79e3ac',fontSize:10,fontWeight:'800'},
  paymentRule:{margin:14,marginBottom:8,padding:13,borderRadius:14,borderWidth:1,borderColor:'#7a5f24',backgroundColor:'#2b2414'}, paymentRuleTitle:{color:'#ffdc87',fontWeight:'800',marginBottom:3}, paymentRuleText:{color:'#d7c99f',fontSize:12,lineHeight:17},
  tabs:{flexDirection:'row',paddingHorizontal:12,gap:6},tab:{flex:1,paddingVertical:9,borderRadius:10,alignItems:'center'},tabOn:{backgroundColor:'#102a43'},tabText:{color:'#7790a8',fontSize:11,fontWeight:'700'},tabTextOn:{color:'#c9ebff'},
  body:{padding:18,paddingBottom:40},title:{color:'#f5f8fc',fontSize:27,fontWeight:'850',marginBottom:7},muted:{color:'#91a4ba',lineHeight:20},section:{color:'#f5f8fc',fontWeight:'800',fontSize:16,marginTop:24,marginBottom:10}, quickGrid:{flexDirection:'row',flexWrap:'wrap',gap:10,marginTop:18},quick:{width:'48%',padding:13,borderRadius:13,borderWidth:1,borderColor:'#20364d',backgroundColor:'#0c1a2b'},quickTitle:{color:'#f5f8fc',fontWeight:'800'},quickText:{color:'#91a4ba',fontSize:11,marginTop:5,lineHeight:15},
  msg:{maxWidth:'88%',padding:12,borderRadius:14,marginBottom:9},user:{alignSelf:'flex-end',backgroundColor:'#1c4f76'},ai:{alignSelf:'flex-start',backgroundColor:'#10253a',borderWidth:1,borderColor:'#1b405f'},msgText:{color:'#f5f8fc',lineHeight:19},composer:{flexDirection:'row',padding:12,borderTopWidth:1,borderTopColor:'#20364d',gap:9},input:{flex:1,minHeight:46,borderWidth:1,borderColor:'#20364d',borderRadius:12,paddingHorizontal:13,color:'#fff',backgroundColor:'#0a1624'},send:{minWidth:72,borderRadius:12,backgroundColor:'#6ec1ff',alignItems:'center',justifyContent:'center'},sendText:{fontWeight:'900',color:'#07111f'},
  card:{padding:15,borderWidth:1,borderColor:'#20364d',borderRadius:14,backgroundColor:'#0c1a2b',marginTop:12},cardTitle:{color:'#f5f8fc',fontWeight:'800',fontSize:15},cardText:{color:'#b6c5d5',lineHeight:19,marginTop:6},warning:{color:'#ffcf70',fontSize:12,marginTop:9,lineHeight:17},row:{flexDirection:'row',gap:9,marginTop:14},secondary:{flex:1,borderWidth:1,borderColor:'#38516a',padding:11,borderRadius:10,alignItems:'center'},secondaryText:{color:'#d8e6f3',fontWeight:'700'},primary:{flex:1,backgroundColor:'#4d9bd1',padding:11,borderRadius:10,alignItems:'center'},danger:{flex:1,backgroundColor:'#a84242',padding:11,borderRadius:10,alignItems:'center'},primaryText:{color:'#fff',fontWeight:'800'}, amount:{color:'#ffdc87',fontSize:28,fontWeight:'900',marginBottom:7},empty:{padding:20,borderWidth:1,borderColor:'#20364d',borderRadius:14,marginTop:14,backgroundColor:'#0b1727'},emptyTitle:{color:'#f5f8fc',fontWeight:'800',marginBottom:5},error:{marginHorizontal:14,color:'#ffb5b5',backgroundColor:'#351b20',padding:10,borderRadius:10,fontSize:11}
});
