import { useState } from 'react';
import { Database, Play, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { runSeeding } from '../lib/seedData';

export default function SeedData() {
  const [seeding, setSeeding] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSeed = async () => {
    setSeeding(true);
    setResult(null);
    try {
      await runSeeding();
      setResult({ success: true, message: 'Database seeded successfully with 500 crimes and 25 alerts!' });
    } catch (error) {
      setResult({ success: false, message: 'Failed to seed database. Please check console for details.' });
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-xl p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4">
          <Database className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Database Seeding</h1>
        <p className="text-slate-400 mb-6">
          Click below to populate the database with sample crime data (500 records), alerts, and predictions.
        </p>

        {result && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            result.success
              ? 'bg-green-500/10 border border-green-500/50 text-green-400'
              : 'bg-red-500/10 border border-red-500/50 text-red-400'
          }`}>
            {result.success ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <p className="text-sm">{result.message}</p>
          </div>
        )}

        <button
          onClick={handleSeed}
          disabled={seeding}
          className="flex items-center justify-center gap-2 w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white font-medium rounded-lg transition-colors"
        >
          {seeding ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Seeding Database...
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Seed Database
            </>
          )}
        </button>

        <p className="mt-4 text-xs text-slate-500">
          This will add sample data for crimes, alerts, and generate initial predictions.
        </p>
      </div>
    </div>
  );
}
