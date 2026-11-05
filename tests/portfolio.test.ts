import { describe, it, expect, beforeEach } from 'vitest';
import { sqliteD1 } from './support/sqlite';
import { addLedger, getPortfolio } from '../worker/database';
import { fixed, normalizeLedger, positionSizing } from '../shared/portfolio';
import type { LedgerInput } from '../shared/types';

let db:D1Database;
let sequence=0;
const input=(kind:LedgerInput['kind'],fields:Partial<LedgerInput>={}):LedgerInput=>({requestId:`request-${++sequence}`,kind,...fields});
beforeEach(()=>{db=sqliteD1()});
describe('cash-only dollar portfolio',()=>{
  it('keeps current cash separate from opening holdings',async()=>{
    await addLedger(db,input('deposit',{amount:'1000.00'}));
    const p=await addLedger(db,input('opening',{symbol:'AAPL',quantity:'10',price:'150'}));
    expect(p.cashCents).toBe(100000);expect(p.positions[0].costCents).toBe(150000);
  });
  it('includes actual fees in cash, cost basis and realized profit',async()=>{
    await addLedger(db,input('deposit',{amount:'5000'}));
    await addLedger(db,input('buy',{symbol:'AAPL',quantity:'10',price:'100',fees:'2'}));
    await addLedger(db,input('buy',{symbol:'AAPL',quantity:'10',price:'200',fees:'2'}));
    const p=await addLedger(db,input('sell',{symbol:'AAPL',quantity:'5',price:'180',fees:'1'}));
    expect(p.cashCents).toBe(289500);expect(p.positions[0].quantity).toBe(15);
    expect(p.positions[0].costCents).toBe(225300);expect(p.realizedCents).toBe(14800);
  });
  it('does not permit a purchase that needs margin',async()=>{
    await addLedger(db,input('deposit',{amount:'100'}));
    await expect(addLedger(db,input('buy',{symbol:'AAPL',quantity:'1',price:'100',fees:'1'}))).rejects.toThrow('不足');
    expect((await getPortfolio(db)).cashCents).toBe(10000);
  });
  it('prevents short selling even when sale proceeds would increase cash',async()=>{
    await expect(addLedger(db,input('sell',{symbol:'AAPL',quantity:'1',price:'100',fees:'0'}))).rejects.toThrow('不足');
  });
  it('applies a retry exactly once, including simultaneous requests',async()=>{
    const deposit=input('deposit',{amount:'1000'});
    await Promise.all([addLedger(db,deposit),addLedger(db,deposit)]);
    expect((await getPortfolio(db)).cashCents).toBe(100000);
    await expect(addLedger(db,{...deposit,amount:'2000'})).rejects.toThrow('不同紀錄');
  });
  it('atomically prevents simultaneous purchases from spending the same cash',async()=>{
    await addLedger(db,input('deposit',{amount:'100'}));
    const results=await Promise.allSettled([
      addLedger(db,input('buy',{symbol:'AAPL',quantity:'1',price:'80',fees:'0'})),
      addLedger(db,input('buy',{symbol:'MSFT',quantity:'1',price:'80',fees:'0'})),
    ]);
    expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);
    expect((await getPortfolio(db)).cashCents).toBe(2000);
  });
  it('supports fractional shares and clears cost after a full sale',async()=>{
    await addLedger(db,input('deposit',{amount:'100'}));
    await addLedger(db,input('buy',{symbol:'VOO',quantity:'0.123456',price:'100',fees:'0.01'}));
    const p=await addLedger(db,input('sell',{symbol:'VOO',quantity:'0.123456',price:'100',fees:'0.01'}));
    expect(p.positions).toHaveLength(0);expect(p.cashCents).toBe(9998);expect(p.realizedCents).toBe(-2);
  });
  it('rejects negative, excessive precision and non-string cash values',()=>{
    for(const value of ['-1','1e3','1.001','NaN',null,123]) expect(()=>fixed(value as string,2)).toThrow();
    expect(()=>normalizeLedger(null as any)).toThrow('不完整');expect(fixed('0.10',2)).toBe(10);
  });
});
describe('risk-based sizing',()=>{
  it('respects existing exposure, available cash and fees',()=>{
    const p=positionSizing({cash:5000,equity:10000,existingValue:1400,entry:100,stopLoss:90,fees:2,risk:'balanced'});
    expect(p.shares).toBe(1);expect(p.positionPercent).toBe(15);expect(p.riskAmount).toBe(12);
  });
  it('returns zero shares when current concentration is already too high',()=>{
    expect(positionSizing({cash:5000,equity:10000,existingValue:2000,entry:100,stopLoss:90,fees:1,risk:'balanced'}).shares).toBe(0);
  });
  it('requires a stop below entry rather than inventing one',()=>{
    expect(()=>positionSizing({cash:1000,equity:1000,existingValue:0,entry:100,stopLoss:110,fees:0,risk:'balanced'})).toThrow();
  });
});
