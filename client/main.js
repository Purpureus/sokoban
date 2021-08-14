class EntitySnapshot
{
	constructor(id,tilePos,cornersUV)
	{
		this.id = id
		this.x = tilePos.x
		this.y = tilePos.y
		this.u0 = cornersUV[0].x
		this.v0 = cornersUV[0].y
		this.u1 = cornersUV[1].x
		this.v1 = cornersUV[1].y
	}
}

class Entity
{
	constructor(type, id, x, y, solid, pushable, cornersUV, timeStatic)
	{
		this.id = id
		this.type = type
		this.solid = solid
		this.timeStatic = timeStatic
		this.pushable = pushable
		this.pos = new v2(x,y)
		this.tilePos = new v2(
			x/TILE_SIZE,
			y/TILE_SIZE
		)
		this.movementAccumulator = new v2(0,0)
		this.cornersUV = cornersUV
		this.lightValue = 1
	}

	setTilePos()
	{
		this.tilePos.x = this.pos.x/TILE_SIZE
		this.tilePos.y = this.pos.y/TILE_SIZE
	}
}

function pushEntity(entityToMove, displacement, entityMap, tilemapWidth, canPush)
{
	const prevTilePos = entityToMove.tilePos
	const newTilePos = new v2(
		entityToMove.tilePos.x + displacement.x,
		entityToMove.tilePos.y + displacement.y
	)

	if(newTilePos.x < 0 || newTilePos.x > tilemapWidth-1
	|| newTilePos.y < 0 || newTilePos.y > entityMap.length/tilemapWidth-1)
		return false

	let prevTile = accessArrayAs2D(entityMap, prevTilePos, tilemapWidth)
	let newTile = accessArrayAs2D(entityMap, newTilePos, tilemapWidth)
	let moveEntity = true
	let pushNextEntity = false
	let entityPushed = null

	for(let entityIndex = 0;
		entityIndex < newTile.length;
		entityIndex++)
	{
		let entity = newTile[entityIndex]
		if(entity.solid)
		{
			if(!entity.pushable || !canPush)
			{
				moveEntity = false
				return false
			}
			pushNextEntity = true
			entityPushed = entity
		}
	}

	if(moveEntity)
	{
		if(pushNextEntity)
		{
			if(!pushEntity(entityPushed, displacement, entityMap, tilemapWidth, false))
				return false
			else
			{
				gameState.pushCount++
				updateDisplayText()
			}
		}

		if(displacement.x < 0)
			entityToMove.movementAccumulator.x = TILE_SIZE
		else if(displacement.x > 0)
			entityToMove.movementAccumulator.x = -TILE_SIZE
		else if(displacement.y < 0)
			entityToMove.movementAccumulator.y = TILE_SIZE
		else if(displacement.y > 0)
			entityToMove.movementAccumulator.y = -TILE_SIZE

		
		entityToMove.tilePos.x = newTilePos.x
		entityToMove.tilePos.y = newTilePos.y

		let entityToRemoveIndex = -1
		prevTile.forEach((entity, index) =>
		{
			if(entity.id == entityToMove.id)
				entityToRemoveIndex = index
		})
		prevTile.splice(entityToRemoveIndex, 1)
		newTile.push(entityToMove)
	}

	return true
}

function updateEntity(entity, entityMap)
{
	const SPEED = MOVEMENT_UNITS_PER_FRAME
	if(entity.movementAccumulator.x < 0)
	{
		entity.pos.x += SPEED
		entity.movementAccumulator.x += SPEED
	}
	else if(entity.movementAccumulator.x > 0)
	{
		entity.pos.x -= SPEED
		entity.movementAccumulator.x -= SPEED
	}
	else if(entity.movementAccumulator.y < 0)
	{
		entity.pos.y += SPEED
		entity.movementAccumulator.y += SPEED
	}
	else if(entity.movementAccumulator.y > 0)
	{
		entity.pos.y -= SPEED
		entity.movementAccumulator.y -= SPEED
	}

	if(entity.type == 'crate')
	{
		let isCrateOnTarget = false
		
		accessArrayAs2D(entityMap, entity.tilePos, tilemapWidth).forEach(otherEntity => {
			if(otherEntity.type == 'target')
				isCrateOnTarget = true;	
		})

		if(isCrateOnTarget)
			entity.cornersUV = deepCopy(TX_PLACED_CRATE)
		else
			entity.cornersUV = deepCopy(TX_CRATE)
	}
}

function getGameSnapshot(layers, tiles, pushCount)
{
	let gameSnapshot = {
		pushCount: pushCount,
		layers: [],
		map: []
	}
	layers.forEach((layer, index) =>
	{
		gameSnapshot.layers.push([])
		layer.forEach(entity =>
		{
			if(!entity.timeStatic)
			{
				gameSnapshot.layers[index].push(new EntitySnapshot(
					entity.id,
					entity.tilePos,
					entity.cornersUV
				))
			}
		})
	})
	tiles.forEach((tile, tileIndex) => {
		gameSnapshot.map[tileIndex] = []
		tile.forEach((entity, entityIndex) => {
			gameSnapshot.map[tileIndex][entityIndex] = entity
		})
	})

	return gameSnapshot
}

function fillEntityVertexData(target, entity)
{
	// NOTE: Formatted for our default shader (X,Y,U.V,light)
	let x = entity.pos.x
	let y = entity.pos.y
	let x0 = x
	let x1 = x + TILE_SIZE
	let y0 = y
	let y1 = y + TILE_SIZE

	let cornersUV = entity.cornersUV
	completeUV = getUVFromCorners(cornersUV[0], cornersUV[1])

	let lightValue = accessArrayAs2D(lightingMap, entity.tilePos, tilemapWidth)

	target.push(
		x0, y0, ...completeUV[0], lightValue,
		x1, y0, ...completeUV[1], lightValue,
		x0, y1, ...completeUV[2], lightValue,
		x1, y1, ...completeUV[3], lightValue
	)
}

function fillLayersVertexData(target, entityLayers)
{
	entityLayers.forEach(layer => {
		layer.forEach(entity =>	{
			fillEntityVertexData(target, entity)
		})
	})
}

function fillRectIndexData(target, count)
{
	for(let index = 0;
		index < count;
		index += 4)
	{
		target.push(
			index+0, index+1, index+2,
			index+1, index+2, index+3
		)
	}
}

function fillLightingMap()
{
	if(lightingMode == 0) return

	let lightStart = new v2(
		Math.max(playerEntity.tilePos.x -lightRange, 0),
		Math.max(playerEntity.tilePos.y -lightRange, 0)
	)
	let lightEnd = new v2(
		Math.min(playerEntity.tilePos.x +lightRange +1, tilemapWidth),
		Math.min(playerEntity.tilePos.y +lightRange +1, tilemapHeight)
	)

	for(let y = lightStart.y;
		y < lightEnd.y;
		y++)
	{
		for(let x = lightStart.x;
			x < lightEnd.x;
			x++)
		{
			let lightValue = pyth(
				playerEntity.tilePos.x - x,
				playerEntity.tilePos.y - y
			) / lightRange
			
			if(lightingMode == 2)
			{
				lightValue = (lightValue < 0.8)
					? lightIntensity : 0
			}
			else
			{
				lightValue = Math.max(Math.min(lightValue, 1), 0)
				lightValue = 1 - lightValue*lightValue
				lightValue *= lightIntensity
			}

			lightingMap[flattenXY(new v2(x,y), tilemapWidth)] += lightValue
		}
	}
}

function setLightingMode(newMode)
{
	lightingMode = newMode
	switch(lightingMode)
	{
		case 0:
			defaultLighting = 1
			lightIntensity = 0
			break
		case 1:
			defaultLighting = 0.6
			lightIntensity = 0.4
			break
		case 2:
			defaultLighting = 0.7
			lightIntensity = 0.3
			break
	}
	fillArray(lightingMap, defaultLighting)
	fillLightingMap()
}

function updateDisplayText()
{
	gameStatusString = ``
	gameStatusString = gameStatusString.concat(`<b>Moves:</b> ${gameState.moveCount}`)
	gameStatusString = gameStatusString.concat(` · <b>Pushes:</b> ${gameState.pushCount}`)
	gameStatusString = gameStatusString.concat(
		` · <b>Level:</b> ${gameState.currentLevel+1} / ${levels.length}`
	)

	gameStatusDisplay.innerHTML = gameStatusString
}

function loadTilemap(tilemap)
{
	entityMap = []

	for(let i = 0; i < TILEMAP_DIM*TILEMAP_DIM; i++) {
		entityMap.push(new Array())
	}

	playerEntity = new Entity()
	entityLayers = [[],	[], []]
	entityIdCount = 0

	// Generate world entities
	for(let tilemapIndex = 0;
		tilemapIndex < TILEMAP_DIM*TILEMAP_DIM;
		tilemapIndex++)
	{
		let x = TILE_SIZE * (tilemapIndex % tilemapWidth)
		let y = TILE_SIZE * (Math.floor(tilemapIndex / tilemapWidth))

		for(let tileIndex = 0;
			tileIndex < tilemap[tilemapIndex].length;
			tileIndex++)
		{
			let tileType = tilemap[tilemapIndex][tileIndex]

			let layer = 0
			let params = {
				type: 'none',
				solid: false,
				pushable: false,
				texture: TX_WALL_0,
				timeStatic: true
			}
			
			switch(tileType)
			{
				case 1:
					layer = 2
					params.type = 'wall'
					params.solid = true
					params.pushable = false
					let wallTextureNum = Math.floor(Math.random()*4)
					let wallTexture = null
					switch(wallTextureNum)
					{
						case 0: wallTexture = TX_WALL_0; break
						case 1: wallTexture = TX_WALL_1; break
						case 2: wallTexture = TX_WALL_2; break
						case 3: wallTexture = TX_WALL_3; break
					}
					params.texture = wallTexture
					params.timeStatic = true
					break
				case 2:
					layer = 2
					params.type = 'crate'
					params.solid = true
					params.pushable = true
					params.texture = TX_CRATE
					params.timeStatic = false
					break
				case 3:
					layer = 2
					params.type = 'char'
					params.solid = false
					params.pushable = false
					params.texture = TX_CHAR_LEFT
					params.timeStatic = false
					break
				case 4:
					layer = 1
					params.type = 'target'
					params.solid = false
					params.pushable = false
					params.texture = TX_CRATE_TARGET
					params.timeStatic = true
					break
			}

			if(params.type != 'none')
			{
				let newEntity = new Entity(
					params.type,
					entityIdCount,
					x, y,
					params.solid,
					params.pushable,
					params.texture,
					params.timeStatic
				)
				entityIdCount++

				entityLayers[layer].push(newEntity)
				entityMap[tilemapIndex].push(newEntity)

				if(params.type == 'char')
					playerEntity = newEntity
			}
			else
				entityMap[tilemapIndex].push(new Array())
		}

		let dirtTextureNum = Math.floor(Math.random()*4)
		let dirtTexture = null
		switch(dirtTextureNum)
		{
			case 0: dirtTexture = TX_DIRT_0; break
			case 1: dirtTexture = TX_DIRT_1; break
			case 2: dirtTexture = TX_DIRT_2; break
			case 3: dirtTexture = TX_DIRT_3; break
		}

		entityLayers[0].push(new Entity(
			'dirt', entityIdCount, x, y, false, false, dirtTexture, true
		))
		entityIdCount++
	}
	gameState.moveCount = 0
	gameState.pushCount = 0
	updateDisplayText()

	history = []
	history.push(getGameSnapshot(entityLayers, entityMap, gameState.pushCount))

	fillArray(lightingMap, defaultLighting)
	fillLightingMap()
}

let isOnMobile = false

let gameElement = document.getElementById('sokoban')

let gameCanvas = document.getElementById('game-canvas')
let gameStatusDisplay = document.getElementById('game-status')
let gameHelpDisplay = document.getElementById('game-help')
let levelCompleteDisplay = document.getElementById('level-complete-message')
let levelCompleteMessage = "Level completed! Press N to proceed."
let gameCompleteMessage = "All levels completed!"

// Simulate N key
bindClickStart(gameCanvas, () => rawInput[KEY_N] = 1)
bindClickEnd(gameCanvas, () => rawInput[KEY_N] = 0)

let displayHeight = 100
const TILEMAP_DIM = 10
const TILE_SIZE = 16
gameCanvas.width = TILEMAP_DIM*TILE_SIZE
gameCanvas.height = TILEMAP_DIM*TILE_SIZE

function calculateCanvasSize()
{
	let windowWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth
	isOnMobile = windowWidth <= 768 ? true : false
	levelCompleteMessage = isOnMobile
		? "Level completed! Tap to proceed."
		: "Level completed! Press N to proceed."

	let canvasSizeMultiplier = Math.floor(Math.min(Math.min(
		gameElement.getBoundingClientRect().width / gameCanvas.width,
		gameElement.getBoundingClientRect().height-displayHeight / gameCanvas.height),
		3
	))
	gameCanvas.style.width  = `${canvasSizeMultiplier* gameCanvas.width}px`
	gameCanvas.style.height = `${canvasSizeMultiplier* gameCanvas.height}px`
}
window.addEventListener('resize', calculateCanvasSize)
calculateCanvasSize()

const gl = gameCanvas.getContext('webgl', {	premultipliedAlpha: false })
if(!gl) throw new Error('WebGL not supported in your browser.')

let txAtlas = loadTexture(`assets/tx_atlas.png`)

let playerWon = false
const MOVEMENT_UNITS_PER_FRAME = 16

const mat4 = glMatrix.mat4
let defaultMatrix = mat4.create()

gl.enable(gl.BLEND)
gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

let CHEATING_MODE = false

let settings = {
	cameraZoom: new v2(1, 1),
	resolution: [gameCanvas.width, gameCanvas.height],
	pause: false
}
let gameState = {
	moveCount: 0,
	pushCount: 0,
	currentLevel: 0,
}
updateDisplayText()

let lightRange = 6
let defaultLighting = 0
let lightIntensity = 1
let lightingMode = 0
let lightingMap = []
for(let i = 0;
	i < TILEMAP_DIM*TILEMAP_DIM;
	i++) {
	lightingMap.push(defaultLighting)
}

let tilemapWidth = TILEMAP_DIM
let tilemapHeight = TILEMAP_DIM
let tilemap = levels[0]

let entityMap = []
let playerEntity = null
let entityLayers = [[],	[], []]
let entityIdCount = 0
let history = []
loadTilemap(tilemap)

setLightingMode(1)

const vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource)
const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource)

let attribs = []
attribs.push(new Attrib('aPosition', 2, 0))
attribs.push(new Attrib('aTexCoord', 2, 2*floatSize))
attribs.push(new Attrib('aLightValue', 1, 4*floatSize))

let uniforms = []
uniforms.push(new Uniform('uniform2f', 'uResolution'))
uniforms.push(new Uniform('uniformMatrix4fv', 'uMatrix'))
uniforms.push(new Uniform('uniform1i', 'uTexture'))
uniforms.push(new Uniform('uniform1i', 'uTextureSize'))

const shaderProgram = new Program(
	vertexShader,
	fragmentShader,
	5,
	floatSize,
	attribs,
	uniforms
)

const entityBuffer = gl.createBuffer()
const entityIndexBuffer = gl.createBuffer()
bindArrayBuffer(entityBuffer)
bindElementBuffer(entityIndexBuffer)

let entityVertexData = []
let entityIndexData = []

gl.activeTexture(gl.TEXTURE0)
gl.bindTexture(gl.TEXTURE_2D, txAtlas)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
gl.bindTexture(gl.TEXTURE_2D, null)

shaderProgram.setAttribs()
shaderProgram.setUniform('uResolution', settings.resolution)
shaderProgram.setUniform('uTexture', 0)
shaderProgram.setUniform('uMatrix', [false, defaultMatrix])
shaderProgram.setUniform('uTextureSize', TX_ATLAS_DIM)

function update()
{
	requestAnimationFrame(update)
	handleInput()

	if(!settings.pause)
	{
		if(!playerEntity.movementAccumulator.x &&
		   !playerEntity.movementAccumulator.y)
		{
			let playerDisplacement = new v2(0,0)

			if(isPressed(input[KEY_W])) playerDisplacement.y -= 1
			if(isPressed(input[KEY_S])) playerDisplacement.y += 1
			if(isPressed(input[KEY_A])) playerDisplacement.x -= 1
			if(isPressed(input[KEY_D])) playerDisplacement.x += 1

			if(playerDisplacement.x && playerDisplacement.y)
			{
				playerDisplacement.y = 0
				playerDisplacement.x = 0
			}

			if(playerDisplacement.x || playerDisplacement.y)
			{
				if(playerDisplacement.x)
					playerEntity.cornersUV = deepCopy(playerDisplacement.x < 0
						? TX_CHAR_LEFT : TX_CHAR_RIGHT)

				if(pushEntity(playerEntity, playerDisplacement,
					entityMap, tilemapWidth, true))
				{
					history.push(getGameSnapshot(entityLayers, entityMap, gameState.pushCount))
					gameState.moveCount++
					updateDisplayText()
				}
				
				fillArray(lightingMap, defaultLighting)
				fillLightingMap()
			}
		}
	}

	if(isPressed(input[KEY_Z]))
	{
		if(history.length > 1)
		{
			let lastGameSnapshot = history[history.length-2]
			lastGameSnapshot.layers.forEach(savedLayer =>
			{
				savedLayer.forEach(savedEntity =>
				{
					const savedEntityId = savedEntity.id
					entityLayers.forEach(layer =>
					{
						layer.forEach(entity =>
						{
							if(savedEntityId == entity.id)
							{
								entity.tilePos.x = savedEntity.x
								entity.tilePos.y = savedEntity.y
								entity.pos.x = entity.tilePos.x*TILE_SIZE
								entity.pos.y = entity.tilePos.y*TILE_SIZE
								entity.cornersUV[0].x = savedEntity.u0
								entity.cornersUV[0].y = savedEntity.v0
								entity.cornersUV[1].x = savedEntity.u1
								entity.cornersUV[1].y = savedEntity.v1
								entity.movementAccumulator.x = 0
								entity.movementAccumulator.y = 0
							}
						})
					})
				})
			})
			lastGameSnapshot.map.forEach((savedTile, savedTileIndex) =>
			{
				entityMap[savedTileIndex] = []
				savedTile.forEach((savedEntity, savedEntityIndex) =>
				{
					entityMap[savedTileIndex][savedEntityIndex] = savedEntity
				})
			})
			gameState.moveCount--
			gameState.pushCount = lastGameSnapshot.pushCount
			updateDisplayText()

			history.pop()

			fillArray(lightingMap, defaultLighting)
			fillLightingMap()
		}
	}

	if(isPressed(input[KEY_L])) {
		setLightingMode(lightingMode < 2
			? lightingMode+1
			: 0)
	}

	if(isPressed(input[KEY_R])) {
		tilemap = levels[gameState.currentLevel]
		loadTilemap(tilemap)
	}

	playerWon = true

	entityMap.forEach(tile =>
	{
		let hasCrate = false
		let hasTarget = false
		tile.forEach(entity =>
		{
			switch(entity.type)
			{
				case 'crate':
					hasCrate = true; break
				case 'target':
					hasTarget = true; break
			}
		})
		if(hasCrate != hasTarget) {
			playerWon = false
		}
	})

	if(playerWon) {
		levelCompleteDisplay.classList.add('enabled')
		settings.pause = true
		updateDisplayText()

		if(gameState.currentLevel < levels.length-1) {
			levelCompleteDisplay.innerText = levelCompleteMessage
		}
		else {
			levelCompleteDisplay.innerText = gameCompleteMessage
		}

		if(isPressed(input[KEY_N])) {
			if(gameState.currentLevel < levels.length-1) {
				gameState.currentLevel += 1
				tilemap = levels[gameState.currentLevel]
				loadTilemap(tilemap)
			}
		}
	}
	else if(CHEATING_MODE && isPressed(input[KEY_N])) {
		if(gameState.currentLevel < levels.length-1) {
			gameState.currentLevel += 1
			tilemap = levels[gameState.currentLevel]
			loadTilemap(tilemap)
		}
	}
	else {
		levelCompleteDisplay.classList.remove('enabled')
		settings.pause = false
		updateDisplayText()
	}

	entityLayers.forEach(layer => layer.forEach(entity =>
		updateEntity(entity, entityMap)
	))

	Object.assign(oldRawInput, rawInput)

	// -- RENDERING -- //
	entityVertexData = []
	fillLayersVertexData(entityVertexData, entityLayers)
	bindArrayBuffer(entityBuffer)
	fillVertexBuffer(entityVertexData)

	entityIndexData = []
	fillRectIndexData(entityIndexData,
		entityVertexData.length / shaderProgram.valuesPerVertex)
	bindElementBuffer(entityIndexBuffer)
	fillIndexBuffer(entityIndexData)

	shaderProgram.setUniform('uMatrix', [false, defaultMatrix])
	bindArrayBuffer(entityBuffer)
	bindElementBuffer(entityIndexBuffer)
	shaderProgram.setAttribs()
	drawBuffer(gl.TRIANGLES, entityIndexData.length, true)

	gl.flush()

	let glError = gl.getError()
	if(glError != gl.NO_ERROR) {
		gameDisplay.innerText = `WebGL error: ${glError}`
	}
}

update()