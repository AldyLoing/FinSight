import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">
            Fin<span className="text-blue-600">Sight</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Advanced Personal Finance Intelligence System
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/auth/login"
              className="px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold border-2 border-blue-600"
            >
              Sign In
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">
              Smart Insights
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              AI-powered analysis detects spending anomalies, trends, and opportunities
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <div className="text-3xl mb-4">🎯</div>
            <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">
              Goal Tracking
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Track savings goals with intelligent progress simulation and recommendations
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <div className="text-3xl mb-4">💳</div>
            <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">
              Debt Management
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Snowball & avalanche strategies with interest-aware calculations
            </p>
          </div>
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Key Features
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg">
              <p className="font-semibold">Multi-Account</p>
            </div>
            <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg">
              <p className="font-semibold">Budget Tracking</p>
            </div>
            <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg">
              <p className="font-semibold">Cashflow Forecast</p>
            </div>
            <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg">
              <p className="font-semibold">AI Insights</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
