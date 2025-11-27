import React, { useState } from 'react';
import { useExpenses, useDeleteExpense } from '@/hooks/useDashboardData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, Plus, FileText, Menu } from 'lucide-react';
import { ExpenseRow } from '@/components/dashboard/ExpenseRow';
import { AddExpenseDialog } from '@/components/dashboard/AddExpenseDialog';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { BusinessLayoutContextType } from '@/pages/BusinessLayout';

const BusinessExpenses = () => {
    const navigate = useNavigate();
    const { isSidebarOpen, setIsSidebarOpen } = useOutletContext<BusinessLayoutContextType>();
    const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
    const { data: expenses = [], isLoading } = useExpenses('year'); // Fetch all for the year/all time
    const { mutate: deleteExpense } = useDeleteExpense();

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-start gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden mt-1"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                        <div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="mb-2"
                                onClick={() => navigate(-1)}
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back
                            </Button>
                            <h1 className="text-3xl font-bold text-slate-900">Expenses</h1>
                            <p className="text-slate-500">Track and manage your business expenses</p>
                        </div>
                    </div>
                    <Button onClick={() => setIsAddExpenseOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Expense
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="w-5 h-5" />
                            <span>All Expenses ({expenses.length})</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center py-8">Loading expenses...</div>
                        ) : expenses.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p>No expenses recorded.</p>
                                <Button variant="link" onClick={() => setIsAddExpenseOpen(true)}>
                                    Add your first expense
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {expenses.map((expense: any) => (
                                    <ExpenseRow
                                        key={expense.id}
                                        expense={expense}
                                        onDelete={(id) => deleteExpense(id)}
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <AddExpenseDialog
                open={isAddExpenseOpen}
                onOpenChange={setIsAddExpenseOpen}
            />
        </div>
    );
};

export default BusinessExpenses;
