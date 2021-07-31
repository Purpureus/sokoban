function isPressed(key) {
	return key == KEYSTATE_PRESS;
}
function isDown(key) {
	return key == KEYSTATE_DOWN;
}
function isReleased(key) {
	return key == KEYSTATE_RELEASE;
}
function isUp(key) {
	return key == KEYSTATE_UP;
}

function handleInput()
{	
	for(let keyIndex = 0;
		keyIndex < rawInput.length;
		keyIndex++)
	{
		let newKey = rawInput[keyIndex],
			oldKey = oldRawInput[keyIndex];

		switch(oldKey)
		{
			case 0:
			{
				input[keyIndex] = (newKey == 0)
					? KEYSTATE_UP
					: KEYSTATE_PRESS;
			} break;

			case 1:
			{
				input[keyIndex] = (newKey == 1)
					? KEYSTATE_DOWN
					: KEYSTATE_RELEASE;
			} break;
		}
	}
}

const KEYSTATE_UP = 0;
const KEYSTATE_DOWN = 1;
const KEYSTATE_RELEASE = 2;
const KEYSTATE_PRESS = 3;
const
	KEY_W = 0, KEY_A = 1, KEY_S = 2, KEY_D = 3,
	KEY_Z = 4, KEY_R = 5, KEY_L = 6, KEY_N = 7;

let rawInput    = [0,0,0,0,0,0,0,0];
let oldRawInput = [0,0,0,0,0,0,0,0];
let input       = [0,0,0,0,0,0,0,0];

document.onkeydown = e =>
{
	switch(e.key)
	{
		case 'w': case 'W': case 'ArrowUp':    rawInput[KEY_W] = 1; break;
		case 'a': case 'A': case 'ArrowLeft':  rawInput[KEY_A] = 1; break;
		case 's': case 'S': case 'ArrowDown':  rawInput[KEY_S] = 1; break;
		case 'd': case 'D': case 'ArrowRight': rawInput[KEY_D] = 1; break;
		case 'z': case 'Z': rawInput[KEY_Z] = 1; break;
		case 'r': case 'R': rawInput[KEY_R] = 1; break;
		case 'l': case 'L': rawInput[KEY_L] = 1; break;
		case 'n': case 'N': rawInput[KEY_N] = 1; break;
	};
};
document.onkeyup = e =>
{
	switch(e.key)
	{
		case 'w': case 'W': case 'ArrowUp':    rawInput[KEY_W] = 0; break;
		case 'a': case 'A': case 'ArrowLeft':  rawInput[KEY_A] = 0; break;
		case 's': case 'S': case 'ArrowDown':  rawInput[KEY_S] = 0; break;
		case 'd': case 'D': case 'ArrowRight': rawInput[KEY_D] = 0; break;
		case 'z': case 'Z': rawInput[KEY_Z] = 0; break;
		case 'r': case 'R': rawInput[KEY_R] = 0; break;
		case 'l': case 'L': rawInput[KEY_L] = 0; break;
		case 'n': case 'N': rawInput[KEY_N] = 0; break;
	};
};

let mobileButtonUp = document.getElementById('up-btn');
let mobileButtonLeft = document.getElementById('left-btn');
let mobileButtonDown = document.getElementById('down-btn');
let mobileButtonRight = document.getElementById('right-btn');
let mobileButtonLight = document.getElementById('light-btn');
let mobileButtonReset = document.getElementById('reset-btn');
let mobileButtonUndo = document.getElementById('undo-btn');

mobileButtonUp.addEventListener('touchstart', () =>
	rawInput[KEY_W] = 1
);
mobileButtonLeft.addEventListener('touchstart', () =>
	rawInput[KEY_A] = 1
);
mobileButtonDown.addEventListener('touchstart', () =>
	rawInput[KEY_S] = 1
);
mobileButtonRight.addEventListener('touchstart', () =>
	rawInput[KEY_D] = 1
);
mobileButtonLight.addEventListener('touchstart', () =>
	rawInput[KEY_L] = 1
);
mobileButtonReset.addEventListener('touchstart', () =>
	rawInput[KEY_R] = 1
);
mobileButtonUndo.addEventListener('touchstart', () =>
	rawInput[KEY_Z] = 1
);

mobileButtonUp.addEventListener('touchend', () =>
	rawInput[KEY_W] = 0
);
mobileButtonLeft.addEventListener('touchend', () =>
	rawInput[KEY_A] = 0
);
mobileButtonDown.addEventListener('touchend', () =>
	rawInput[KEY_S] = 0
);
mobileButtonRight.addEventListener('touchend', () =>
	rawInput[KEY_D] = 0
);
mobileButtonLight.addEventListener('touchend', () =>
	rawInput[KEY_L] = 0
);
mobileButtonReset.addEventListener('touchend', () =>
	rawInput[KEY_R] = 0
);
mobileButtonUndo.addEventListener('touchend', () =>
	rawInput[KEY_Z] = 0
);