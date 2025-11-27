/**
 * Admin system test page - for development/testing purposes
 */

import React, { useState } from 'react';
import { Shield, Database, Key, Users, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

const AdminTest: React.FC = () => {
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [isRunning, setIsRunning] = useState(false);

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    setIsRunning(true);
    try {
      const result = await testFn();
      setTestResults(prev => ({
        ...prev,
        [testName]: { success: true, data: result }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [testName]: { success: false, error: error.message }
      }));
    }
    setIsRunning(false);
  };

  const testDatabaseConnection = async () => {
    const { data, error } = await supabase.from('listings').select('count').limit(1);
    if (error) throw error;
    return 'Database connection successful';
  };

  const testAdminTables = async () => {
    // Test if admin tables exist by trying to select from them
    const tables = ['admin_users', 'admin_sessions', 'admin_activity_log'];
    const results = {};
    
    for (const table of tables) {
      try {
        const { error } = await (supabase as any).from(table).select('*').limit(1);
        results[table] = error ? `Error: ${error.message}` : 'Table exists';
      } catch (err) {
        results[table] = `Error: ${err.message}`;
      }
    }
    
    return results;
  };

  const testAdminFunctions = async () => {
    // Test if admin functions exist
    const functions = [
      'authenticate_admin',
      'validate_admin_session', 
      'logout_admin',
      'change_admin_password',
      'get_admin_dashboard_stats'
    ];
    
    const results = {};
    
    for (const func of functions) {
      try {
        // Try to call function with invalid params to see if it exists
        const { error } = await (supabase as any).rpc(func, {});
        results[func] = error ? 
          (error.code === '42883' ? 'Function does not exist' : 'Function exists') :
          'Function exists';
      } catch (err) {
        results[func] = `Error: ${err.message}`;
      }
    }
    
    return results;
  };

  const testDefaultAdmin = async () => {
    try {
      const result = await (supabase as any).rpc('authenticate_admin', {
        p_username: 'admin',
        p_password: 'admin'
      });
      
      return result;
    } catch (error) {
      throw new Error(`Authentication test failed: ${error.message}`);
    }
  };

  const clearResults = () => {
    setTestResults({});
  };

  const getResultBadge = (result: any) => {
    if (!result) return null;
    
    return (
      <Badge variant={result.success ? 'default' : 'destructive'}>
        {result.success ? 'PASS' : 'FAIL'}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center space-x-3 mb-8">
        <Shield className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Admin System Test</h1>
          <p className="text-gray-600">Test the admin authentication system components</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Database Connection Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5" />
                <span>Database Connection</span>
              </div>
              {getResultBadge(testResults.database)}
            </CardTitle>
            <CardDescription>
              Test basic database connectivity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => runTest('database', testDatabaseConnection)}
              disabled={isRunning}
              className="mb-4"
            >
              Test Connection
            </Button>
            
            {testResults.database && (
              <Alert variant={testResults.database.success ? 'default' : 'destructive'}>
                <AlertDescription>
                  {testResults.database.success ? 
                    testResults.database.data : 
                    testResults.database.error
                  }
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Admin Tables Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Admin Tables</span>
              </div>
              {getResultBadge(testResults.tables)}
            </CardTitle>
            <CardDescription>
              Check if admin system tables exist
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => runTest('tables', testAdminTables)}
              disabled={isRunning}
              className="mb-4"
            >
              Check Tables
            </Button>
            
            {testResults.tables && (
              <div className="space-y-2">
                {Object.entries(testResults.tables.data || {}).map(([table, status]) => (
                  <div key={table} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="font-mono text-sm">{table}</span>
                    <Badge variant={String(status).includes('Error') ? 'destructive' : 'default'}>
                      {String(status)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Admin Functions Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>Admin Functions</span>
              </div>
              {getResultBadge(testResults.functions)}
            </CardTitle>
            <CardDescription>
              Test if admin database functions are available
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => runTest('functions', testAdminFunctions)}
              disabled={isRunning}
              className="mb-4"
            >
              Test Functions
            </Button>
            
            {testResults.functions && (
              <div className="space-y-2">
                {Object.entries(testResults.functions.data || {}).map(([func, status]) => (
                  <div key={func} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="font-mono text-sm">{func}</span>
                    <Badge variant={String(status).includes('does not exist') ? 'destructive' : 'default'}>
                      {String(status)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Default Admin Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Key className="w-5 h-5" />
                <span>Default Admin Login</span>
              </div>
              {getResultBadge(testResults.defaultAdmin)}
            </CardTitle>
            <CardDescription>
              Test default admin credentials (admin/admin)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => runTest('defaultAdmin', testDefaultAdmin)}
              disabled={isRunning}
              className="mb-4"
            >
              Test Login
            </Button>
            
            {testResults.defaultAdmin && (
              <Alert variant={testResults.defaultAdmin.success ? 'default' : 'destructive'}>
                <AlertDescription>
                  {testResults.defaultAdmin.success ? (
                    <div>
                      <p className="font-medium">Login successful!</p>
                      <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                        {JSON.stringify(testResults.defaultAdmin.data, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    testResults.defaultAdmin.error
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex space-x-4">
            <Button 
              onClick={clearResults}
              variant="outline"
            >
              Clear Results
            </Button>
            <Button 
              onClick={() => window.location.href = '/admin'}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Go to Admin Panel
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminTest;
