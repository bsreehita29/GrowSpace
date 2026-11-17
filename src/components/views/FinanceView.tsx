import { useState } from 'react';
import { PiggyBank, Trash2, Wallet } from 'lucide-react';
import { FinanceCategoryChart } from '../charts/GrowthCharts';
import {
  createFinanceGoal,
  createFinanceTransaction,
  deleteSubdoc,
  updateFinanceGoalAmount,
} from '../../services/firestoreService';
import type { FinanceGoal, FinanceTransaction, UserProfile } from '../../types/growth';

interface FinanceViewProps {
  uid: string;
  todayKey: string;
  profile: UserProfile | null;
  transactions: FinanceTransaction[];
  goals: FinanceGoal[];
}

export function FinanceView({ uid, todayKey, profile, transactions, goals }: FinanceViewProps) {
  const currency = profile?.currencySymbol || '$';
  const monthlyBudget = profile?.monthlyBudgetLimit ?? 1200;

  const [txFilter, setTxFilter] = useState<'all' | 'expense' | 'income' | 'savings'>('all');

  // Transaction Form
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [txType, setTxType] = useState<FinanceTransaction['txType']>('expense');
  const [category, setCategory] = useState('Food');
  const [dateKey, setDateKey] = useState(todayKey);
  const [notes, setNotes] = useState('');

  // Savings Goal Form
  const [goalTitle, setGoalTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('1000');
  const [goalType, setGoalType] = useState<FinanceGoal['goalType']>('savings');

  const totalIncome = transactions.filter((t) => t.txType === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter((t) => t.txType === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalSavings = transactions.filter((t) => t.txType === 'savings').reduce((s, t) => s + t.amount, 0);

  const currentMonth = todayKey.slice(0, 7);
  const monthExpenses = transactions
    .filter((t) => t.txType === 'expense' && t.dateKey.slice(0, 7) === currentMonth)
    .reduce((s, t) => s + t.amount, 0);
  const budgetPct = monthlyBudget > 0 ? Math.min(100, Math.round((monthExpenses / monthlyBudget) * 100)) : 0;

  const visibleTx = [...transactions]
    .filter((t) => txFilter === 'all' || t.txType === txFilter)
    .sort((a, b) => b.dateKey.localeCompare(a.dateKey));

  async function handleAddTx(e: React.FormEvent) {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!title.trim() || !Number.isFinite(num) || num <= 0) return;
    await createFinanceTransaction(uid, {
      title,
      amount: num,
      txType,
      category,
      dateKey,
      notes,
    });
    setTitle('');
    setAmount('');
    setNotes('');
  }

  async function handleAddGoal(e: React.FormEvent) {
    e.preventDefault();
    const num = parseFloat(targetAmount);
    if (!goalTitle.trim() || !Number.isFinite(num) || num <= 0) return;
    await createFinanceGoal(uid, {
      title: goalTitle,
      goalType,
      targetAmount: num,
      currentAmount: 0,
      category: goalType === 'savings' ? 'Savings' : 'Budget',
    });
    setGoalTitle('');
  }

  return (
    <div className="space-y-8">
      {/* Financial KPI Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E4E7DF] rounded-xl p-5">
          <p className="text-xs text-[#5A685C]">Total Income</p>
          <p className="mt-1.5 text-2xl font-semibold font-mono tabular-nums text-[#3E6B4F]">
            {currency}{totalIncome.toFixed(2)}
          </p>
        </div>
        <div className="bg-white border border-[#E4E7DF] rounded-xl p-5">
          <p className="text-xs text-[#5A685C]">Total Expenses</p>
          <p className="mt-1.5 text-2xl font-semibold font-mono tabular-nums text-[#1F2A22]">
            {currency}{totalExpenses.toFixed(2)}
          </p>
        </div>
        <div className="bg-white border border-[#E4E7DF] rounded-xl p-5">
          <p className="text-xs text-[#5A685C]">Allocated to Savings</p>
          <p className="mt-1.5 text-2xl font-semibold font-mono tabular-nums text-[#3E6B4F]">
            {currency}{totalSavings.toFixed(2)}
          </p>
        </div>
        <div className="bg-white border border-[#E4E7DF] rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#5A685C]">
            <span>Monthly Budget Usage</span>
            <span className="font-mono tabular-nums">{budgetPct}%</span>
          </div>
          <p className="text-lg font-semibold font-mono tabular-nums text-[#1F2A22]">
            {currency}{monthExpenses.toFixed(0)} / {currency}{monthlyBudget}
          </p>
          <div className="h-1.5 bg-[#EEF1EA] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${budgetPct > 85 ? 'bg-[#C07A72]' : 'bg-[#3E6B4F]'}`}
              style={{ width: `${budgetPct}%` }}
            />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Add Transaction */}
        <form
          onSubmit={handleAddTx}
          className="lg:col-span-4 bg-white border border-[#E4E7DF] rounded-xl p-6 space-y-4 h-fit"
        >
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-[#3E6B4F]" />
            <h3 className="text-base font-semibold text-[#1F2A22]">Record Transaction</h3>
          </div>
          <input
            type="text"
            required
            placeholder="Description (e.g., Textbooks, Groceries)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder={`Amount (${currency})`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg font-mono tabular-nums"
            />
            <select
              value={txType}
              onChange={(e) => setTxType(e.target.value as FinanceTransaction['txType'])}
              className="px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
              <option value="savings">Savings</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
            />
            <input
              type="date"
              value={dateKey}
              onChange={(e) => setDateKey(e.target.value)}
              className="px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg font-mono"
            />
          </div>
          <input
            type="text"
            placeholder="Optional note"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
          />
          <button
            type="submit"
            className="w-full py-2.5 bg-[#3E6B4F] text-white text-sm font-medium rounded-lg hover:bg-[#335A42] cursor-pointer"
          >
            Add Entry
          </button>
        </form>

        {/* Ledger */}
        <div className="lg:col-span-8 bg-white border border-[#E4E7DF] rounded-xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-[#1F2A22]">Ledger</h3>
            <div className="flex items-center gap-1 p-1 bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg">
              {(['all', 'expense', 'income', 'savings'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTxFilter(t)}
                  className={`px-3 py-1 text-xs font-medium rounded-md capitalize cursor-pointer ${
                    txFilter === t ? 'bg-white text-[#1F2A22] shadow-xs' : 'text-[#5A685C]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-[#EEF1EA]">
            {visibleTx.map((tx) => (
              <div key={tx.id} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#1F2A22] truncate">{tx.title}</p>
                  <p className="text-xs text-[#5A685C]">
                    {tx.category} · {tx.txType} · <span className="font-mono tabular-nums">{tx.dateKey}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`font-mono tabular-nums text-sm font-semibold ${
                      tx.txType === 'income'
                        ? 'text-[#3E6B4F]'
                        : tx.txType === 'savings'
                        ? 'text-[#5A8D9A]'
                        : 'text-[#1F2A22]'
                    }`}
                  >
                    {tx.txType === 'income' ? '+' : tx.txType === 'expense' ? '-' : ''}
                    {currency}
                    {tx.amount.toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteSubdoc(uid, 'financeTx', tx.id)}
                    aria-label="Delete transaction"
                    className="p-1 text-[#859286] hover:text-[#B44C44] cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Category Breakdown + Savings Goals */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white border border-[#E4E7DF] rounded-xl p-6 space-y-4">
          <h3 className="text-base font-semibold text-[#1F2A22]">Spending by Category</h3>
          <FinanceCategoryChart transactions={transactions} currency={currency} />
        </div>

        <div className="lg:col-span-7 bg-white border border-[#E4E7DF] rounded-xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <PiggyBank className="w-4 h-4 text-[#3E6B4F]" />
              <h3 className="text-base font-semibold text-[#1F2A22]">Savings Goals & Buckets</h3>
            </div>
            <form onSubmit={handleAddGoal} className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                required
                placeholder="Goal title"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                className="px-3 py-1.5 text-xs bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
              />
              <input
                type="number"
                required
                min={1}
                placeholder="Target"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-24 px-2.5 py-1.5 text-xs bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg font-mono"
              />
              <select
                value={goalType}
                onChange={(e) => setGoalType(e.target.value as FinanceGoal['goalType'])}
                className="px-2.5 py-1.5 text-xs bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg"
              >
                <option value="savings">Savings</option>
                <option value="budget">Budget</option>
              </select>
              <button
                type="submit"
                className="px-3 py-1.5 bg-[#3E6B4F] text-white text-xs font-medium rounded-lg cursor-pointer"
              >
                Create
              </button>
            </form>
          </div>

          <div className="space-y-4">
            {goals.map((g) => {
              const pct = g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0;
              return (
                <div key={g.id} className="p-4 bg-[#FAF8F3] border border-[#E4E7DF] rounded-lg space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-[#1F2A22]">{g.title}</p>
                      <p className="text-xs font-mono tabular-nums text-[#5A685C]">
                        {currency}{g.currentAmount.toFixed(0)} / {currency}{g.targetAmount.toFixed(0)} ({pct}%)
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateFinanceGoalAmount(uid, g.id, g.currentAmount + 50)}
                        className="px-2.5 py-1 text-xs bg-[#EEF3EC] text-[#2C523B] rounded-md cursor-pointer"
                      >
                        +{currency}50
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSubdoc(uid, 'financeGoals', g.id)}
                        aria-label="Delete goal"
                        className="p-1 text-[#859286] hover:text-[#B44C44] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="h-1.5 bg-[#E4E7DF] rounded-full overflow-hidden">
                    <div className="h-full bg-[#3E6B4F] rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
