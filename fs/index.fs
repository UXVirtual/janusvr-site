varying vec3 iPosition; //interpolated vertex position (note: not multiplied with model matrix, position is relative to object/model and not the room)
varying vec3 iNormal; //interpolated normal 

varying vec3 iPositionWorld; //interpolated vertex position (note: not multiplied with model matrix, position is relative to object/model and not the room)
varying vec3 iNormalWorld; //interpolated normal 
uniform vec3 iPlayerPosition; //the player's position in the room

uniform int iUseTexture0; //use texture (0 - no, 1 - yes)?
uniform sampler2D iTexture0; //sampler to use for texture0

uniform sampler2D texDiffuse;

uniform float iGlobalTime;
uniform int iUseClipPlane; //use clip plane (0 - no, 1 - yes)?  (i.e. is the room viewed through a portal)
uniform vec4 iClipPlane; //equation of clip plane (xyz are normal, w is the offset, room is on side facing normal)

const float deg2rad = 57.29;

vec3 ambientLight = vec3(0.1,0.1,0.1);	//Total acumulated ambient light for pixel
vec3 diffuseLight = vec3(0,0,0);	//Total acumulated diffuse light for pixel
vec3 specularLight = vec3(0,0,0);	//Total acumulated specular light for pixel

vec3 normal;
vec3 viewVector;

void lightingPreCalc() {
	normal = normalize(iNormalWorld);	
	viewVector = normalize(iPositionWorld-iPlayerPosition);
}

//Prototype for generated function
void applySceneLights();

// Util functions
float flicker(float offset) {
	float t = offset + (iGlobalTime * 30.0);
	return sin(t*0.2) * cos(t * 0.3) * sin(t * 0.4) ;
}

vec3 flickerPos(vec3 pos) {
	float f=  flicker( pos.x+pos.y) * 0.2;
	return pos + vec3(f,f,f);
}


/*
	Apply a point light base on the inverse square law
	
	pos:	Position of the light
	colour: Colour and intensity
	near: Size of the light source, 0 for a point light
	range: How far to apply the light, saves GPU cycles

*/
void light(vec3 pos, vec3 colour, float near, float range, float falloff) {

	vec3 lightDir = pos - iPositionWorld;
	float dist = abs(length(lightDir));
	lightDir /= dist;
	
	float tangent = dot(lightDir,normal);
	if(tangent < 0.0) return;
	
	float i = clamp(1.0 / pow(dist-near,falloff), 0.0, 1.0);
	diffuseLight += i * tangent * colour;
	
	vec3 rVector = normalize(2.0 * normal * dot(normal, lightDir) - lightDir);

	float RdotV = dot(rVector, -viewVector);
	
	if (RdotV > 0.0)
		specularLight += i * colour * pow(RdotV, 100.0) ;
}

/*
	Spot light, casts a directed cone of light from the given point in a set direction.

	pos: 	   The world position of the light
	direction:  Direction to cast the light
	outerCone:  The angle of the maximum extent of the light 
	innerCone:  Defines the fall off of light to the oute cone, setting them to the same value will result in
	 (unrealistic) a sharp edge. 5-15 degree seperation looks quite nice in most situations
*/
void spotlight(vec3 pos, vec3 direction, vec3 col, float outerCone, float innerCone, float range, float falloff){

	vec3 lightDir = normalize(pos - iPositionWorld);
	
	float theta = deg2rad * acos(dot(direction, -lightDir));
	if(theta > outerCone){	//Outside of light cone
		return;
	}

	float tangent = dot(lightDir,normal);
	if(tangent < 0.0) {
		return;
	}
	
	float dist = abs(length(pos - iPositionWorld));
	float i = 1.0 - (theta - innerCone) / (outerCone-innerCone);

	i= i / pow(dist,falloff);

	diffuseLight += clamp(i * tangent, 0.0, 1.0) * col;

	vec3 rVector = normalize(2.0 * normal * dot(normal, lightDir) - lightDir);
	float RdotV = dot(rVector, viewVector);
	
	if (RdotV > 0.0)
		specularLight += i * col * pow(RdotV, 100.0) ;

}

/* 
	Directional light source
*/
void directional(vec3 direction, vec3 colour) {
	vec3 lightDir = -normalize(direction);
	
	float tangent = dot(lightDir,normal);
	if(tangent > 0.0) {
		diffuseLight += tangent * colour;
	}

	vec3 rVector = normalize(2.0 * normal * dot(normal, lightDir) - lightDir);
	vec3 viewVector = -normalize(iPositionWorld-iPlayerPosition);
	float RdotV = dot(rVector, viewVector);
	
	if (RdotV > 0.0)
		specularLight += 0.1 * colour * pow(RdotV, 100.0) ;
}

/*
	A point light but with a flickery effect
	
*/
void torchlight(vec3 pos, vec3 colour, float near, float range, float falloff) {
	light(flickerPos(pos),colour, near, range,falloff); 
}

/* 
	Project a light point out of the players eyes
*/
void flashlight(vec3 colour) {
	
	vec4 p = gl_ModelViewProjectionMatrix * vec4(iPosition,1.0);
	
	float r = length(p.xy);
	float theta = atan(r, p.z);

	float i = 1.0 - theta * 2.0;
	
	if(i> 0.0){
		diffuseLight += (colour * i) / (p.z + 2.0);
	}
}




int g_Debug = 0;

void main()
{
	//Clip plane check
	if (iUseClipPlane == 1 && dot(iPositionWorld, iClipPlane.xyz) < iClipPlane.w) {
		discard;
	}

	normal = normalize(normal);
	
	vec4 ka = gl_FrontMaterial.ambient;
	vec4 kd = gl_FrontMaterial.diffuse;
	vec4 ks = gl_FrontMaterial.specular;
	
	if( iUseTexture0 == 1) {
		vec4 kdm = texture2D(iTexture0, gl_TexCoord[0].st);
		
		if(kdm.a > 0.1) {
			kdm.a = 1.0;
		}
		
		kd *= kdm;
	}

	if(kd.a < 0.1) {
		discard;
	}

	lightingPreCalc();
	applySceneLights();
    
	vec3 col = kd.rgb * (diffuseLight + ambientLight + ka.rgb) + (ks.rgb * specularLight);
	gl_FragColor = vec4(col,kd.a);
	
	if(g_Debug > 0) {
		if(mod(iPositionWorld.x+0.005,1.0) < 0.01 ||  mod(iPositionWorld.y+0.005,1.0) < 0.01 || mod(iPositionWorld.z+0.005,1.0) < 0.01) {
			gl_FragColor = vec4(1,1,0,1);
		}
	}
}
void applySceneLights() {torchlight(vec3(-5.057,0.859,12.594),vec3(2.000,1.500,0.600),0.00,20.000,2.000);
torchlight(vec3(-12.265,0.990,5.640),vec3(2.000,1.500,0.600),0.00,20.000,2.000);
torchlight(vec3(-13.398,1.046,-2.286),vec3(2.000,1.500,0.600),0.00,20.000,2.000);
ambientLight = vec3(0.100,0.100,0.100);
light(vec3(10.126,5.268,3.379),vec3(1.000,1.000,1.000),0.00,20.000,2.000);
torchlight(vec3(4.856,1.230,12.682),vec3(2.000,1.500,0.600),0.00,20.000,2.000);
torchlight(vec3(-5.740,1.037,-12.309),vec3(2.000,1.500,0.600),0.00,20.000,2.000);
light(vec3(2.832,3.349,-2.640),vec3(0.000,0.000,4.000),0.00,20.000,2.000);
light(vec3(-2.476,-0.416,2.547),vec3(1.000,0.000,0.000),0.00,20.000,2.000);
torchlight(vec3(11.982,1.019,6.544),vec3(2.000,1.500,0.600),0.00,20.000,2.000);
torchlight(vec3(10.017,0.958,-9.252),vec3(2.000,1.500,0.600),0.00,20.000,2.000);
}