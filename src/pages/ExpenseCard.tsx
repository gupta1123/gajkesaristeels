// components/ExpenseCard.tsx
import React from 'react';
import './ExpenseCard.css';

interface Expense {
  id: string;
  date: string;
  amount: number | null;
  status: string;
  category: string;
  subcategory?: string;
  description: string;
}

interface ExpenseCardProps {
  employeeName: string;
  expenses: Expense[];
  onApprove: (expenseId: string) => void;
  onReject: (expenseId: string) => void;
}

const ExpenseCard: React.FC<ExpenseCardProps> = ({ employeeName, expenses, onApprove, onReject }) => {
  const totalExpense = expenses.reduce((acc, expense) => acc + (expense.amount ?? 0), 0);
  const approvedExpense = expenses.filter(e => e.status === 'Approved').reduce((acc, expense) => acc + (expense.amount ?? 0), 0);
  const rejectedExpense = expenses.filter(e => e.status === 'Rejected').reduce((acc, expense) => acc + (expense.amount ?? 0), 0);
  const pendingExpense = expenses.filter(e => e.status === 'Pending').reduce((acc, expense) => acc + (expense.amount ?? 0), 0);

  const categoryIcons: { [key: string]: string } = {
    Food: '<i class="fas fa-utensils expense-icon food"></i>',
    Travel: '<i class="fas fa-car expense-icon travel"></i>',
    Accommodation: '<i class="fas fa-bed expense-icon accommodation"></i>',
    Others: '<i class="fas fa-ellipsis-h expense-icon others"></i>',
    Entertainment: '<i class="fas fa-film expense-icon others"></i>',
  };

  return (
    <div className="expense-card">
      <div className="employee-name">{employeeName}</div>
      <div className="expense-summary">
        <div className="summary-item">
          <span className="summary-title">Total Expense</span>
          <span id="total-expense" className="summary-value">₹{totalExpense.toFixed(2)}</span>
        </div>
        <div className="summary-item">
          <span className="summary-title">Approved</span>
          <span id="approved-expense" className="summary-value">₹{approvedExpense.toFixed(2)}</span>
        </div>
        <div className="summary-item">
          <span className="summary-title">Rejected</span>
          <span id="rejected-expense" className="summary-value">₹{rejectedExpense.toFixed(2)}</span>
        </div>
        <div className="summary-item">
          <span className="summary-title">Pending</span>
          <span id="pending-expense" className="summary-value">₹{pendingExpense.toFixed(2)}</span>
        </div>
      </div>
      <div className="expense-list">
        <div className="expense-list-header">
          <h3>Recent Expenses</h3>
          <button id="toggle-more" className="toggle-more">Show More</button>
        </div>
        <ul id="expense-list">
          {expenses.slice(0, 3).map((expense, index) => (
            <li key={index} className="expense-item">
              <div className="expense-details">
                <div className="expense-category">
                  <span dangerouslySetInnerHTML={{ __html: categoryIcons[expense.category] }} />
                  {expense.category}{expense.subcategory ? ' - ' + expense.subcategory : ''}
                  <span className="info-button"><i className="fas fa-info-circle"></i>
                    <div className="expense-description">{expense.description}</div>
                  </span>
                </div>
                <div className="expense-date">{expense.date}</div>
              </div>
              <div>
                <div className={`expense-status ${expense.status?.toLowerCase() || 'unknown'}`}>{expense.status || 'Unknown'}</div>
                <div className="expense-amount">₹{(expense.amount ?? 0).toFixed(2)}</div>
              </div>
              <div className="expense-actions">
                <button className="approve" onClick={() => onApprove(expense.id)}><i className="fas fa-check"></i></button>
                <button className="reject" onClick={() => onReject(expense.id)}><i className="fas fa-times"></i></button>
              </div>
            </li>
          ))}
        </ul>
        <div className="bulk-actions">
          <button className="bulk-action-btn approve" onClick={() => expenses.forEach(expense => onApprove(expense.id))}>Approve All</button>
          <button className="bulk-action-btn reject" onClick={() => expenses.forEach(expense => onReject(expense.id))}>Reject All</button>
        </div>
      </div>
    </div>
  );
};

export default ExpenseCard;
