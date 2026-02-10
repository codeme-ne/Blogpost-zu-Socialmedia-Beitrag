import { Client, Databases, Users, Query } from 'node-appwrite'

const DB_ID = 'social_transformer'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}

// Server-side Appwrite client with API key (bypasses permissions)
function createServerClient() {
  const client = new Client()
    .setEndpoint(requireEnv('APPWRITE_ENDPOINT'))
    .setProject(requireEnv('APPWRITE_PROJECT_ID'))
    .setKey(requireEnv('APPWRITE_API_KEY'))

  return {
    client,
    databases: new Databases(client),
    users: new Users(client),
  }
}

// Verify JWT token and return user info
export async function verifyJWT(token: string): Promise<{ id: string; email: string } | null> {
  try {
    // Use a client-scoped session to verify the JWT
    const client = new Client()
      .setEndpoint(requireEnv('APPWRITE_ENDPOINT'))
      .setProject(requireEnv('APPWRITE_PROJECT_ID'))
      .setJWT(token)

    // If the JWT is valid, we can get the account info
    const { Account } = await import('node-appwrite')
    const account = new Account(client)
    const user = await account.get()

    return { id: user.$id, email: user.email }
  } catch {
    return null
  }
}

// Get user ID by email using server SDK
export async function getUserIdByEmail(email: string): Promise<string | null> {
  const { users } = createServerClient()
  try {
    const result = await users.list([Query.equal('email', [email])])
    if (result.users.length > 0) {
      return result.users[0].$id
    }
    return null
  } catch {
    return null
  }
}

// Create a new user (for webhook user creation)
export async function createUser(email: string): Promise<{ id: string } | null> {
  const { users } = createServerClient()
  try {
    // Generate a unique ID
    const { ID } = await import('node-appwrite')
    const user = await users.create(ID.unique(), email)
    return { id: user.$id }
  } catch (error) {
    console.error('Failed to create user:', error)
    return null
  }
}

// Export server databases for direct use
export function getServerDatabases() {
  return createServerClient().databases
}

export function getServerUsers() {
  return createServerClient().users
}

export { DB_ID, Query }
