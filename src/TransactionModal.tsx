import { useEffect, useRef, useState } from 'react';
import { X, ArrowDownToLine, ReceiptText } from 'lucide-react';
import type { LedgerInput, LedgerKind, Portfolio } from '../shared/types';
import { post } from './api';

export default function TransactionModal({ initial, close, saved }: { initial: LedgerKind; close: () => void; saved: (p: Portfolio) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [kind, setKind] = useState(initial);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const requestId = useRef(crypto.randomUUID());
  const cashOnly = kind === 'deposit' || kind === 'withdrawal';
  useEffect(() => { dialog.current?.showModal(); }, []);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setBusy(true);
    const fields = Object.fromEntries(new FormData(event.currentTarget)) as Record<string,string>;
    try {
      const data: LedgerInput = { ...fields, kind, requestId: requestId.current };
      const p = await post<Portfolio>('/ledger', data);
      saved(p); close();
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  return <dialog ref={dialog} className="modal" onCancel={close} onClick={event => { if (event.target === event.currentTarget && !busy) close(); }} aria-labelledby="transaction-title">
    <div className="modal-heading"><div className="modal-icon">{cashOnly ? <ArrowDownToLine size={22}/> : <ReceiptText size={22}/>}</div><button className="icon-button" aria-label="關閉" onClick={close} disabled={busy}><X size={18}/></button></div>
    <h2 id="transaction-title">記錄資金與交易</h2><p className="muted">只記帳，不會向富途送出交易指令。</p>
    <form onSubmit={submit}>
      <label>紀錄類型<select value={kind} onChange={e => { setKind(e.target.value as LedgerKind); requestId.current = crypto.randomUUID(); }}>
        <option value="deposit">美元入金／首次現金</option><option value="opening">輸入既有持倉</option><option value="buy">買入成交</option><option value="sell">賣出成交</option><option value="withdrawal">美元出金</option>
      </select></label>
      {cashOnly ? <><label>金額（USD）<input name="amount" required inputMode="decimal" placeholder="0.00" autoFocus /></label><p className="form-hint">首次請填「目前可用美元現金」，不用加上已持有股票的成本。港元不計入。</p></> : <>
        <label>股票代碼<input name="symbol" required placeholder="例如 AAPL 或 VOO" autoCapitalize="characters" autoFocus maxLength={10}/></label>
        <div className="form-grid"><label>股數<input name="quantity" required inputMode="decimal" placeholder="0" /></label><label>{kind === 'opening' ? '平均成本' : '成交價'}（USD）<input name="price" required inputMode="decimal" placeholder="0.00" /></label></div>
        {kind !== 'opening' ? <><label>實際手續費及其他費用（USD）<input name="fees" required inputMode="decimal" placeholder="填寫富途成交結單的總費用" /></label><p className="form-hint">富途適用費率尚待官方資料核對，目前請填寫實際費用；不以未核實費率估算。</p></> : <p className="form-hint">輸入含歷史費用的平均成本。既有持倉不會再次扣減目前現金。</p>}
      </>}
      <label>備註（選填）<input name="note" maxLength={200} placeholder="例如：首次資產記錄" /></label>
      {error && <p role="alert" className="form-error">{error}</p>}
      <button type="submit" className="button primary full" disabled={busy}>{busy ? '正在儲存…' : '儲存至資金帳本'}</button>
    </form>
  </dialog>;
}
