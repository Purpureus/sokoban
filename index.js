const express = require('express')
const app = express()
const path = require('path')

app.use(express.static(path.join(__dirname, 'client')))

const PORT = 8002;
app.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`)
});