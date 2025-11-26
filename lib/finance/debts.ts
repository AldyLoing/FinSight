import { Debt, DebtPayoffStrategy } from '../models/debt';

export function calculateDebtPayment(
  principal: number,
  interestRate: number,
  payment: number,
  interestType: 'simple' | 'compound' = 'simple'
): {
  interest: number;
  principalPaid: number;
  remainingBalance: number;
} {
  const monthlyRate = interestRate / 12;
  const interest = principal * monthlyRate;
  const principalPaid = Math.max(0, Math.min(payment - interest, principal));
  const remainingBalance = Math.max(0, principal - principalPaid);

  return {
    interest,
    principalPaid,
    remainingBalance,
  };
}

export function simulateDebtPayoff(
  debt: Debt,
  extraPayment: number = 0,
  maxMonths: number = 600
): {
  months: number;
  totalInterest: number;
  totalPaid: number;
  schedule: Array<{
    month: number;
    payment: number;
    principal: number;
    interest: number;
    balance: number;
  }>;
} {
  const schedule: Array<any> = [];
  let balance = debt.current_balance;
  let totalInterest = 0;
  let month = 0;

  while (balance > 0 && month < maxMonths) {
    month++;
    const payment = debt.minimum_payment + extraPayment;
    const result = calculateDebtPayment(balance, debt.interest_rate, payment, debt.interest_type);

    totalInterest += result.interest;
    balance = result.remainingBalance;

    schedule.push({
      month,
      payment: result.principalPaid + result.interest,
      principal: result.principalPaid,
      interest: result.interest,
      balance,
    });

    if (balance === 0) break;
  }

  const totalPaid = schedule.reduce((sum, s) => sum + s.payment, 0);

  return {
    months: month,
    totalInterest,
    totalPaid,
    schedule,
  };
}

export function simulateSnowballStrategy(
  debts: Debt[],
  extraPayment: number = 0
): DebtPayoffStrategy {
  // Snowball: Pay off smallest balance first
  const sortedDebts = [...debts].sort((a, b) => a.current_balance - b.current_balance);
  return simulateDebtStrategy(sortedDebts, extraPayment, 'snowball');
}

export function simulateAvalancheStrategy(
  debts: Debt[],
  extraPayment: number = 0
): DebtPayoffStrategy {
  // Avalanche: Pay off highest interest rate first
  const sortedDebts = [...debts].sort((a, b) => b.interest_rate - a.interest_rate);
  return simulateDebtStrategy(sortedDebts, extraPayment, 'avalanche');
}

function simulateDebtStrategy(
  sortedDebts: Debt[],
  extraPayment: number,
  strategy: 'snowball' | 'avalanche'
): DebtPayoffStrategy {
  const schedule: DebtPayoffStrategy['schedule'] = [];
  const debtBalances = sortedDebts.map(d => ({
    id: d.id,
    name: d.name,
    balance: d.current_balance,
    rate: d.interest_rate,
    minPayment: d.minimum_payment,
  }));

  let month = 0;
  let totalInterestPaid = 0;
  const maxMonths = 600;

  while (debtBalances.some(d => d.balance > 0) && month < maxMonths) {
    month++;
    let remainingExtra = extraPayment;

    const monthDebts = debtBalances.map(debt => {
      if (debt.balance <= 0) {
        return { id: debt.id, name: debt.name, balance: 0, payment: 0 };
      }

      // Calculate minimum payment
      const monthlyRate = debt.rate / 12;
      const interest = debt.balance * monthlyRate;
      totalInterestPaid += interest;

      // Allocate extra payment to first non-zero debt
      const extraForThisDebt = remainingExtra > 0 && debtBalances.findIndex(d => d.balance > 0) === debtBalances.indexOf(debt)
        ? remainingExtra
        : 0;
      
      const totalPayment = debt.minPayment + extraForThisDebt;
      remainingExtra = Math.max(0, remainingExtra - extraForThisDebt);

      const principalPaid = Math.max(0, Math.min(totalPayment - interest, debt.balance));
      debt.balance = Math.max(0, debt.balance - principalPaid);

      return {
        id: debt.id,
        name: debt.name,
        balance: debt.balance,
        payment: totalPayment,
      };
    });

    schedule.push({ month, debts: monthDebts });

    if (debtBalances.every(d => d.balance === 0)) break;
  }

  return {
    strategy,
    debts: sortedDebts,
    extra_payment: extraPayment,
    months_to_payoff: month,
    total_interest_paid: totalInterestPaid,
    schedule,
  };
}

export function compareStrategies(debts: Debt[], extraPayment: number = 0): {
  snowball: DebtPayoffStrategy;
  avalanche: DebtPayoffStrategy;
  recommendation: 'snowball' | 'avalanche';
  savings: number;
} {
  const snowball = simulateSnowballStrategy(debts, extraPayment);
  const avalanche = simulateAvalancheStrategy(debts, extraPayment);

  const savings = snowball.total_interest_paid - avalanche.total_interest_paid;
  const recommendation = savings > 0 ? 'avalanche' : 'snowball';

  return {
    snowball,
    avalanche,
    recommendation,
    savings: Math.abs(savings),
  };
}
