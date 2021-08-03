let vertexShaderSource = `
precision mediump float;

uniform mat4 uMatrix;
uniform vec2 uResolution;

attribute vec2 aPosition;
attribute vec2 aTexCoord;
attribute float aLightValue;

varying vec2 vTexCoord;
varying vec2 vResolution;
varying float vLightValue;

void main()
{
	vec2 translation = vec2(uMatrix[3][0], uMatrix[3][1]);
	vec2 scale = vec2(uMatrix[0][0], uMatrix[1][1]);

	vec2 pos0 = (aPosition - uResolution / 2.0 + translation)
		 * scale
		 + (uResolution / 2.0);

	vec2 pos1 = pos0.xy / uResolution.xy;
	vec2 pos2 = (pos1.xy * 2.0) - 1.0;
	gl_Position = vec4(pos2.x, -pos2.y, 1.0, 1.0);

	vTexCoord = aTexCoord;
	vResolution = uResolution;
	vLightValue = aLightValue;
}`;

let fragmentShaderSource = `
precision mediump float;

uniform sampler2D uTexture;
uniform int uTextureSize;

varying vec2 vTexCoord;
varying vec2 vResolution;
varying float vLightValue;

void main()
{
	vec2 texCoord = vec2(
		vTexCoord.x / float(uTextureSize),
		vTexCoord.y / float(uTextureSize)
	);
	vec4 texColor = texture2D(uTexture, texCoord);
	gl_FragColor = vec4(vLightValue * texColor.xyz, texColor.a);
}`;