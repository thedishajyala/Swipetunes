"use client";
import { useState } from 'react';

export default function AdminPage() {
    const [status, setStatus] = useState('Idle');
    const [logs, setLogs] = useState([]);

    const handleSync = async () => {
        setStatus('Syncing...');
        setLogs(prev => [...prev, 'Starting sync...']);

        try {
            const res = await fetch('/api/sync-tracks');
            const data = await res.json();

            if (res.ok) {
                setStatus('Success');
                setLogs(prev => [...prev, `Success: ${data.message}. Count: ${data.count}`]);
            } else {
                setStatus('Error');
                setLogs(prev => [...prev, `Error: ${data.error}`]);
            }
        } catch (err) {
            setStatus('Failed');
            setLogs(prev => [...prev, `Request Failed: ${err.message}`]);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-8 font-sans">
            <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                <h2 className="text-xl font-semibold mb-4">Database Management</h2>

                <div className="flex items-center gap-4">
                    <button
                        onClick={handleSync}
                        disabled={status === 'Syncing...'}
                        className="px-6 py-3 bg-green-500 rounded-lg font-bold hover:bg-green-400 disabled:opacity-50 transition-colors"
                    >
                        {status === 'Syncing...' ? 'Syncing...' : 'Sync Top 50 Global'}
                    </button>

                    <span className={`font-mono ${status === 'Success' ? 'text-green-400' : status === 'Error' ? 'text-red-400' : 'text-gray-400'}`}>
                        Status: {status}
                    </span>
                </div>

                <div className="mt-8 bg-black p-4 rounded-lg font-mono text-sm text-gray-300 h-64 overflow-y-auto border border-gray-800">
                    {logs.length === 0 ? (
                        <span className="text-gray-600">// Logs will appear here</span>
                    ) : (
                        logs.map((log, i) => <div key={i}>{log}</div>)
                    )}
                </div>
            </div>
        </div>
    );
}
