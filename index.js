const io = require('socket.io-client')
const fs = require('fs')
const a = require('express')()

a.get('/',(b,c)=>c.send('a'))
a.listen(9373)

if (!fs.existsSync('./repls.json')) fs.writeFileSync('./repls.json', JSON.stringify([], null, 2))

const repls = require('./repls.json')
const axios = require('axios')

function add(url) {
    repls.push(url)
    fs.writeFileSync('./repls.json', JSON.stringify(repls, null, 2))
}

function remove(url) {
    repls.splice(repls.indexOf(url), 1)
    fs.writeFileSync('./repls.json', JSON.stringify(repls, null, 2))
}

const socket = io('wss://ping-hub.1nchh.repl.co', {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax : 5000,
    reconnectionAttempts: Infinity
})

socket.on('connect', () => {
    console.log('connected')
    socket.send({
        init: `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
    })
})

socket.on('disconnect', () => {
    console.log('disconnected, reconnecting...')
})

socket.on('reconnect', () => {
    console.log('reconnected')
    socket.send({
        init: `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
    })
})

setInterval(() => {
    for (const repl of repls) {
        axios.get(repl).then(() => {
            console.log(`pinged ${repl}`)
        }).catch(() => {
            console.log(`failed to ping ${repl}`)
        })
    }
}, 30000)

socket.on('message', (data) => {
    console.log(data)
    const {
        m,
        url
    } = data

    if (url.includes('repl.it')) {
        if (m === 'add') {
            add(url)
        } else if (m === 'remove') {
            remove(url)
        }
    }
})
