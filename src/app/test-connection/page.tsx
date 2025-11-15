import { createClient } from '@/lib/supabase/server'

/**
 * Test page to verify Supabase connection
 * Visit /test-connection to check if database is accessible
 */
export default async function TestConnectionPage() {
  let connectionStatus = 'Unknown'
  let error = null
  let tables = []

  try {
    const supabase = await createClient()
    
    // Try to query the profiles table
    const { data, error: queryError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .limit(5)

    if (queryError) {
      connectionStatus = 'Error'
      error = queryError.message
    } else {
      connectionStatus = 'Connected ✅'
      tables = data || []
    }
  } catch (err) {
    connectionStatus = 'Failed ❌'
    error = err instanceof Error ? err.message : 'Unknown error'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Supabase Connection Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Connection Status:</h2>
            <p className="text-2xl mt-2">{connectionStatus}</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <h3 className="font-semibold text-red-800">Error:</h3>
              <pre className="mt-2 text-sm text-red-600 whitespace-pre-wrap">{error}</pre>
            </div>
          )}

          <div>
            <h2 className="text-lg font-semibold">Environment Variables:</h2>
            <div className="mt-2 space-y-1 text-sm">
              <p>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</p>
              <p>Anon Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</p>
            </div>
          </div>

          {tables.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold">Sample Profiles ({tables.length}):</h2>
              <div className="mt-2 space-y-2">
                {tables.map((profile: any) => (
                  <div key={profile.id} className="bg-gray-50 p-3 rounded text-sm">
                    <p><strong>Email:</strong> {profile.email}</p>
                    <p><strong>Role:</strong> {profile.role}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded p-4">
          <h3 className="font-semibold text-blue-900">Next Steps:</h3>
          <ul className="mt-2 space-y-1 text-sm text-blue-800 list-disc list-inside">
            <li>Go to <a href="/signup" className="underline">/signup</a> to create an account</li>
            <li>Then go to <a href="/signin" className="underline">/signin</a> to sign in</li>
            <li>Delete this test page before deploying to production</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

