class Attrib
{
	constructor(name, count, offset)
	{
		this.name = name
		this.count = count
		this.offset = offset
		this.location = null
	}
	setupLocation(program)
	{
		this.location = gl.getAttribLocation(program, this.name)
	}
}

class Uniform
{
	constructor(func, name)
	{
		this.func = func
		this.name = name
		this.location = 0
	}

	set(args)
	{
		switch(this.func)
		{
			case 'uniform2f':
				gl.uniform2f(this.location, ...args)
				break
			case 'uniform1i':
				gl.uniform1i(this.location, args)
				break
			case 'uniformMatrix4fv':
				gl.uniformMatrix4fv(this.location, ...args)
				break
		}
	}

	setupLocation(program)
	{
		this.location = gl.getUniformLocation(program, this.name)
	}
}

class Program
{
	constructor(vshader, fshader, valuesPerVertex, bytesPerValue, attribs, uniforms)
	{
		this.valuesPerVertex = valuesPerVertex
		this.bytesPerValue = bytesPerValue
		this.bytesPerVertex = valuesPerVertex*bytesPerValue
		this.attribs = attribs
		this.uniforms = uniforms

		this.ID = gl.createProgram()
		gl.attachShader(this.ID, vshader)
		gl.attachShader(this.ID, fshader)
		gl.linkProgram(this.ID)

		this.attribs.forEach(attrib =>
		{
			attrib.setupLocation(this.ID)
			gl.enableVertexAttribArray(attrib.location)
		})

		this.uniforms.forEach(uniform =>
		{
			uniform.setupLocation(this.ID)
		})
	}

	setAttribs()
	{
		gl.useProgram(this.ID)
		this.attribs.forEach(attrib =>
		{
			gl.vertexAttribPointer(
				attrib.location,
				attrib.count,
				gl.FLOAT,
				false,
				this.bytesPerVertex,
				attrib.offset
			)
		})
	}

	setUniform(name, args)
	{
		gl.useProgram(this.ID)
		this.uniforms.forEach(uniform =>
		{
			if(uniform.name == name) uniform.set(args)
		})
	}
}

function createShader(type, source)
{
	const shader = gl.createShader(type)
	gl.shaderSource(shader, source)
	gl.compileShader(shader)
	return shader
}

function bindArrayBuffer(buffer) {
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
}

function bindElementBuffer(buffer) {
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer)
}

function fillVertexBuffer(sourceData) {
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sourceData), gl.STATIC_DRAW)
}

function fillIndexBuffer(sourceData) {
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(sourceData), gl.STATIC_DRAW)
}

function drawBuffer(drawMode, count, usesIndices)
{
	if(usesIndices)
		gl.drawElements(drawMode, count, gl.UNSIGNED_SHORT, 0)
	else
		gl.drawArrays(drawMode, 0, count)
}