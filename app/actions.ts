'use server';

import * as transactions from './actions/transactions';
import * as balances from './actions/balances';
import * as budgets from './actions/budgets';
import * as goals from './actions/goals';
import * as debts from './actions/debts';
import * as paylaters from './actions/paylaters';
import * as wishlist from './actions/wishlist';
import * as subscriptions from './actions/subscriptions';
import * as emergencyFund from './actions/emergencyFund';
import * as templates from './actions/templates';
import * as reminders from './actions/reminders';
import * as recurring from './actions/recurring';
import * as dashboard from './actions/dashboard';
import * as payments from './actions/payments';
import * as admin from './actions/admin';
import * as userActions from './actions/user';
import type { TransactionType } from '../types';
import type { PlanType, UserRole } from '@prisma/client';

// Transactions
export async function processInput(input: string) {
  return transactions.processInput(input);
}
export async function addExplicitTransaction(data: {
  type: TransactionType;
  amount: number;
  category: string;
  wallet?: string;
  method?: string;
  note?: string;
  transactionDate?: string;
  tags?: string[];
  receiptMerchant?: string;
  receiptItems?: unknown;
  receiptDate?: string;
}) {
  return transactions.addExplicitTransaction(data);
}
export async function addTransferTransaction(amount: number, fromWallet: string, toWallet: string, note?: string, tags?: string[]) {
  return transactions.addTransferTransaction(amount, fromWallet, toWallet, note, tags);
}
export async function deleteTransaction(id: string) {
  return transactions.deleteTransaction(id);
}
export async function updateTransaction(
  id: string,
  data: {
    type?: TransactionType;
    amount?: number;
    category?: string;
    wallet?: string;
    note?: string;
    transactionDate?: string;
    tags?: string[];
  }
) {
  return transactions.updateTransaction(id, data);
}

// Balances
export async function updateBalance(name: string, balance: number, id?: string) {
  return balances.updateBalance(name, balance, id);
}
export async function deleteBalance(id: string) {
  return balances.deleteBalance(id);
}
export async function restoreBalance(id: string) {
  return balances.restoreBalance(id);
}

// Budgets
export async function addBudget(categoryId: string, monthlyLimit: number) {
  return budgets.addBudget(categoryId, monthlyLimit);
}
export async function updateBudget(id: string, monthlyLimit: number) {
  return budgets.updateBudget(id, monthlyLimit);
}
export async function deleteBudget(id: string) {
  return budgets.deleteBudget(id);
}

// Goals
export async function addSavingGoal(title: string, targetAmount: number, deadline?: string) {
  return goals.addSavingGoal(title, targetAmount, deadline);
}
export async function updateSavingGoal(id: string, data: { title?: string; targetAmount?: number; currentAmount?: number; deadline?: string }) {
  return goals.updateSavingGoal(id, data);
}
export async function deleteSavingGoal(id: string) {
  return goals.deleteSavingGoal(id);
}

// Debts
export async function addDebt(data: {
  type: string;
  person: string;
  amount: number;
  tenorMonths?: number;
  interestRate?: number;
  note?: string;
}) {
  return debts.addDebt(data);
}
export async function toggleDebtSettled(id: string) {
  return debts.toggleDebtSettled(id);
}
export async function deleteDebt(id: string) {
  return debts.deleteDebt(id);
}

// Paylaters
export async function addPaylater(itemName: string, platform: string, totalAmount: number, tenorMonths: number) {
  return paylaters.addPaylater(itemName, platform, totalAmount, tenorMonths);
}
export async function payPaylaterInstallment(id: string, walletName: string) {
  return paylaters.payPaylaterInstallment(id, walletName);
}
export async function deletePaylater(id: string) {
  return paylaters.deletePaylater(id);
}

// Wishlist
export async function addWishlistItem(name: string, amount: number, url?: string) {
  return wishlist.addWishlistItem({ name, amount, url });
}
export async function markWishlistBought(id: string, walletName?: string) {
  return wishlist.markWishlistBought(id, walletName);
}
export async function deleteWishlistItem(id: string) {
  return wishlist.deleteWishlistItem(id);
}

// Subscriptions
export async function addSubscription(data: { name: string; amount: number; billingDay: number; method: string }) {
  return subscriptions.addSubscription(data);
}
export async function addRecurringTransaction(data: {
  type: string;
  amount: number;
  category: string;
  method: string;
  note?: string;
  tags?: string[];
}) {
  return subscriptions.addRecurringTransaction(data);
}
export async function toggleSubscriptionActive(id: string) {
  return subscriptions.toggleSubscriptionActive(id);
}
export async function deleteSubscription(id: string) {
  return subscriptions.deleteSubscription(id);
}

// Emergency Fund
export async function updateEmergencyFundPlan(monthlyExpense: number) {
  return emergencyFund.updateEmergencyFundPlan(monthlyExpense);
}

// Templates
export async function upsertTransactionTemplate(data: {
  id?: string;
  name: string;
  type: TransactionType;
  amount: number;
  categoryName: string;
  walletName: string;
  note?: string;
  tags?: string[];
  isFavorite?: boolean;
}) {
  return templates.upsertTransactionTemplate(data);
}
export async function useTransactionTemplate(id: string) {
  return templates.useTransactionTemplate(id);
}
export async function toggleTemplateFavorite(id: string) {
  return templates.toggleTemplateFavorite(id);
}
export async function deleteTransactionTemplate(id: string) {
  return templates.deleteTransactionTemplate(id);
}

// Reminders
export async function addReminder(data: {
  title: string;
  body: string;
  type?: string;
  channel?: string;
  dueAt?: string;
}) {
  return reminders.addReminder(data);
}
export async function completeReminder(id: string) {
  return reminders.completeReminder(id);
}
export async function deleteReminder(id: string) {
  return reminders.deleteReminder(id);
}

// Recurring rules
export async function addRecurringRule(data: {
  name: string;
  type: TransactionType;
  amount: number;
  categoryName: string;
  walletName: string;
  note?: string;
  tags?: string[];
  dayOfMonth?: number;
}) {
  return recurring.addRecurringRule(data);
}
export async function toggleRecurringRule(id: string) {
  return recurring.toggleRecurringRule(id);
}
export async function deleteRecurringRule(id: string) {
  return recurring.deleteRecurringRule(id);
}

// Dashboard
export async function getDashboardData() {
  return dashboard.getDashboardData();
}

// Payments
export async function submitPaymentRequest(data: {
  billingType: string;
  amount: number;
  paymentMethod: string;
  proofPath: string;
}) {
  return payments.submitPaymentRequest(data);
}
export async function getPaymentRequests() {
  return payments.getPaymentRequests();
}

// Admin
export async function getPendingPaymentRequests() {
  return admin.getPendingPaymentRequests();
}
export async function approvePaymentRequest(id: string) {
  return admin.approvePaymentRequest(id);
}
export async function rejectPaymentRequest(id: string, note: string) {
  return admin.rejectPaymentRequest(id, note);
}
export async function getAllUsers() {
  return admin.getAllUsers();
}
export async function updateUserPlanManually(targetUserId: string, newPlan: PlanType, days?: number) {
  return admin.updateUserPlanManually(targetUserId, newPlan, days);
}
export async function updateUserRoleManually(targetUserId: string, newRole: UserRole) {
  return admin.updateUserRoleManually(targetUserId, newRole);
}
export async function deleteUserAccountByAdmin(targetUserId: string) {
  return admin.deleteUserAccountByAdmin(targetUserId);
}
export async function updateFeedbackStatus(feedbackId: string, newStatus: string) {
  return admin.updateFeedbackStatus(feedbackId, newStatus);
}
export async function getPaymentSettings() {
  return admin.getPaymentSettings();
}
export async function updatePaymentSettings(data: {
  bca_number: string;
  bca_holder: string;
  bca_active: string;
  bni_number: string;
  bni_holder: string;
  bni_active: string;
  qris_image: string;
  qris_active: string;
}) {
  return admin.updatePaymentSettings(data);
}

// User Profile
export async function completeOnboarding(data: {
  fullName: string;
  walletName: string;
  openingBalance: number;
}) {
  return userActions.completeOnboarding(data);
}
export async function deleteUserAccountData() {
  return userActions.deleteUserAccountData();
}
export async function submitFeedback(data: { rating: number; message: string }) {
  return userActions.submitFeedback(data);
}
export async function getShortcutEndpoint() {
  return userActions.getShortcutEndpoint();
}
export async function regenerateShortcutToken() {
  return userActions.regenerateShortcutToken();
}
