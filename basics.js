function v2(x, y)
{
	this.x = x;
	this.y = y;
}

function pyth(c1, c2) {
	return Math.sqrt(Math.pow(c1,2) + Math.pow(c2,2));
}

function flattenXY(coords, width) {
	return(coords.y * width + coords.x);
}

function accessArrayAs2D(array, coords, width) {
	return array[flattenXY(coords, width)];
}

function log(...msg) {
	console.log(...msg);
}

function strlog(...msg) {
	log(JSON.stringify(...msg));
}

function deepCopy(source) {
	return JSON.parse(JSON.stringify(source));
}

function fillArray(array, value)
{
	for(let i = 0;
		i < array.length;
		i++)
	{
		array[i] = value;
	}
}

const floatSize = Float32Array.BYTES_PER_ELEMENT;
const int32size = Int32Array.BYTES_PER_ELEMENT;