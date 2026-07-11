export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">PM Tool</h1>
          {title && <h2 className="mt-2 text-lg font-semibold text-gray-800 dark:text-gray-200">{title}</h2>}
          {subtitle && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>
        <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-6">{children}</div>
      </div>
    </div>
  );
}
