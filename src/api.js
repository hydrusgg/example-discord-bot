import axios from 'axios'

const api = axios.create({
  baseURL: 'https://api.hydrus.gg/plugin/v1',
  headers: {
    authorization: 'Bearer '+process.env.TOKEN
  }
})

export default api

export async function getPendingCommands(page = 1) {
  const response = await api('commands/discord', {
    params: { page },
    validateStatus: _ => true,
  })

  if (response.status !== 200) {
    throw new Error(`Unexpected HTTP ${response.status} response api#getPendingCommands`)
  }

  return response.data.data
}