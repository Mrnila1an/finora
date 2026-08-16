"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Bell, CircleUserRound, LayoutDashboard, Sparkles, Target } from "lucide-react";

const supabase = createClient();

type TransactionType = "income" | "expense";

type Category = {
  id: string;
  name: string;
  type: TransactionType;
};

type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  description: string | null;
  transaction_date: string;
  payment_method: string | null;
  category_id: string | null;
};

export default function DashboardPage() {
  const router = useRouter();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /*
   * Load the user's transactions and categories.
   *
   * We intentionally do this directly inside useEffect instead of
   * calling another function that performs setState().
   * This keeps the React Hooks ESLint rule happy.
   */
  useEffect(() => {
    let cancelled = false;

    async function fetchDashboardData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (cancelled) {
        return;
      }

      if (!user) {
        router.push("/login");
        return;
      }

      const [transactionsResponse, categoriesResponse] =
        await Promise.all([
          supabase
            .from("transactions")
            .select(
              "id, type, amount, description, transaction_date, payment_method, category_id",
            )
            .eq("user_id", user.id)
            .order("transaction_date", { ascending: false }),

          supabase
            .from("categories")
            .select("id, name, type")
            .eq("user_id", user.id)
            .order("name"),
        ]);

      if (cancelled) {
        return;
      }

      if (transactionsResponse.error) {
        setError(transactionsResponse.error.message);
      } else {
        setTransactions(
          (transactionsResponse.data ?? []) as Transaction[],
        );
      }

      if (categoriesResponse.error) {
        setError(categoriesResponse.error.message);
      } else {
        setCategories(
          (categoriesResponse.data ?? []) as Category[],
        );
      }

      setLoading(false);
    }

    fetchDashboardData();

    return () => {
      cancelled = true;
    };
  }, [router]);

  /*
   * Reload the dashboard after adding or deleting a transaction.
   */
  async function refreshTransactions() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error: fetchError } = await supabase
      .from("transactions")
      .select(
        "id, type, amount, description, transaction_date, payment_method, category_id",
      )
      .eq("user_id", user.id)
      .order("transaction_date", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      return;
    }

    setTransactions((data ?? []) as Transaction[]);
  }

  async function handleAddTransaction(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      setError("Please enter an amount greater than 0.");
      setSaving(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Your session has expired. Please sign in again.");
      setSaving(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        type,
        amount: numericAmount,
        description: description.trim() || null,
        category_id: categoryId || null,
        payment_method: paymentMethod || null,
        transaction_date: transactionDate,
      });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    setAmount("");
    setDescription("");
    setCategoryId("");
    setPaymentMethod("");

    setSuccess("Transaction added successfully.");

    await refreshTransactions();

    setSaving(false);
  }

  async function handleDeleteTransaction(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this transaction?",
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    const { error: deleteError } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setSuccess("Transaction deleted.");

    await refreshTransactions();
  }

  const totalIncome = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce(
      (total, transaction) => total + Number(transaction.amount),
      0,
    );

  const totalExpenses = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce(
      (total, transaction) => total + Number(transaction.amount),
      0,
    );

  const balance = totalIncome - totalExpenses;

  const availableCategories = categories.filter(
    (category) => category.type === type,
  );

  const spendingByCategory = Object.values(
    transactions
      .filter((transaction) => transaction.type === "expense")
      .reduce<Record<string, { name: string; value: number }>>(
        (result, transaction) => {
          const name = getCategoryName(transaction.category_id);
          result[name] = result[name] ?? { name, value: 0 };
          result[name].value += Number(transaction.amount);
          return result;
        },
        {},
      ),
  );
  const chartColors = ["#8b5cf6", "#34d399", "#fbbf24", "#fb7185", "#38bdf8"];

  function getCategoryName(categoryId: string | null) {
    if (!categoryId) {
      return "Uncategorized";
    }

    const category = categories.find(
      (item) => item.id === categoryId,
    );

    return category?.name ?? "Uncategorized";
  }

  function formatMoney(value: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_85%_5%,rgba(124,58,237,.16),transparent_24rem),#080b1e] px-5 py-6 text-white sm:px-6 sm:py-10">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <header className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[.035] p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="flex items-center gap-2 text-sm font-bold text-violet-300"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500 text-white"><LayoutDashboard size={15} /></span>finora</p>

            <h1 className="mt-1 text-3xl font-bold">
              Your Dashboard
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Track your money and understand where it goes.
            </p>
          </div>

          <div className="flex items-center gap-2"><button type="button" aria-label="Notifications" className="rounded-xl border border-white/10 p-2.5 text-slate-300 transition hover:bg-white/10"><Bell size={18} /></button><Link href="/" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm font-medium transition hover:bg-white/10"><CircleUserRound size={18} />Home</Link></div>
        </header>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* SUCCESS MESSAGE */}
        {success && (
          <div className="mt-6 rounded-xl border border-emerald-900 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300">
            {success}
          </div>
        )}

        {/* SUMMARY CARDS */}
        <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* BALANCE */}
          <div className="rounded-2xl border border-white/10 bg-white/[.05] p-6 shadow-xl shadow-black/10">
            <p className="text-sm text-slate-400">Balance</p>

            <p className="mt-3 text-3xl font-bold">
              {formatMoney(balance)}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Income minus expenses
            </p>
          </div>

          {/* INCOME */}
          <div className="rounded-2xl border border-white/10 bg-white/[.05] p-6 shadow-xl shadow-black/10">
            <p className="text-sm text-slate-400">
              Total Income
            </p>

            <p className="mt-3 text-3xl font-bold text-emerald-400">
              {formatMoney(totalIncome)}
            </p>
          </div>

          {/* EXPENSES */}
          <div className="rounded-2xl border border-white/10 bg-white/[.05] p-6 shadow-xl shadow-black/10">
            <p className="text-sm text-slate-400">
              Total Expenses
            </p>

            <p className="mt-3 text-3xl font-bold text-red-400">
              {formatMoney(totalExpenses)}
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[.05] p-6">
            <div className="flex items-center gap-2"><Sparkles size={18} className="text-violet-300" /><h2 className="font-bold">Spending snapshot</h2></div>
            {spendingByCategory.length ? <div className="mt-4 h-52"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={spendingByCategory} dataKey="value" nameKey="name" innerRadius={55} outerRadius={82} paddingAngle={4}>{spendingByCategory.map((item, index) => <Cell key={item.name} fill={chartColors[index % chartColors.length]} />)}</Pie><Tooltip formatter={(value) => formatMoney(Number(value))} contentStyle={{ background: "#171a35", border: "1px solid #ffffff20", borderRadius: "12px" }} /></PieChart></ResponsiveContainer></div> : <p className="py-16 text-center text-sm text-slate-500">Add expenses to reveal your spending pattern.</p>}
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-400">{spendingByCategory.slice(0, 5).map((item, index) => <span key={item.name} className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full" style={{ background: chartColors[index] }} />{item.name}</span>)}</div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/20 via-[#171c44] to-emerald-500/10 p-6"><Image src="/images/savings-goal.png" alt="Savings plant with coins" width={260} height={260} className="pointer-events-none absolute -right-6 bottom-0 w-40 opacity-90 sm:w-48" /><div className="relative max-w-[72%]"><div className="flex items-center gap-2"><Target size={18} className="text-emerald-300" /><h2 className="font-bold">Your next money move</h2></div><p className="mt-5 text-2xl font-bold">Save {formatMoney(Math.max(balance * 0.2, 0))} this month.</p><p className="mt-2 text-sm leading-6 text-slate-300">A simple 20% target based on your current balance.</p><div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[42%] rounded-full bg-emerald-400" /></div><p className="mt-2 text-xs text-emerald-200">42% of your suggested target</p></div></div>
        </section>

        {/* ADD TRANSACTION */}
        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
          <div>
            <p className="text-sm font-medium text-slate-400">
              Money movement
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              Add a transaction
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Record your income or an expense.
            </p>
          </div>

          <form
            onSubmit={handleAddTransaction}
            className="mt-8 grid gap-5 md:grid-cols-2"
          >
            {/* TYPE */}
            <div>
              <label
                htmlFor="type"
                className="mb-2 block text-sm font-medium"
              >
                Type
              </label>

              <select
                id="type"
                value={type}
                onChange={(event) => {
                  setType(
                    event.target.value as TransactionType,
                  );
                  setCategoryId("");
                }}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-slate-400"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>

            {/* AMOUNT */}
            <div>
              <label
                htmlFor="amount"
                className="mb-2 block text-sm font-medium"
              >
                Amount
              </label>

              <input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                required
                value={amount}
                onChange={(event) =>
                  setAmount(event.target.value)
                }
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-slate-400"
              />
            </div>

            {/* DESCRIPTION */}
            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium"
              >
                Description
              </label>

              <input
                id="description"
                type="text"
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="e.g. Monthly salary"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-slate-400"
              />
            </div>

            {/* CATEGORY */}
            <div>
              <label
                htmlFor="category"
                className="mb-2 block text-sm font-medium"
              >
                Category
              </label>

              <select
                id="category"
                value={categoryId}
                onChange={(event) =>
                  setCategoryId(event.target.value)
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-slate-400"
              >
                <option value="">Select category</option>

                {availableCategories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* PAYMENT METHOD */}
            <div>
              <label
                htmlFor="paymentMethod"
                className="mb-2 block text-sm font-medium"
              >
                Payment method
              </label>

              <select
                id="paymentMethod"
                value={paymentMethod}
                onChange={(event) =>
                  setPaymentMethod(event.target.value)
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-slate-400"
              >
                <option value="">
                  Select payment method
                </option>

                <option value="Cash">Cash</option>

                <option value="Bank transfer">
                  Bank transfer
                </option>

                <option value="Debit card">
                  Debit card
                </option>

                <option value="Credit card">
                  Credit card
                </option>

                <option value="Mobile payment">
                  Mobile payment
                </option>

                <option value="Other">Other</option>
              </select>
            </div>

            {/* DATE */}
            <div>
              <label
                htmlFor="transactionDate"
                className="mb-2 block text-sm font-medium"
              >
                Date
              </label>

              <input
                id="transactionDate"
                type="date"
                required
                value={transactionDate}
                onChange={(event) =>
                  setTransactionDate(event.target.value)
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-slate-400"
              />
            </div>

            {/* SUBMIT */}
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-white px-6 py-3 font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : "Add transaction"}
              </button>
            </div>
          </form>
        </section>

        {/* RECENT TRANSACTIONS */}
        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 p-6">
            <h2 className="text-xl font-bold">
              Recent transactions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your latest income and expenses.
            </p>
          </div>

          {/* LOADING */}
          {loading && (
            <div className="p-8 text-center text-slate-500">
              Loading transactions...
            </div>
          )}

          {/* EMPTY */}
          {!loading && transactions.length === 0 && (
            <div className="p-10 text-center">
              <p className="text-lg font-medium">
                No transactions yet
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Add your first income or expense above.
              </p>
            </div>
          )}

          {/* TRANSACTION LIST */}
          {!loading && transactions.length > 0 && (
            <div className="divide-y divide-slate-800">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">
                      {transaction.description ||
                        getCategoryName(
                          transaction.category_id,
                        )}
                    </p>

                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span>
                        {getCategoryName(
                          transaction.category_id,
                        )}
                      </span>

                      <span>•</span>

                      <span>
                        {transaction.transaction_date}
                      </span>

                      {transaction.payment_method && (
                        <>
                          <span>•</span>

                          <span>
                            {transaction.payment_method}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-5">
                    <p
                      className={`text-lg font-bold ${
                        transaction.type === "income"
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {transaction.type === "income"
                        ? "+"
                        : "-"}

                      {formatMoney(
                        Number(transaction.amount),
                      )}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteTransaction(
                          transaction.id,
                        )
                      }
                      className="text-xs text-slate-500 transition hover:text-red-400"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
