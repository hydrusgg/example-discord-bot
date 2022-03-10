const { Client } = require('discord.js')
const rtc = require('./rtc')
const api = require('./api')

const queue = []
const bot = new Client({ intents: [] })
bot.login(process.env.DISCORD_TOKEN).catch(reason => {
  console.error('Discord Bot failed: '+reason)
  process.exit(1)
})

rtc.on('EXECUTE_COMMAND', (command) => {
  queue.push(command)
  work()
})

rtc.on('SEND_EMBED', async ({ to, embed }) => {
  try {
    const user = await bot.users.fetch(to)
    await user.send({ embeds: [embed] })
  } catch (ex) {}
})

rtc.on('EXECUTE_COMMANDS', (commands) => {
  queue.push(...commands)
  work()
})

const commands = {
  async addrole(member, roleId) {
    const role = await member.guild.roles.fetch(roleId)
    await member.roles.add(role, 'Hydrus')
  },
  async delrole(member, roleId) {
    const role = await member.guild.roles.fetch(roleId)
    await member.roles.remove(role, 'Hydrus')
  },
  async ban(member) {
    await member.ban()
  },
}

async function work() {
  if (queue.working) {
    return
  }

  queue.working = true

  let data
  while (data = queue.shift()) {
    try {
      const [name, userId, ...args] = data.command.split(' ')

      const guild = await bot.guilds.fetch(process.env.GUILD_ID)
      const member = await guild.members.fetch(userId)

      if (name in commands) {
        console.log(`Executing: ${data.command} #${data.id}`)
        await commands[name](member, ...args)
      } else {
        throw new Error(`Command ${name} not found`)
      }

      await api.patch('/commands/'+data.id, { status: 'done', message: 'OK' }).catch(err => {
        console.error('Error at command (done) update, this may cause major issues.')
        console.error(`Command: ${data.id} (${err.message})`)
      })
    } catch (error) {
      console.error(error)
      await api.patch('/commands/'+data.id, {
        status: 'failed',
        message: error.message
      }).catch(err => {
        console.error('Error at command (failed) update, this may cause major issues.')
        console.error(`Command: ${data.id} (${err.message})`)
      })
    }
  }

  delete queue.working
}