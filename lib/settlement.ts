interface PlayerBalance {
    playerId: string;
    balance: number;
}

interface Transfer {
    payerId: string;
    receiverId: string;
    amount: number;
}

export function calculateSettlements(balances: PlayerBalance[]): Transfer[] {
    // Filter out zero balances and sort
    // Debtors: negative balance, sorted by magnitude (most negative first)
    const debtors = balances
        .filter(p => p.balance < -0.01)
        .sort((a, b) => a.balance - b.balance);

    // Creditors: positive balance, sorted by magnitude (most positive first)
    const creditors = balances
        .filter(p => p.balance > 0.01)
        .sort((a, b) => b.balance - a.balance);

    const transfers: Transfer[] = [];

    let i = 0; // debtor index
    let j = 0; // creditor index

    while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];

        // The amount to transfer is the minimum of what the debtor owes and what the creditor is owed
        const amount = Math.min(Math.abs(debtor.balance), creditor.balance);

        // Round to 2 decimals to avoid floating point issues
        const roundedAmount = Math.round(amount * 100) / 100;

        if (roundedAmount > 0) {
            transfers.push({
                payerId: debtor.playerId,
                receiverId: creditor.playerId,
                amount: roundedAmount,
            });
        }

        // Update balances
        debtor.balance += amount;
        creditor.balance -= amount;

        // Move to next person if their balance is settled (close to zero)
        if (Math.abs(debtor.balance) < 0.01) i++;
        if (creditor.balance < 0.01) j++;
    }

    return transfers;
}
